import { create as createSubmission, destroy, store, update } from '@/routes/admin/homework-submissions';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, Edit3, FileText, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { toast } from 'sonner';

interface HomeworkAssignmentOption {
    id: number;
    titleKh: string;
    titleEn: string;
    className: string;
    points: number;
    dueOn: string;
}

interface StudentOption {
    id: number;
    nameKh: string;
    nameEn: string;
    level: string;
    className: string;
}

interface SubmissionItem {
    id: number;
    homeworkAssignmentId: number;
    assignmentTitleKh: string;
    assignmentTitleEn: string;
    className: string;
    points: number;
    dueOn: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    studentPhoto: string | null;
    level: string;
    submittedAt: string;
    score: number | null;
    attachmentName: string;
    attachmentUrl: string;
    status: HomeworkSubmissionStatus;
    feedback: string;
}

interface HomeworkSubmissionsPageProps {
    submissions: SubmissionItem[];
    assignments: HomeworkAssignmentOption[];
    students: StudentOption[];
    summary: {
        submissionCount: number;
        submittedCount: number;
        gradedCount: number;
        missingCount: number;
        averageScore: number;
    };
}

interface HomeworkSubmissionFormData {
    homework_assignment_id: number | null;
    student_id: number | null;
    submitted_at: string;
    score: number | null;
    status: HomeworkSubmissionStatus;
    feedback: string;
}

type DrawerMode = 'create' | 'edit';
type HomeworkSubmissionStatus = 'pending' | 'submitted' | 'graded' | 'missing';
type AssignmentFilter = 'all' | `title:${string}`;
type OrderKey = 'student-asc' | 'homework-asc' | 'submitted-desc' | 'score-desc' | 'status-asc';

const statusType = {
    pending: 'amber',
    submitted: 'blue',
    graded: 'green',
    missing: 'red',
} as const;

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'student-asc', label: 'Student A -> Z' },
    { value: 'homework-asc', label: 'Homework A -> Z' },
    { value: 'submitted-desc', label: 'Submitted newest' },
    { value: 'score-desc', label: 'Score highest' },
    { value: 'status-asc', label: 'Status A -> Z' },
];

function assignmentLabel(assignment: HomeworkAssignmentOption): string {
    return assignment.titleEn || assignment.titleKh || `Homework #${assignment.id}`;
}

function submissionAssignmentLabel(submission: SubmissionItem): string {
    return submission.assignmentTitleEn || submission.assignmentTitleKh || `Homework #${submission.homeworkAssignmentId}`;
}

function assignmentFilterTitle(filter: AssignmentFilter): string | null {
    return filter === 'all' ? null : filter.slice('title:'.length);
}

function sortSubmissions(list: SubmissionItem[], order: OrderKey): SubmissionItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'student-asc':
                return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'homework-asc':
                return submissionAssignmentLabel(a).localeCompare(submissionAssignmentLabel(b));
            case 'submitted-desc':
                return (b.submittedAt || '').localeCompare(a.submittedAt || '');
            case 'score-desc':
                return (b.score ?? -1) - (a.score ?? -1);
            case 'status-asc':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });
}

function formatSubmittedAt(value: string): string {
    if (!value) {
        return 'Not submitted';
    }

    return value.replace('T', ' ');
}

function nowDateTimeValue(): string {
    const now = new Date();
    const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return offsetDate.toISOString().slice(0, 16);
}

function emptyForm(assignments: HomeworkAssignmentOption[], students: StudentOption[]): HomeworkSubmissionFormData {
    return {
        homework_assignment_id: assignments[0]?.id ?? null,
        student_id: students[0]?.id ?? null,
        submitted_at: '',
        score: null,
        status: 'pending',
        feedback: '',
    };
}

