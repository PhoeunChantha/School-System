import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ExamResultController';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
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

const pageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

function sortResults(results: ExamResultItem[], orderBy: OrderKey): ExamResultItem[] {
    return [...results].sort((a, b) => {
        if (orderBy === 'student-desc') return b.studentNameEn.localeCompare(a.studentNameEn);
        if (orderBy === 'score-desc') return (b.percent ?? 0) - (a.percent ?? 0);
        if (orderBy === 'score-asc') return (a.percent ?? 0) - (b.percent ?? 0);
        if (orderBy === 'status-asc') return a.status.localeCompare(b.status);
        if (orderBy === 'exam-asc') return a.examTitle.localeCompare(b.examTitle);
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
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('exam-results.create');
    const canUpdate = can('exam-results.update');
    const canDelete = can('exam-results.delete');
    const canManageResults = canAny(['exam-results.update', 'exam-results.delete']);
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
        const query = search.toLowerCase();
        const byExam = selectedExam === 'all' ? results : results.filter(result => result.examId === selectedExam);
        const bySearch = byExam.filter(result =>
            !query
            || result.studentNameKh.includes(search)
            || result.studentNameEn.toLowerCase().includes(query)
            || result.examTitle.toLowerCase().includes(query)
            || result.examSubject.toLowerCase().includes(query)
            || result.className.toLowerCase().includes(query)
            || result.level.toLowerCase().includes(query)
            || result.status.toLowerCase().includes(query)
            || result.examDate.includes(search),
        );

        return sortResults(bySearch, orderBy);
    }, [orderBy, results, search, selectedExam]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const openCreateDrawer = () => {
        if (!canCreate) return;
        reset();
        setData({
            ...emptyForm(exams, students),
            exam_id: selectedExam === 'all' ? exams[0]?.id ?? null : selectedExam,
        });
        setEditingResult(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (result: ExamResultItem) => {
        if (!canUpdate) return;
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
        if (!deleteTarget) return;

        if (!canDelete) {
            setDeleteTarget(null);
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

    const resultActions = (result: ExamResultItem) => [
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(result), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(result), variant: 'destructive' as const, separatorBefore: true, hidden: !canDelete },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="min-w-0">
                        <span className="block text-xs font-black text-slate-400">Exam results</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{summary.resultCount} results</strong>
                        <p className="mt-1 truncate text-xs font-extrabold text-slate-400">{summary.averagePercent || 0}% average - {summary.passedCount} passed</p>
                    </div>
                    {canCreate && (
                        <button onClick={openCreateDrawer} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add result">
                            <Plus size={18} />
                        </button>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Results', value: summary.resultCount, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Average', value: `${summary.averagePercent || 0}%`, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Passed', value: summary.passedCount, className: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500' },
                        { label: 'Pending', value: summary.pendingCount, className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-[18px] border p-3 ${card.className}`}>
                            <div className="text-2xl font-black leading-none">{card.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{card.label}</div>
                        </div>
                    ))}
                </div>

                <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                            <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[160px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={perPage.toString()} onValueChange={value => { setPerPage(Number(value)); setPage(1); }}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[128px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={String(selectedExam)} onValueChange={value => setSelectedExam(value === 'all' ? 'all' : Number(value))}>
                                <SelectTrigger className={`${controlInputClass} col-span-2 w-full md:w-[210px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All exams</SelectItem>
                                    {exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        </div>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`} placeholder="Search exam results..." />
                    </div>

                    <table className={desktopTableClass}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Exam</th>
                                <th>Score</th>
                                <th>Percent</th>
                                <th>Status</th>
                                {canManageResults && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageResults ? 6 : 5} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No exam results found for <strong>"{search}"</strong></> : 'No exam results found'}
                                    </td>
                                </tr>
                            ) : paginated.map(result => (
                                <tr key={result.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={result.studentNameEn} size={34} />
                                            <div className="min-w-0">
                                                <KH className="block text-[13px] font-black text-slate-900 dark:text-slate-50">{result.studentNameKh}</KH>
                                                <div className="text-[11px] font-bold text-slate-400">{result.studentNameEn}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="max-w-[260px] truncate text-xs font-black text-slate-900 dark:text-slate-50">{result.examTitle}</div>
                                        <div className="text-[11px] font-bold text-slate-400">{result.examSubject || result.examDate}</div>
                                    </td>
                                    <td className="text-xs font-black text-slate-900 dark:text-slate-50">{result.score ?? '-'} / {result.maxScore}</td>
                                    <td>
                                        <div className="flex min-w-[120px] items-center gap-2">
                                            <PBar value={result.percent} color={result.percent >= 75 ? 'green' : result.percent >= 50 ? 'blue' : 'red'} />
                                            <span className={`w-11 text-xs font-black ${scoreTone(result.percent)}`}>{result.percent}%</span>
                                        </div>
                                    </td>
                                    <td><Badge type={statusType[result.status]}>{result.status}</Badge></td>
                                    {canManageResults && <td><RowActions ariaLabel={`Actions for ${result.studentNameEn}`} actions={resultActions(result)} /></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginated.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-9 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {search ? <>No exam results found for <strong>"{search}"</strong></> : 'No exam results found'}
                            </div>
                        ) : paginated.map(result => (
                            <article key={result.id} className={mobileCardClass}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <Avatar name={result.studentNameEn} size={38} />
                                        <div className="min-w-0">
                                            <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{result.studentNameKh}</KH>
                                            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{result.studentNameEn} - {result.className || result.level}</p>
                                        </div>
                                    </div>
                                    {canManageResults && <RowActions ariaLabel={`Actions for ${result.studentNameEn}`} actions={resultActions(result)} />}
                                </div>
                                <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                                    <div className="line-clamp-2 text-xs font-black text-slate-900 dark:text-slate-50">{result.examTitle}</div>
                                    <div className="mt-1 text-[11px] font-bold text-slate-400">{result.examSubject || result.examDate}</div>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <MetricTile label="Score" value={`${result.score ?? '-'} / ${result.maxScore}`} />
                                    <MetricTile label="Percent" value={`${result.percent}%`} tone={result.percent >= 75 ? 'green' : result.percent >= 50 ? 'blue' : 'red'} />
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Status</span>
                                        <div className="mt-1"><Badge type={statusType[result.status]}>{result.status}</Badge></div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <PBar value={result.percent} color={result.percent >= 75 ? 'green' : result.percent >= 50 ? 'blue' : 'red'} />
                                </div>
                            </article>
                        ))}
                    </div>

                    {filtered.length > 0 && (
                        <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </section>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitResult} className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {drawerMode === 'create' ? 'Add Exam Result' : 'Edit Exam Result'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Record a score for a student' : editingResult?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-5">
                                <Field label="Exam" error={errors.exam_id} wide>
                                    <Select value={data.exam_id ? String(data.exam_id) : ''} onValueChange={value => setData('exam_id', Number(value) || null)}>
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Select exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Student" error={errors.student_id} wide>
                                    <Select value={data.student_id ? String(data.student_id) : ''} onValueChange={value => setData('student_id', Number(value) || null)}>
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Select student" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map(student => <SelectItem key={student.id} value={String(student.id)}>{student.nameEn} - {student.className || student.level}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Score" error={errors.score}>
                                    <input type="number" step="0.01" min={0} className={inputClass} value={data.score ?? ''} onChange={event => setData('score', event.target.value === '' ? null : Number(event.target.value))} />
                                </Field>
                                <Field label="Max Score" error={errors.max_score}>
                                    <input type="number" step="0.01" min={1} className={inputClass} value={data.max_score} onChange={event => setData('max_score', Number(event.target.value) || 100)} />
                                </Field>
                                <Field label="Status" error={errors.status} wide>
                                    <Select value={data.status} onValueChange={value => setData('status', value as ExamResultStatus)}>
                                        <SelectTrigger className={inputClass}>
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
                                    <textarea className={`${inputClass} min-h-28 resize-y`} value={data.note} onChange={event => setData('note', event.target.value)} />
                                </Field>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                                <button type="button" onClick={closeDrawer} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                    <X size={15} /> Cancel
                                </button>
                                <button disabled={processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                    <CheckCircle2 size={15} /> {drawerMode === 'create' ? 'Save Result' : 'Save Changes'}
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
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Exam Result?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove result for <strong>{deleteTarget.studentNameEn}</strong>?</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                                <X size={15} /> Cancel
                            </button>
                            <button onClick={confirmDelete} className={`${footerButtonClass} bg-red-500 text-white hover:bg-red-600`}>
                                <Trash2 size={15} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={wide ? 'md:col-span-2' : undefined}>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</label>
            {children}
            {error && <div className="mt-1.5 text-xs font-bold text-red-500">{error}</div>}
        </div>
    );
}

function MetricTile({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'green' | 'blue' | 'red' }) {
    return (
        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
            <span className="block text-[9px] font-black uppercase text-slate-400">{label}</span>
            <strong className={`mt-1 block truncate text-xs font-black ${toneClass(tone)}`}>{value}</strong>
        </div>
    );
}

function scoreTone(percent: number) {
    if (percent >= 75) return 'text-emerald-500';
    if (percent >= 50) return 'text-blue-500';
    return 'text-red-500';
}

function toneClass(tone: 'slate' | 'green' | 'blue' | 'red') {
    if (tone === 'green') return 'text-emerald-500';
    if (tone === 'blue') return 'text-blue-500';
    if (tone === 'red') return 'text-red-500';
    return 'text-slate-900 dark:text-slate-50';
}
