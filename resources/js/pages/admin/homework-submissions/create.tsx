import { index as submissionsIndex, store } from '@/actions/App/Http/Controllers/Backends/HomeworkSubmissionController';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, FileText, Search, Upload } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface CreateHomeworkSubmissionPageProps {
    assignments: HomeworkAssignmentOption[];
    students: StudentOption[];
}

interface StudentSubmissionFormData {
    homework_assignment_id: number | null;
    student_id: number | null;
    submitted_at: string;
    score: null;
    status: 'submitted';
    feedback: string;
    attachment_file: File | null;
}

function assignmentLabel(assignment: HomeworkAssignmentOption): string {
    return assignment.titleEn || assignment.titleKh || `Homework #${assignment.id}`;
}

function nowDateTimeValue(): string {
    const now = new Date();
    const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return offsetDate.toISOString().slice(0, 16);
}

export default function CreateHomeworkSubmissionPage({ assignments, students }: CreateHomeworkSubmissionPageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [homeworkPickerOpen, setHomeworkPickerOpen] = useState(false);
    const [homeworkSearch, setHomeworkSearch] = useState('');
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm<StudentSubmissionFormData>({
        homework_assignment_id: assignments[0]?.id ?? null,
        student_id: students[0]?.id ?? null,
        submitted_at: nowDateTimeValue(),
        score: null,
        status: 'submitted',
        feedback: '',
        attachment_file: null,
    });

    const selectedHomework = assignments.find(assignment => assignment.id === data.homework_assignment_id);
    const selectedStudent = students.find(student => student.id === data.student_id);

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
    }, [studentSearch, students]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Homework submitted successfully.'),
            onError: () => toast.error('Unable to submit homework. Please check the form.'),
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 20, color: '#1e293b' }}>Student Submit Homework</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Upload completed homework for a student</div>
                    </div>
                    <Link href={submissionsIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                        Back to Submissions
                    </Link>
                </div>

                <form onSubmit={submit} className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 860, width: '100%', margin: '0 auto' }}>
                    <Field label="Homework" error={errors.homework_assignment_id} wide>
                        <SearchablePicker
                            open={homeworkPickerOpen}
                            onOpenChange={setHomeworkPickerOpen}
                            search={homeworkSearch}
                            onSearchChange={setHomeworkSearch}
                            placeholder="Select homework"
                            searchPlaceholder="Search homework..."
                            selectedLabel={selectedHomework ? `${assignmentLabel(selectedHomework)} - ${selectedHomework.className}` : null}
                            emptyLabel="No homework found"
                        >
                            {searchableAssignments.map(assignment => (
                                <PickerOption key={assignment.id} selected={assignment.id === data.homework_assignment_id} onClick={() => {
                                    setData('homework_assignment_id', assignment.id);
                                    setHomeworkPickerOpen(false);
                                    setHomeworkSearch('');
                                }}>
                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{assignmentLabel(assignment)}</span>
                                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{assignment.className || 'No class'} - Due {assignment.dueOn || '-'}</span>
                                </PickerOption>
                            ))}
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
                            {searchableStudents.map(student => (
                                <PickerOption key={student.id} selected={student.id === data.student_id} onClick={() => {
                                    setData('student_id', student.id);
                                    setStudentPickerOpen(false);
                                    setStudentSearch('');
                                }}>
                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{student.nameEn}</span>
                                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{student.nameKh} - {student.className || student.level}</span>
                                </PickerOption>
                            ))}
                        </SearchablePicker>
                    </Field>

                    <Field label="Submitted At" error={errors.submitted_at}>
                        <input type="datetime-local" className="f-input" value={data.submitted_at} onChange={event => setData('submitted_at', event.target.value)} />
                    </Field>

                    <Field label="Message / Note" error={errors.feedback}>
                        <input className="f-input" value={data.feedback} onChange={event => setData('feedback', event.target.value)} placeholder="Optional note" />
                    </Field>

                    <Field label="Completed Homework File" error={errors.attachment_file} wide>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', minHeight: 76, background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                            <span style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {data.attachment_file ? <FileText size={20} /> : <Upload size={20} />}
                            </span>
                            <span style={{ minWidth: 0, flex: 1 }}>
                                <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.attachment_file?.name || 'Upload completed homework'}
                                </span>
                                <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                    PDF, Word, Excel, PowerPoint, JPG, or PNG up to 10MB
                                </span>
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                            style={{ display: 'none' }}
                            onChange={event => setData('attachment_file', event.target.files?.[0] ?? null)}
                        />
                    </Field>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                        <Link href={submissionsIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 800, textDecoration: 'none' }}>
                            Cancel
                        </Link>
                        <button disabled={processing} type="submit" style={{ background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 900, cursor: processing ? 'default' : 'pointer' }}>
                            Submit Homework
                        </button>
                    </div>
                </form>
            </div>
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
                <button type="button" className="f-input" style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', cursor: 'pointer' }}>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel ?? placeholder}</span>
                    <ChevronsUpDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input value={search} onChange={event => onSearchChange(event.target.value)} placeholder={searchPlaceholder} autoFocus style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#1e293b' }} />
                </div>
                <div
                    style={{ maxHeight: 280, overflowY: 'auto', overscrollBehavior: 'contain', padding: 6 }}
                    onWheelCapture={event => event.stopPropagation()}
                    onTouchMoveCapture={event => event.stopPropagation()}
                >
                    {hasOptions ? children : <div style={{ padding: '18px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{emptyLabel}</div>}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PickerOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" onClick={onClick} style={{ width: '100%', border: 'none', background: selected ? '#eff6ff' : 'transparent', color: '#1e293b', borderRadius: 8, padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}>
            <Check size={15} style={{ color: selected ? '#2563eb' : 'transparent', flexShrink: 0 }} />
            <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
        </button>
    );
}