export default function HomeworkSubmissionsPage({ submissions, assignments, students, summary }: HomeworkSubmissionsPageProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentFilter>('all');
    const [search, setSearch] = useState('');
    const [submittedDate, setSubmittedDate] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('student-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [homeworkPickerOpen, setHomeworkPickerOpen] = useState(false);
    const [homeworkSearch, setHomeworkSearch] = useState('');
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingSubmission, setEditingSubmission] = useState<SubmissionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubmissionItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<HomeworkSubmissionFormData>(emptyForm(assignments, students));

    const selectedHomework = assignments.find(assignment => assignment.id === data.homework_assignment_id);
    const selectedStudent = students.find(student => student.id === data.student_id);

    const assignmentOptions = useMemo(() => {
        const titles = new Map<string, string>();

        assignments.forEach(assignment => {
            const label = assignmentLabel(assignment);
            titles.set(label.toLowerCase(), label);
        });

        return [...titles.values()].sort((a, b) => a.localeCompare(b));
    }, [assignments]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const selectedTitle = assignmentFilterTitle(selectedAssignment)?.toLowerCase() ?? null;

        const base = submissions.filter(submission => {
            const title = submissionAssignmentLabel(submission);
            const matchesAssignment = !selectedTitle || title.toLowerCase() === selectedTitle;
            const matchesDate = !submittedDate || submission.submittedAt.slice(0, 10) === submittedDate;
            const matchesSearch = !query
                || submission.studentNameKh.toLowerCase().includes(query)
                || submission.studentNameEn.toLowerCase().includes(query)
                || title.toLowerCase().includes(query)
                || submission.className.toLowerCase().includes(query)
                || submission.status.toLowerCase().includes(query);

            return matchesAssignment && matchesDate && matchesSearch;
        });

        return sortSubmissions(base, orderBy);
    }, [submissions, selectedAssignment, submittedDate, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const searchableAssignments = useMemo(() => {
        const query = homeworkSearch.toLowerCase();

        return assignments.filter(assignment => {
            const label = assignmentLabel(assignment);

            return !query
                || label.toLowerCase().includes(query)
                || assignment.className.toLowerCase().includes(query)
                || assignment.dueOn.toLowerCase().includes(query);
        });
    }, [assignments, homeworkSearch]);

    const searchableStudents = useMemo(() => {
        const query = studentSearch.toLowerCase();

        return students.filter(student => !query
            || student.nameKh.toLowerCase().includes(query)
            || student.nameEn.toLowerCase().includes(query)
            || student.className.toLowerCase().includes(query)
            || student.level.toLowerCase().includes(query));
    }, [students, studentSearch]);

    useEffect(() => {
        setPage(1);
    }, [selectedAssignment, submittedDate, search, orderBy, perPage]);

    const openCreateDrawer = () => {
        const selectedTitle = assignmentFilterTitle(selectedAssignment);
        const selectedAssignmentId = selectedTitle
            ? assignments.find(assignment => assignmentLabel(assignment) === selectedTitle)?.id
            : null;

        reset();
        setData({
            ...emptyForm(assignments, students),
            homework_assignment_id: selectedAssignmentId ?? assignments[0]?.id ?? null,
        });
        setHomeworkSearch('');
        setStudentSearch('');
        setEditingSubmission(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (submission: SubmissionItem) => {
        setData({
            homework_assignment_id: submission.homeworkAssignmentId,
            student_id: submission.studentId,
            submitted_at: submission.submittedAt ? submission.submittedAt.replace(' ', 'T') : '',
            score: submission.score,
            status: submission.status,
            feedback: submission.feedback,
        });
        setHomeworkSearch('');
        setStudentSearch('');
        setEditingSubmission(submission);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingSubmission(null);
        setHomeworkPickerOpen(false);
        setStudentPickerOpen(false);
    };

    const selectHomework = (assignmentId: number) => {
        setData('homework_assignment_id', assignmentId);
        setHomeworkPickerOpen(false);
        setHomeworkSearch('');
    };

    const selectStudent = (studentId: number) => {
        setData('student_id', studentId);
        setStudentPickerOpen(false);
        setStudentSearch('');
    };

    const submitSubmission = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Homework submission updated.' : 'Homework submission created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingSubmission) {
            put(update.url(editingSubmission.id), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Homework submission deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Homework Submissions</div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Track submitted work, grades, and feedback</KH>
                    </div>
                    <button onClick={openCreateDrawer} style={primaryButton}>
                        <Plus size={16} />
                        Add Submission
                    </button>
                    <button onClick={() => router.visit(createSubmission.url())} style={{ ...primaryButton, background: '#16a34a' }}>
                        <Upload size={16} />
                        Student Submit
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Submissions', value: summary.submissionCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Submitted', value: summary.submittedCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Graded', value: summary.gradedCount, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Missing', value: summary.missingCount, color: '#ef4444', bg: '#fff1f2' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 160, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                        <Select value={perPage.toString()} onValueChange={value => { setPerPage(Number(value)); setPage(1); }}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(size => (
                                    <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAssignment} onValueChange={value => setSelectedAssignment(value as AssignmentFilter)}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 220, maxWidth: 320, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All homework</SelectItem>
                                {assignmentOptions.map(title => (
                                    <SelectItem key={title} value={`title:${title}`}>{title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DatePicker
                            value={submittedDate}
                            onChange={setSubmittedDate}
                            placeholder="Submitted date"
                            className="h-auto w-auto min-w-[160px] px-3 py-[7px] text-xs font-bold"
                        />

                        {submittedDate && (
                            <button
                                type="button"
                                onClick={() => setSubmittedDate('')}
                                style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                                <X size={13} /> Clear date
                            </button>
                        )}

                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} submission{filtered.length !== 1 ? 's' : ''}</span>
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="f-input"
                            style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                            placeholder="Search submissions..."
                        />
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Homework</th>
                                <th>Submitted</th>
                                <th>File</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '38px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        {search ? <>No homework submissions found for <strong>"{search}"</strong></> : 'No homework submissions found'}
                                    </td>
                                </tr>
                            ) : paginated.map(submission => {
                                const percent = submission.score === null ? 0 : Math.round((submission.score / Math.max(submission.points, 1)) * 100);

                                return (
                                    <tr key={submission.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={submission.studentNameEn} src={submission.studentPhoto} size={34} />
                                                <div>
                                                    <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{submission.studentNameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{submission.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, fontSize: 12, color: '#1e293b' }}>{submission.assignmentTitleEn || submission.assignmentTitleKh}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{submission.className || submission.dueOn}</div>
                                        </td>
                                        <td style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{submission.submittedAt || '-'}</td>
                                        <td>
                                            {submission.attachmentUrl ? (
                                                <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                    <FileText size={14} /> {submission.attachmentName || 'File'}
                                                </a>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: 12 }}>No file</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                                                <PBar value={percent} color={percent >= 75 ? 'green' : percent >= 50 ? 'blue' : 'red'} />
                                                <span style={{ width: 62, fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{submission.score ?? '-'} / {submission.points}</span>
                                            </div>
                                        </td>
                                        <td><Badge type={statusType[submission.status]}>{submission.status}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openEditDrawer(submission)} style={iconButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit"><Edit3 size={14} /></button>
                                                <button onClick={() => setDeleteTarget(submission)} style={iconButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length > 0 && (
                        <Pagination
                            total={filtered.length}
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                            showPerPage={false}
                        />
                    )}
                </div>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitSubmission} className="flex min-h-full flex-col bg-white">
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create' ? 'Add Homework Submission' : 'Edit Homework Submission'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Record a student submission' : editingSubmission?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Field label="Homework" error={errors.homework_assignment_id} wide>
                                    <SearchablePicker
                                        open={homeworkPickerOpen}
                                        onOpenChange={setHomeworkPickerOpen}
                                        search={homeworkSearch}
                                        onSearchChange={setHomeworkSearch}
                                        placeholder="Select homework"
                                        searchPlaceholder="Search homework..."
                                        selectedLabel={selectedHomework ? assignmentLabel(selectedHomework) : null}
                                        emptyLabel="No homework found"
                                    >
                                        {searchableAssignments.map(assignment => {
                                            const selected = assignment.id === data.homework_assignment_id;

                                            return (
                                                <PickerOption key={assignment.id} selected={selected} onClick={() => selectHomework(assignment.id)}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignmentLabel(assignment)}</span>
                                                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {assignment.className || 'No class'}{assignment.dueOn ? ` - Due ${assignment.dueOn}` : ''}
                                                    </span>
                                                </PickerOption>
                                            );
                                        })}
                                    </SearchablePicker>
                                </Field>
                                <Field label="Student" error={errors.student_id} wide>
                                    <SearchablePicker
                                        open={studentPickerOpen}
                                        onOpenChange={setStudentPickerOpen}
                                        search={studentSearch}
                                        onSearchChange={setStudentSearch}
                                        placeholder="Select student"
                                        searchPlaceholder="Search students..."
                                        selectedLabel={selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : null}
                                        emptyLabel="No students found"
                                    >
                                        {searchableStudents.map(student => {
                                            const selected = student.id === data.student_id;

                                            return (
                                                <PickerOption key={student.id} selected={selected} onClick={() => selectStudent(student.id)}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.nameEn}</span>
                                                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {student.nameKh} - {student.className || student.level}
                                                    </span>
                                                </PickerOption>
                                            );
                                        })}
                                    </SearchablePicker>
                                </Field>
                                <Field label="Submitted At" error={errors.submitted_at}>
                                    <Select value={data.submitted_at || 'none'} onValueChange={value => setData('submitted_at', value === 'none' ? '' : value === 'now' ? nowDateTimeValue() : value)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not submitted</SelectItem>
                                            <SelectItem value="now">Now</SelectItem>
                                            {data.submitted_at && <SelectItem value={data.submitted_at}>{formatSubmittedAt(data.submitted_at)}</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Score" error={errors.score}>
                                    <input type="number" min={0} max={1000} style={fieldStyle} value={data.score ?? ''} onChange={event => setData('score', event.target.value === '' ? null : Number(event.target.value))} />
                                </Field>
                                <Field label="Status" error={errors.status} wide>
                                    <Select value={data.status} onValueChange={value => setData('status', value as HomeworkSubmissionStatus)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="graded">Graded</SelectItem>
                                            <SelectItem value="missing">Missing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Feedback" error={errors.feedback} wide>
                                    <textarea style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }} value={data.feedback} onChange={event => setData('feedback', event.target.value)} />
                                </Field>
                            </div>

                            <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={16} /> Cancel</button>
                                <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Save size={16} /> {drawerMode === 'create' ? 'Save Submission' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Homework Submission?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove submission for <strong>{deleteTarget.studentNameEn}</strong>?</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
    return (
        <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>{label}</label>
            {children}
            {error && <div className="field-error">{error}</div>}
        </div>
    );
}

function SearchablePicker({
    open,
    onOpenChange,
    search,
    onSearchChange,
    placeholder,
    searchPlaceholder,
    selectedLabel,
    emptyLabel,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    selectedLabel: string | null;
    emptyLabel: string;
    children: ReactNode;
}) {
    const hasOptions = Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="f-input"
                    style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', cursor: 'pointer' }}
                >
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedLabel ?? placeholder}
                    </span>
                    <ChevronsUpDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        autoFocus
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#1e293b' }}
                    />
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}>
                    {hasOptions ? children : (
                        <div style={{ padding: '18px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>
                            {emptyLabel}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PickerOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ width: '100%', border: 'none', background: selected ? '#eff6ff' : 'transparent', color: '#1e293b', borderRadius: 8, padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
        >
            <Check size={15} style={{ color: selected ? '#2563eb' : 'transparent', flexShrink: 0 }} />
            <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
        </button>
    );
}

function iconButton(background: string, color: string, border: string): CSSProperties {
    return {
        background,
        color,
        border: `1px solid ${border}`,
        borderRadius: 7,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

const primaryButton: CSSProperties = {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '9px 18px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
};

const fieldStyle: CSSProperties = {
    width: '100%',
    minHeight: 42,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};
