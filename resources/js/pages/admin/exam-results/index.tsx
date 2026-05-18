import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ExamResultController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { toast } from 'sonner';

interface ExamOption {
    id: number;
    routeKey?: string;
    title: string;
    subject: string;
    examDate: string;
}

interface StudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    level: string;
    className: string;
}

interface ExamResultItem {
    id: number;
    routeKey?: string;
    examId: number;
    examTitle: string;
    examSubject: string;
    examDate: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    level: string;
    className: string;
    score: number | null;
    maxScore: number;
    percent: number;
    status: ExamResultStatus;
    note: string;
}

interface ExamResultsPageProps {
    results: ExamResultItem[];
    exams: ExamOption[];
    students: StudentOption[];
    summary: {
        resultCount: number;
        passedCount: number;
        failedCount: number;
        pendingCount: number;
        averagePercent: number;
    };
}

interface ExamResultFormData {
    exam_id: number | null;
    student_id: number | null;
    score: number | null;
    max_score: number;
    status: ExamResultStatus;
    note: string;
}

type DrawerMode = 'create' | 'edit';
type ExamResultStatus = 'pending' | 'passed' | 'failed' | 'absent';
type OrderKey = 'student-asc' | 'student-desc' | 'score-desc' | 'score-asc' | 'status-asc' | 'exam-asc';

const statusType = {
    pending: 'amber',
    passed: 'green',
    failed: 'red',
    absent: 'gray',
} as const;

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'student-asc', label: 'Student A-Z' },
    { value: 'student-desc', label: 'Student Z-A' },
    { value: 'score-desc', label: 'Score high-low' },
    { value: 'score-asc', label: 'Score low-high' },
    { value: 'status-asc', label: 'Status A-Z' },
    { value: 'exam-asc', label: 'Exam A-Z' },
];

function sortResults(results: ExamResultItem[], orderBy: OrderKey): ExamResultItem[] {
    return [...results].sort((a, b) => {
        if (orderBy === 'student-desc') {
            return b.studentNameEn.localeCompare(a.studentNameEn);
        }

        if (orderBy === 'score-desc') {
            return (b.percent ?? 0) - (a.percent ?? 0);
        }

        if (orderBy === 'score-asc') {
            return (a.percent ?? 0) - (b.percent ?? 0);
        }

        if (orderBy === 'status-asc') {
            return a.status.localeCompare(b.status);
        }

        if (orderBy === 'exam-asc') {
            return a.examTitle.localeCompare(b.examTitle);
        }

        return a.studentNameEn.localeCompare(b.studentNameEn);
    });
}

function emptyForm(exams: ExamOption[], students: StudentOption[]): ExamResultFormData {
    return {
        exam_id: exams[0]?.id ?? null,
        student_id: students[0]?.id ?? null,
        score: null,
        max_score: 100,
        status: 'pending',
        note: '',
    };
}

