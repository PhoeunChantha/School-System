import { create as createSubmission, destroy, store, update } from '@/routes/admin/homework-submissions';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, Edit3, FileText, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface HomeworkAssignmentOption {
    id: number;
    routeKey?: string;
    titleKh: string;
    titleEn: string;
    className: string;
    points: number;
    dueOn: string;
}

interface StudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    level: string;
    className: string;
}

interface SubmissionItem {
    id: number;
    routeKey?: string;
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

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

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
            case 'student-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'homework-asc': return submissionAssignmentLabel(a).localeCompare(submissionAssignmentLabel(b));
            case 'submitted-desc': return (b.submittedAt || '').localeCompare(a.submittedAt || '');
            case 'score-desc': return (b.score ?? -1) - (a.score ?? -1);
            case 'status-asc': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });
}

function formatSubmittedAt(value: string): string {
    return value ? value.replace('T', ' ') : 'Not submitted';
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
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('homework-submissions.create');
    const canUpdate = can('homework-submissions.update');
    const canDelete = can('homework-submissions.delete');
    const canManageSubmissions = canAny(['homework-submissions.update', 'homework-submissions.delete']);
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
    }, [orderBy, search, selectedAssignment, submissions, submittedDate]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const searchableAssignments = useMemo(() => {
        const query = homeworkSearch.toLowerCase();
        return assignments.filter(assignment => {
            const label = assignmentLabel(assignment);
            return !query || label.toLowerCase().includes(query) || assignment.className.toLowerCase().includes(query) || assignment.dueOn.toLowerCase().includes(query);
        });
    }, [assignments, homeworkSearch]);

    const searchableStudents = useMemo(() => {
        const query = studentSearch.toLowerCase();
        return students.filter(student => !query
            || student.nameKh.toLowerCase().includes(query)
            || student.nameEn.toLowerCase().includes(query)
            || student.className.toLowerCase().includes(query)
            || student.level.toLowerCase().includes(query));
    }, [studentSearch, students]);

    useEffect(() => {
        setPage(1);
    }, [selectedAssignment, submittedDate, search, orderBy, perPage]);

    const openCreateDrawer = () => {
        if (!canCreate) return;
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
        if (!canUpdate) return;
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

    const submitSubmission = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (drawerMode === 'edit' && !canUpdate) {
            closeDrawer();
            return;
        }
        if (drawerMode === 'create' && !canCreate) {
            closeDrawer();
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Homework submission updated.' : 'Homework submission created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingSubmission) {
            put(update.url((editingSubmission.routeKey ?? editingSubmission.id) as never), options);
            return;
        }
        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }
        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Homework submission deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Homework Submissions</div>
                        <KH className="block text-xs font-bold text-slate-400">Track submitted work, grades, and feedback</KH>
                    </div>
                    <div className="flex gap-2">
                        {canCreate && <button onClick={openCreateDrawer} className={primaryButtonClass}><Plus size={16} /> Add Submission</button>}
                        {canCreate && <button onClick={() => router.visit(createSubmission.url())} className={ghostButtonClass}><Upload size={16} /> Student Submit</button>}
                    </div>
                </div>

                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Homework submissions</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{summary.submissionCount} records</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">{summary.submittedCount} submitted - {summary.missingCount} missing</p>
                    </div>
                    {canCreate && (
                        <button onClick={openCreateDrawer} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add submission">
                            <Plus size={18} />
                        </button>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Submissions', value: summary.submissionCount, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Submitted', value: summary.submittedCount, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Graded', value: summary.gradedCount, className: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500' },
                        { label: 'Missing', value: summary.missingCount, className: 'border-red-500/25 bg-red-500/10 text-red-500' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-[18px] border p-3 ${card.className}`}>
                            <div className="text-2xl font-black leading-none">{card.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-x-0 md:border-t-0 md:shadow-none">
                        <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger className={controlInputClass}><SelectValue /></SelectTrigger>
                            <SelectContent>{ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={perPage.toString()} onValueChange={value => { setPerPage(Number(value)); setPage(1); }}>
                            <SelectTrigger className={controlInputClass}><SelectValue /></SelectTrigger>
                            <SelectContent>{[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedAssignment} onValueChange={value => setSelectedAssignment(value as AssignmentFilter)}>
                            <SelectTrigger className={`${controlInputClass} col-span-2 md:min-w-[220px] md:max-w-[320px]`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All homework</SelectItem>
                                {assignmentOptions.map(title => <SelectItem key={title} value={`title:${title}`}>{title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <DatePicker value={submittedDate} onChange={setSubmittedDate} placeholder="Submitted date" className={`${controlInputClass} h-9`} />
                        {submittedDate && (
                            <button type="button" onClick={() => setSubmittedDate('')} className={ghostButtonClass}>
                                <X size={13} /> Clear
                            </button>
                        )}
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} submission{filtered.length !== 1 ? 's' : ''}</span>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[260px]`} placeholder="Search submissions..." />
                    </div>

                    <table className="data-table hidden md:table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Homework</th>
                                <th>Submitted</th>
                                <th>File</th>
                                <th>Score</th>
                                <th>Status</th>
                                {canManageSubmissions && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageSubmissions ? 7 : 6} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No homework submissions found for <strong>"{search}"</strong></> : 'No homework submissions found'}
                                    </td>
                                </tr>
                            ) : paginated.map(submission => {
                                const percent = submission.score === null ? 0 : Math.round((submission.score / Math.max(submission.points, 1)) * 100);
                                return (
                                    <tr key={submission.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={submission.studentNameEn} src={submission.studentPhoto} size={34} />
                                                <div>
                                                    <KH className="block text-[13px] font-black text-slate-900 dark:text-slate-50">{submission.studentNameKh}</KH>
                                                    <div className="text-[11px] font-bold text-slate-400">{submission.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs font-black text-slate-900 dark:text-slate-50">{submissionAssignmentLabel(submission)}</div>
                                            <div className="text-[11px] font-bold text-slate-400">{submission.className || submission.dueOn}</div>
                                        </td>
                                        <td className="text-xs font-black text-slate-600 dark:text-slate-300">{submission.submittedAt || '-'}</td>
                                        <td>
                                            {submission.attachmentUrl ? (
                                                <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300">
                                                    <FileText size={14} /> {submission.attachmentName || 'File'}
                                                </a>
                                            ) : <span className="text-xs font-bold text-slate-400">No file</span>}
                                        </td>
                                        <td>
                                            <div className="flex min-w-[140px] items-center gap-2">
                                                <PBar value={percent} color={percent >= 75 ? 'green' : percent >= 50 ? 'blue' : 'red'} />
                                                <span className="w-16 text-xs font-black text-slate-900 dark:text-slate-50">{submission.score ?? '-'} / {submission.points}</span>
                                            </div>
                                        </td>
                                        <td><Badge type={statusType[submission.status]}>{submission.status}</Badge></td>
                                        {canManageSubmissions && (
                                            <td>
                                                <RowActions
                                                    ariaLabel={`Actions for ${submission.studentNameEn}`}
                                                    actions={[
                                                        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(submission), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(submission), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                    ]}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginated.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {search ? <>No homework submissions found for <strong>"{search}"</strong></> : 'No homework submissions found'}
                            </div>
                        ) : paginated.map(submission => {
                            const percent = submission.score === null ? 0 : Math.round((submission.score / Math.max(submission.points, 1)) * 100);
                            return (
                                <article key={submission.id} className={mobileCardClass}>
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar name={submission.studentNameEn} src={submission.studentPhoto} size={36} />
                                            <div className="min-w-0">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{submission.studentNameKh}</KH>
                                                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{submission.studentNameEn} - {submission.className || submission.level}</p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Badge type={statusType[submission.status]}>{submission.status}</Badge>
                                            {canManageSubmissions && (
                                                <RowActions
                                                    ariaLabel={`Actions for ${submission.studentNameEn}`}
                                                    actions={[
                                                        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(submission), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(submission), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                    ]}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-3 rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Homework</span>
                                        <strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{submissionAssignmentLabel(submission)}</strong>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Submitted</span>
                                            <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{formatSubmittedAt(submission.submittedAt)}</strong>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Score</span>
                                            <strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{submission.score ?? '-'} / {submission.points}</strong>
                                        </div>
                                    </div>
                                    <div className="mt-3 rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-950">
                                        <PBar value={percent} color={percent >= 75 ? 'green' : percent >= 50 ? 'blue' : 'red'} />
                                    </div>
                                    {submission.attachmentUrl && (
                                        <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 rounded-xl bg-blue-500/10 px-2.5 py-2 text-[11px] font-black text-blue-600 dark:text-blue-300">
                                            <FileText size={12} /> <span className="truncate">{submission.attachmentName || 'File'}</span>
                                        </a>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitSubmission} className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
                            <SheetHeader className="border-b border-slate-200 bg-white px-5 py-4 text-left dark:border-slate-700 dark:bg-slate-800">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {drawerMode === 'create' ? 'Add Homework Submission' : 'Edit Homework Submission'}
                                </SheetTitle>
                                <SheetDescription className="text-xs font-bold text-slate-400">
                                    {drawerMode === 'create' ? 'Record a student submission' : editingSubmission?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-2 gap-3 p-3 md:p-5">
                                <Field label="Homework" error={errors.homework_assignment_id} wide>
                                    <SearchablePicker open={homeworkPickerOpen} onOpenChange={setHomeworkPickerOpen} search={homeworkSearch} onSearchChange={setHomeworkSearch} placeholder="Select homework" searchPlaceholder="Search homework..." selectedLabel={selectedHomework ? assignmentLabel(selectedHomework) : null} emptyLabel="No homework found">
                                        {searchableAssignments.map(assignment => {
                                            const selected = assignment.id === data.homework_assignment_id;
                                            return (
                                                <PickerOption key={assignment.id} selected={selected} onClick={() => { setData('homework_assignment_id', assignment.id); setHomeworkPickerOpen(false); setHomeworkSearch(''); }}>
                                                    <span className="block truncate text-[13px] font-black">{assignmentLabel(assignment)}</span>
                                                    <span className="block truncate text-[11px] font-bold text-slate-400">{assignment.className || 'No class'}{assignment.dueOn ? ` - Due ${assignment.dueOn}` : ''}</span>
                                                </PickerOption>
                                            );
                                        })}
                                    </SearchablePicker>
                                </Field>
                                <Field label="Student" error={errors.student_id} wide>
                                    <SearchablePicker open={studentPickerOpen} onOpenChange={setStudentPickerOpen} search={studentSearch} onSearchChange={setStudentSearch} placeholder="Select student" searchPlaceholder="Search students..." selectedLabel={selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : null} emptyLabel="No students found">
                                        {searchableStudents.map(student => {
                                            const selected = student.id === data.student_id;
                                            return (
                                                <PickerOption key={student.id} selected={selected} onClick={() => { setData('student_id', student.id); setStudentPickerOpen(false); setStudentSearch(''); }}>
                                                    <span className="block truncate text-[13px] font-black">{student.nameEn}</span>
                                                    <span className="block truncate text-[11px] font-bold text-slate-400">{student.nameKh} - {student.className || student.level}</span>
                                                </PickerOption>
                                            );
                                        })}
                                    </SearchablePicker>
                                </Field>
                                <Field label="Submitted At" error={errors.submitted_at}>
                                    <Select value={data.submitted_at || 'none'} onValueChange={value => setData('submitted_at', value === 'none' ? '' : value === 'now' ? nowDateTimeValue() : value)}>
                                        <SelectTrigger className={fieldInputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not submitted</SelectItem>
                                            <SelectItem value="now">Now</SelectItem>
                                            {data.submitted_at && <SelectItem value={data.submitted_at}>{formatSubmittedAt(data.submitted_at)}</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Score" error={errors.score}>
                                    <input type="number" min={0} max={1000} className={fieldInputClass} value={data.score ?? ''} onChange={event => setData('score', event.target.value === '' ? null : Number(event.target.value))} />
                                </Field>
                                <Field label="Status" error={errors.status} wide>
                                    <Select value={data.status} onValueChange={value => setData('status', value as HomeworkSubmissionStatus)}>
                                        <SelectTrigger className={fieldInputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="graded">Graded</SelectItem>
                                            <SelectItem value="missing">Missing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Feedback" error={errors.feedback} wide>
                                    <textarea className={`${fieldInputClass} min-h-28 resize-y`} value={data.feedback} onChange={event => setData('feedback', event.target.value)} />
                                </Field>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 md:p-5">
                                <button type="button" onClick={closeDrawer} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"><X size={16} /> Cancel</button>
                                <button disabled={processing} type="submit" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-900">
                                    <Save size={16} /> {drawerMode === 'create' ? 'Save Submission' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {deleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Homework Submission?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove submission for <strong>{deleteTarget.studentNameEn}</strong>?</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white transition hover:bg-red-600"><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={`${fieldGroupClass} ${wide ? 'col-span-2' : ''}`}>
            <label className={fieldLabelClass}>{label}</label>
            {children}
            {error && <div className={errorTextClass}>{error}</div>}
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
                <button type="button" className={`${fieldInputClass} flex items-center justify-between gap-2 text-left`}>
                    <span className="min-w-0 truncate">{selectedLabel ?? placeholder}</span>
                    <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-200 p-2.5 dark:border-slate-700">
                    <Search size={15} className="shrink-0 text-slate-400" />
                    <input value={search} onChange={event => onSearchChange(event.target.value)} placeholder={searchPlaceholder} autoFocus className="w-full border-0 bg-transparent text-[13px] font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
                </div>
                <div className="max-h-[280px] overflow-y-auto p-1.5">
                    {hasOptions ? children : <div className="px-2.5 py-5 text-center text-[13px] font-bold text-slate-400">{emptyLabel}</div>}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PickerOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${selected ? 'bg-blue-50 text-slate-900 dark:bg-blue-500/15 dark:text-slate-50' : 'text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800'}`}>
            <Check size={15} className={`shrink-0 ${selected ? 'text-blue-600' : 'text-transparent'}`} />
            <span className="min-w-0 flex-1">{children}</span>
        </button>
    );
}
