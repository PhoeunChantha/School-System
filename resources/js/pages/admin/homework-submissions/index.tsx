import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/HomeworkSubmissionController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, PBar } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
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
    level: string;
    submittedAt: string;
    score: number | null;
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

const statusType = {
    pending: 'amber',
    submitted: 'blue',
    graded: 'green',
    missing: 'red',
} as const;

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
    const [selectedAssignment, setSelectedAssignment] = useState<number | 'all'>('all');
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingSubmission, setEditingSubmission] = useState<SubmissionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubmissionItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<HomeworkSubmissionFormData>(emptyForm(assignments, students));

    const filtered = useMemo(
        () => selectedAssignment === 'all' ? submissions : submissions.filter(submission => submission.homeworkAssignmentId === selectedAssignment),
        [submissions, selectedAssignment],
    );

    const openCreateDrawer = () => {
        reset();
        setData({
            ...emptyForm(assignments, students),
            homework_assignment_id: selectedAssignment === 'all' ? assignments[0]?.id ?? null : selectedAssignment,
        });
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
        setEditingSubmission(submission);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingSubmission(null);
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
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <select style={selectStyle} value={selectedAssignment} onChange={event => setSelectedAssignment(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
                            <option value="all">All homework</option>
                            {assignments.map(assignment => <option key={assignment.id} value={assignment.id}>{assignment.titleEn || assignment.titleKh}</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} submission{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Homework</th>
                                <th>Submitted</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '38px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        No homework submissions found
                                    </td>
                                </tr>
                            ) : filtered.map(submission => {
                                const percent = submission.score === null ? 0 : Math.round((submission.score / Math.max(submission.points, 1)) * 100);

                                return (
                                    <tr key={submission.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={submission.studentNameEn} size={34} />
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
                                    <select style={fieldStyle} value={data.homework_assignment_id ?? ''} onChange={event => setData('homework_assignment_id', Number(event.target.value) || null)}>
                                        {assignments.map(assignment => <option key={assignment.id} value={assignment.id}>{assignment.titleEn || assignment.titleKh}</option>)}
                                    </select>
                                </Field>
                                <Field label="Student" error={errors.student_id} wide>
                                    <select style={fieldStyle} value={data.student_id ?? ''} onChange={event => setData('student_id', Number(event.target.value) || null)}>
                                        {students.map(student => <option key={student.id} value={student.id}>{student.nameEn} - {student.className || student.level}</option>)}
                                    </select>
                                </Field>
                                <Field label="Submitted At" error={errors.submitted_at}>
                                    <input type="datetime-local" style={fieldStyle} value={data.submitted_at} onChange={event => setData('submitted_at', event.target.value)} />
                                </Field>
                                <Field label="Score" error={errors.score}>
                                    <input type="number" min={0} max={1000} style={fieldStyle} value={data.score ?? ''} onChange={event => setData('score', event.target.value === '' ? null : Number(event.target.value))} />
                                </Field>
                                <Field label="Status" error={errors.status} wide>
                                    <select style={fieldStyle} value={data.status} onChange={event => setData('status', event.target.value as HomeworkSubmissionStatus)}>
                                        <option value="pending">Pending</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="graded">Graded</option>
                                        <option value="missing">Missing</option>
                                    </select>
                                </Field>
                                <Field label="Feedback" error={errors.feedback} wide>
                                    <textarea style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }} value={data.feedback} onChange={event => setData('feedback', event.target.value)} />
                                </Field>
                            </div>

                            <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer' }}>
                                    {drawerMode === 'create' ? 'Save Submission' : 'Save Changes'}
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
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Delete</button>
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

const selectStyle: CSSProperties = {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    background: 'white',
    color: '#374151',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    outline: 'none',
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