export default function ExamResultsPage({ results, exams, students, summary }: ExamResultsPageProps) {
    const [selectedExam, setSelectedExam] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('student-asc');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingResult, setEditingResult] = useState<ExamResultItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ExamResultItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<ExamResultFormData>(emptyForm(exams, students));

    useEffect(() => { setPage(1); }, [selectedExam, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const byExam = selectedExam === 'all' ? results : results.filter(result => result.examId === selectedExam);
        const bySearch = byExam.filter(result =>
            !q ||
            result.studentNameKh.includes(search) ||
            result.studentNameEn.toLowerCase().includes(q) ||
            result.examTitle.toLowerCase().includes(q) ||
            result.examSubject.toLowerCase().includes(q) ||
            result.className.toLowerCase().includes(q) ||
            result.level.toLowerCase().includes(q) ||
            result.status.toLowerCase().includes(q) ||
            result.examDate.includes(search)
        );

        return sortResults(bySearch, orderBy);
    }, [results, selectedExam, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const openCreateDrawer = () => {
        reset();
        setData({
            ...emptyForm(exams, students),
            exam_id: selectedExam === 'all' ? exams[0]?.id ?? null : selectedExam,
        });
        setEditingResult(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (result: ExamResultItem) => {
        setData({
            exam_id: result.examId,
            student_id: result.studentId,
            score: result.score,
            max_score: result.maxScore,
            status: result.status,
            note: result.note,
        });
        setEditingResult(result);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingResult(null);
    };

    const submitResult = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Exam result updated.' : 'Exam result created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingResult) {
            put(update.url((editingResult.routeKey ?? editingResult.id) as never), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Exam result deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Exam Results</div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>លទ្ធផលប្រឡង - Record student exam scores</KH>
                    </div>
                    <button onClick={openCreateDrawer} style={primaryButton}>
                        <Plus size={16} />
                        Add Result
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Results', value: summary.resultCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Average', value: `${summary.averagePercent || 0}%`, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Passed', value: summary.passedCount, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Pending', value: summary.pendingCount, color: '#f59e0b', bg: '#fffbeb' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
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

                        <Select value={String(selectedExam)} onValueChange={value => setSelectedExam(value === 'all' ? 'all' : Number(value))}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 180, maxWidth: 280, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All exams</SelectItem>
                                {exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>

                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="f-input"
                            style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                            placeholder="Search exam results..."
                        />
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Exam</th>
                                <th>Score</th>
                                <th>Percent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '38px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        {search ? <>No exam results found for <strong>"{search}"</strong></> : 'No exam results found'}
                                    </td>
                                </tr>
                            ) : paginated.map(result => (
                                <tr key={result.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={result.studentNameEn} size={34} />
                                            <div>
                                                <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{result.studentNameKh}</KH>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{result.studentNameEn}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 800, fontSize: 12, color: '#1e293b' }}>{result.examTitle}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{result.examSubject || result.examDate}</div>
                                    </td>
                                    <td style={{ fontSize: 13, fontWeight: 800 }}>{result.score ?? '-'} / {result.maxScore}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                                            <PBar value={result.percent} color={result.percent >= 75 ? 'green' : result.percent >= 50 ? 'blue' : 'red'} />
                                            <span style={{ width: 46, fontSize: 12, fontWeight: 800, color: result.percent >= 75 ? '#10b981' : result.percent >= 50 ? '#2563eb' : '#ef4444' }}>{result.percent}%</span>
                                        </div>
                                    </td>
                                    <td><Badge type={statusType[result.status]}>{result.status}</Badge></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEditDrawer(result)} style={iconButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit"><Edit3 size={14} /></button>
                                            <button onClick={() => setDeleteTarget(result)} style={iconButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        <form onSubmit={submitResult} className="flex min-h-full flex-col bg-white">
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create' ? 'Add Exam Result' : 'Edit Exam Result'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Record a score for a student' : editingResult?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Field label="Exam" error={errors.exam_id} wide>
                                    <Select value={data.exam_id ? String(data.exam_id) : ''} onValueChange={value => setData('exam_id', Number(value) || null)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue placeholder="Select exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Student" error={errors.student_id} wide>
                                    <Select value={data.student_id ? String(data.student_id) : ''} onValueChange={value => setData('student_id', Number(value) || null)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue placeholder="Select student" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map(student => <SelectItem key={student.id} value={String(student.id)}>{student.nameEn} - {student.className || student.level}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Score" error={errors.score}>
                                    <input type="number" step="0.01" min={0} style={fieldStyle} value={data.score ?? ''} onChange={event => setData('score', event.target.value === '' ? null : Number(event.target.value))} />
                                </Field>
                                <Field label="Max Score" error={errors.max_score}>
                                    <input type="number" step="0.01" min={1} style={fieldStyle} value={data.max_score} onChange={event => setData('max_score', Number(event.target.value) || 100)} />
                                </Field>
                                <Field label="Status" error={errors.status} wide>
                                    <Select value={data.status} onValueChange={value => setData('status', value as ExamResultStatus)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="passed">Passed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Note" error={errors.note} wide>
                                    <textarea style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }} value={data.note} onChange={event => setData('note', event.target.value)} />
                                </Field>
                            </div>

                            <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer' }}>
                                    {drawerMode === 'create' ? 'Save Result' : 'Save Changes'}
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
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Exam Result?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove result for <strong>{deleteTarget.studentNameEn}</strong>?</div>
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



