import { destroy, downloadLayout, exportMethod, importMethod, store, update } from '@/actions/App/Http/Controllers/Backends/GradeRecordController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Avatar, Badge, KH, Pagination, PBar, RowActions, ScoreChip } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, Download, Edit3, FileDown, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GradePeriodOption {
    id: number;
    routeKey?: string;
    name: string;
    type: string;
    academicYear: string;
    isCurrent: boolean;
}

interface GradeStudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    level: string;
    schoolClassId: number | null;
    className: string;
}

interface GradeClassOption {
    id: number;
    routeKey?: string;
    name: string;
}

interface GradeRecordItem {
    id: number;
    routeKey?: string;
    gradePeriodId: number;
    periodName: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    level: string;
    classId: number | null;
    className: string;
    province: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    gradedAt: string;
}

interface GradesPageProps {
    records: GradeRecordItem[];
    periods: GradePeriodOption[];
    students: GradeStudentOption[];
    classes: GradeClassOption[];
    summary: {
        currentPeriodId: number | null;
        recordCount: number;
        average: number;
        passingCount: number;
        needsWorkCount: number;
    };
}

interface GradeFormData {
    grade_period_id: number | null;
    student_id: number | null;
    school_class_id: number | null;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

type DrawerMode = 'create' | 'edit';
type OrderKey = 'avg-desc' | 'avg-asc' | 'name-asc' | 'class-asc' | 'speaking-desc' | 'listening-desc' | 'reading-desc' | 'writing-desc';
type PerfFilter = 'all' | 'excellent' | 'good' | 'average' | 'poor';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'avg-desc', label: 'Average Highest' },
    { value: 'avg-asc', label: 'Average Lowest' },
    { value: 'name-asc', label: 'Name A -> Z' },
    { value: 'class-asc', label: 'Class' },
    { value: 'speaking-desc', label: 'Speaking High' },
    { value: 'listening-desc', label: 'Listening High' },
    { value: 'reading-desc', label: 'Reading High' },
    { value: 'writing-desc', label: 'Writing High' },
];

function performanceLabel(score: number): { label: string; type: 'green' | 'blue' | 'amber' | 'red' } {
    if (score >= 80) return { label: 'Excellent', type: 'green' };
    if (score >= 65) return { label: 'Good', type: 'blue' };
    if (score >= 50) return { label: 'Average', type: 'amber' };
    return { label: 'Needs Work', type: 'red' };
}

function averageScore(form: GradeFormData): number {
    return Math.round(((form.speaking + form.listening + form.reading + form.writing) / 4) * 100) / 100;
}

function sortRecords(list: GradeRecordItem[], order: OrderKey): GradeRecordItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'avg-desc': return b.average - a.average;
            case 'avg-asc': return a.average - b.average;
            case 'name-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'speaking-desc': return b.speaking - a.speaking;
            case 'listening-desc': return b.listening - a.listening;
            case 'reading-desc': return b.reading - a.reading;
            case 'writing-desc': return b.writing - a.writing;
            default: return 0;
        }
    });
}

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

export default function GradesPage({ records, periods, students, classes, summary }: GradesPageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('grades.create');
    const canUpdate = can('grades.update');
    const canDelete = can('grades.delete');
    const canImport = can('grades.import');
    const canExport = can('grades.export');
    const canDownloadLayout = can('grades.download-layout');
    const canManageRecords = canAny(['grades.update', 'grades.delete']);
    const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(summary.currentPeriodId ?? 'all');
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [performanceFilter, setPerformanceFilter] = useState<PerfFilter>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('avg-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingRecord, setEditingRecord] = useState<GradeRecordItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GradeRecordItem | null>(null);
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const importInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<GradeFormData>({
        grade_period_id: summary.currentPeriodId ?? periods[0]?.id ?? null,
        student_id: students[0]?.id ?? null,
        school_class_id: students[0]?.schoolClassId ?? null,
        speaking: 0,
        listening: 0,
        reading: 0,
        writing: 0,
    });

    useEffect(() => { setPage(1); }, [selectedPeriod, selectedClass, performanceFilter, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = records.filter(record => {
            const periodMatches = selectedPeriod === 'all' || record.gradePeriodId === selectedPeriod;
            const classMatches = selectedClass === 'all' || record.classId === selectedClass;
            const perf = performanceLabel(record.average).label.toLowerCase().replace(' ', '-');
            const perfMatches = performanceFilter === 'all'
                || (performanceFilter === 'excellent' && perf === 'excellent')
                || (performanceFilter === 'good' && perf === 'good')
                || (performanceFilter === 'average' && perf === 'average')
                || (performanceFilter === 'poor' && perf === 'needs-work');
            const searchMatches = !query
                || record.studentNameKh.includes(search)
                || record.studentNameEn.toLowerCase().includes(query)
                || record.className.toLowerCase().includes(query)
                || record.level.toLowerCase().includes(query)
                || record.periodName.toLowerCase().includes(query)
                || record.province.toLowerCase().includes(query)
                || record.gradedAt.includes(search);

            return periodMatches && classMatches && perfMatches && searchMatches;
        });

        return sortRecords(base, orderBy);
    }, [orderBy, performanceFilter, records, search, selectedClass, selectedPeriod]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const visibleAverage = filtered.length
        ? Math.round((filtered.reduce((total, record) => total + record.average, 0) / filtered.length) * 100) / 100
        : 0;

    const selectedStudent = useMemo(
        () => students.find(student => student.id === data.student_id) ?? null,
        [data.student_id, students],
    );
    const selectedAverage = averageScore(data);
    const selectedPerformance = performanceLabel(selectedAverage);

    const searchableStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();

        if (!query) {
            return students;
        }

        return students.filter(student =>
            student.nameEn.toLowerCase().includes(query) ||
            student.nameKh.toLowerCase().includes(query) ||
            student.level.toLowerCase().includes(query) ||
            student.className.toLowerCase().includes(query),
        );
    }, [studentSearch, students]);

    const openCreateDrawer = () => {
        if (!canCreate) {
            return;
        }

        const student = students[0];
        reset();
        setData({
            grade_period_id: selectedPeriod === 'all' ? summary.currentPeriodId ?? periods[0]?.id ?? null : selectedPeriod,
            student_id: student?.id ?? null,
            school_class_id: student?.schoolClassId ?? null,
            speaking: 0,
            listening: 0,
            reading: 0,
            writing: 0,
        });
        setEditingRecord(null);
        setDrawerMode('create');
        setStudentSearch('');
        setStudentPickerOpen(false);
    };

    const openEditDrawer = (record: GradeRecordItem) => {
        if (!canUpdate) {
            return;
        }

        setData({
            grade_period_id: record.gradePeriodId,
            student_id: record.studentId,
            school_class_id: record.classId,
            speaking: record.speaking,
            listening: record.listening,
            reading: record.reading,
            writing: record.writing,
        });
        setEditingRecord(record);
        setDrawerMode('edit');
        setStudentSearch('');
        setStudentPickerOpen(false);
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingRecord(null);
        setStudentSearch('');
        setStudentPickerOpen(false);
    };

    const selectStudent = (studentId: number) => {
        const student = students.find(item => item.id === studentId);
        setData(current => ({
            ...current,
            student_id: studentId,
            school_class_id: student?.schoolClassId ?? current.school_class_id,
        }));
        setStudentPickerOpen(false);
        setStudentSearch('');
    };

    const submitGrade = (event: FormEvent<HTMLFormElement>) => {
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
                toast.success(drawerMode === 'edit' ? 'Grade updated.' : 'Grade created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingRecord) {
            put(update.url((editingRecord.routeKey ?? editingRecord.id) as never), options);
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
                toast.success('Grade deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const importFile = (file: File | null) => {
        if (!file) return;
        if (!canImport) return;

        router.post(importMethod.url(), { import_file: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Grades imported successfully.'),
            onError: () => toast.error('Unable to import grades. Please check the CSV layout.'),
            onFinish: () => {
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 md:gap-5 md:p-6 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <KH className="block text-lg font-black text-slate-900 dark:text-slate-50">Grade Book</KH>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">Manage speaking, listening, reading, and writing scores</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canDownloadLayout && (
                            <a href={downloadLayout.url()} className={ghostButtonClass}>
                                <Download size={14} /> Layout
                            </a>
                        )}
                        {canImport && (
                            <button type="button" onClick={() => importInputRef.current?.click()} className={ghostButtonClass}>
                                <Upload size={14} /> Import
                            </button>
                        )}
                        {canExport && (
                            <a href={exportMethod.url()} className={ghostButtonClass}>
                                <FileDown size={14} /> Export
                            </a>
                        )}
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            className="hidden"
                            onChange={event => importFile(event.target.files?.[0] ?? null)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Grade book</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{filtered.length} records</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">{visibleAverage} average - {filtered.filter(record => record.average < 50).length} need work</p>
                    </div>
                    {canCreate && (
                        <button type="button" onClick={openCreateDrawer} aria-label="Add grade" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500">
                            +
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Records', value: filtered.length, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Average', value: visibleAverage, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Passing', value: filtered.filter(record => record.average >= 50).length, className: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500' },
                        { label: 'Needs Work', value: filtered.filter(record => record.average < 50).length, className: 'border-red-500/25 bg-red-500/10 text-red-500' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-[18px] border p-3 ${card.className}`}>
                            <div className="text-2xl font-black leading-none">{card.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-x-0 md:border-t-0 md:shadow-none">
                        <AdminSelect
                            value={perPage.toString()}
                            onChange={value => setPerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            className="min-w-0 md:min-w-[130px]"
                            triggerClassName={controlInputClass}
                        />
                        <AdminSelect
                            value={String(selectedPeriod)}
                            onChange={value => setSelectedPeriod(value === 'all' ? 'all' : Number(value))}
                            options={[{ value: 'all', label: 'All periods' }, ...periods.map(period => ({ value: String(period.id), label: period.name }))]}
                            className="min-w-0 md:min-w-[150px]"
                            triggerClassName={controlInputClass}
                        />
                        <AdminSelect
                            value={String(selectedClass)}
                            onChange={value => setSelectedClass(value === 'all' ? 'all' : Number(value))}
                            options={[{ value: 'all', label: 'All classes' }, ...classes.map(schoolClass => ({ value: String(schoolClass.id), label: schoolClass.name }))]}
                            className="min-w-0 md:min-w-[150px]"
                            triggerClassName={controlInputClass}
                        />
                        <AdminSelect
                            value={performanceFilter}
                            onChange={value => setPerformanceFilter(value as PerfFilter)}
                            options={[
                                { value: 'all', label: 'All performance' },
                                { value: 'excellent', label: 'Excellent' },
                                { value: 'good', label: 'Good' },
                                { value: 'average', label: 'Average' },
                                { value: 'poor', label: 'Needs Work' },
                            ]}
                            className="min-w-0 md:min-w-[160px]"
                            triggerClassName={controlInputClass}
                        />
                        <AdminSelect
                            value={orderBy}
                            onChange={value => setOrderBy(value as OrderKey)}
                            options={ORDER_OPTIONS}
                            className="col-span-2 min-w-0 md:col-span-1 md:min-w-[160px]"
                            triggerClassName={controlInputClass}
                        />
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[260px]`}
                            placeholder="Search grades..."
                            data-role="grades-search"
                        />
                    </div>

                    <table className="data-table hidden md:table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Speaking</th>
                                <th>Listening</th>
                                <th>Reading</th>
                                <th>Writing</th>
                                <th>Average</th>
                                <th>Performance</th>
                                {canManageRecords && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageRecords ? 9 : 8} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No grades found for <strong>"{search}"</strong></> : 'Data not found'}
                                    </td>
                                </tr>
                            ) : paginated.map(record => {
                                const perf = performanceLabel(record.average);
                                return (
                                    <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={record.studentNameEn} size={32} />
                                                <div>
                                                    <KH className="block text-[13px] font-black text-slate-900 dark:text-slate-50">{record.studentNameKh}</KH>
                                                    <div className="text-[11px] font-bold text-slate-400">{record.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{record.className || record.level}</td>
                                        <td><ScoreChip score={record.speaking} /></td>
                                        <td><ScoreChip score={record.listening} /></td>
                                        <td><ScoreChip score={record.reading} /></td>
                                        <td><ScoreChip score={record.writing} /></td>
                                        <td>
                                            <div className="flex min-w-[110px] items-center gap-2">
                                                <PBar value={record.average} color={record.average >= 75 ? 'green' : record.average >= 50 ? 'blue' : 'red'} />
                                                <span className={`w-11 text-xs font-black ${record.average >= 75 ? 'text-emerald-500' : record.average >= 50 ? 'text-blue-500' : 'text-red-500'}`}>{record.average}</span>
                                            </div>
                                        </td>
                                        <td><Badge type={perf.type}>{perf.label}</Badge></td>
                                        {canManageRecords && (
                                            <td>
                                                <RowActions
                                                    ariaLabel={`Actions for ${record.studentNameEn}`}
                                                    actions={[
                                                        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(record), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(record), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
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
                                {search ? <>No grades found for <strong>"{search}"</strong></> : 'Data not found'}
                            </div>
                        ) : paginated.map(record => {
                            const perf = performanceLabel(record.average);

                            return (
                                <div className={mobileCardClass} key={record.id}>
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar name={record.studentNameEn} size={36} />
                                            <div className="min-w-0">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{record.studentNameKh}</KH>
                                                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{record.studentNameEn} - {record.className || record.level}</p>
                                            </div>
                                        </div>
                                        {canManageRecords && (
                                            <RowActions
                                                ariaLabel={`Actions for ${record.studentNameEn}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(record), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(record), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        )}
                                    </div>
                                    <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-950">
                                        <div>
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Average</span>
                                            <strong className="mt-0.5 block text-lg font-black leading-none text-slate-900 dark:text-slate-50">{record.average}</strong>
                                        </div>
                                        <PBar value={record.average} color={record.average >= 75 ? 'green' : record.average >= 50 ? 'blue' : 'red'} />
                                        <Badge type={perf.type}>{perf.label}</Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950"><span className="mb-1 block text-[9px] font-black uppercase text-slate-400">Speak</span><ScoreChip score={record.speaking} /></div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950"><span className="mb-1 block text-[9px] font-black uppercase text-slate-400">Listen</span><ScoreChip score={record.listening} /></div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950"><span className="mb-1 block text-[9px] font-black uppercase text-slate-400">Read</span><ScoreChip score={record.reading} /></div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950"><span className="mb-1 block text-[9px] font-black uppercase text-slate-400">Write</span><ScoreChip score={record.writing} /></div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black text-slate-400">
                                        <span>{record.periodName}</span>
                                        <strong className="text-slate-600 dark:text-slate-300">{record.gradedAt}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            <Sheet
                open={drawerMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDrawer();
                    }
                }}
            >
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitGrade} className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
                            <SheetHeader className="border-b border-slate-200 bg-white px-5 py-4 text-left dark:border-slate-700 dark:bg-slate-800">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {drawerMode === 'create' ? 'Add Grade' : 'Edit Grade'}
                                </SheetTitle>
                                <SheetDescription className="text-xs font-bold text-slate-400">
                                    {drawerMode === 'create' ? 'Create a student score record' : editingRecord?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-2 gap-3 p-3 md:p-5">
                            <div className="col-span-2 flex items-center justify-between rounded-[22px] bg-gradient-to-r from-blue-600 to-teal-600 p-3 text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
                                <div>
                                    <span className="block text-[10px] font-black uppercase text-white/70">Live average</span>
                                    <strong className="mt-1 block text-3xl font-black leading-none">{selectedAverage}</strong>
                                </div>
                                <Badge type={selectedPerformance.type}>{selectedPerformance.label}</Badge>
                            </div>
                            <div className={`${fieldGroupClass} col-span-2`}>
                                <label className={fieldLabelClass}>Period *</label>
                                <Select value={data.grade_period_id ? String(data.grade_period_id) : ''} onValueChange={value => setData('grade_period_id', Number(value) || null)}>
                                    <SelectTrigger className={fieldInputClass}>
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periods.map(period => (
                                            <SelectItem key={period.id} value={String(period.id)}>
                                                {period.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.grade_period_id && <div className={errorTextClass}>{errors.grade_period_id}</div>}
                            </div>
                            <div className={`${fieldGroupClass} col-span-2`}>
                                <label className={fieldLabelClass}>Student *</label>
                                <Popover open={studentPickerOpen} onOpenChange={open => { if (drawerMode !== 'edit') setStudentPickerOpen(open); }}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={drawerMode === 'edit'}
                                            className={`${fieldInputClass} flex items-center justify-between gap-2 text-left`}
                                        >
                                            <span className="min-w-0 truncate">
                                                {selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : 'Select student'}
                                            </span>
                                            <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900">
                                        <div className="flex items-center gap-2 border-b border-slate-200 p-2.5 dark:border-slate-700">
                                            <Search size={15} className="shrink-0 text-slate-400" />
                                            <input
                                                value={studentSearch}
                                                onChange={event => setStudentSearch(event.target.value)}
                                                placeholder="Search students..."
                                                autoFocus
                                                className="w-full border-0 bg-transparent text-[13px] font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                                            />
                                        </div>
                                        <div className="max-h-[260px] overflow-y-auto p-1.5">
                                            {searchableStudents.length === 0 ? (
                                                <div className="px-2.5 py-5 text-center text-[13px] font-bold text-slate-400">
                                                    No students found
                                                </div>
                                            ) : searchableStudents.map(student => {
                                                const selected = student.id === data.student_id;

                                                return (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => selectStudent(student.id)}
                                                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${selected ? 'bg-blue-50 text-slate-900 dark:bg-blue-500/15 dark:text-slate-50' : 'text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800'}`}
                                                    >
                                                        <Check size={15} className={`shrink-0 ${selected ? 'text-blue-600' : 'text-transparent'}`} />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-[13px] font-black">{student.nameEn}</span>
                                                            <span className="block truncate text-[11px] font-bold text-slate-400">{student.nameKh} - {student.className || student.level}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {errors.student_id && <div className={errorTextClass}>{errors.student_id}</div>}
                            </div>
                            {(['speaking', 'listening', 'reading', 'writing'] as const).map(skill => (
                                <div className={fieldGroupClass} key={skill}>
                                    <label className={fieldLabelClass}>{skill.charAt(0).toUpperCase() + skill.slice(1)} *</label>
                                    <input type="number" min={0} max={100} className={`${fieldInputClass} text-center text-xl`} value={data[skill]} onChange={event => setData(skill, Math.min(100, Math.max(0, Number(event.target.value))))} />
                                    {errors[skill] && <div className={errorTextClass}>{errors[skill]}</div>}
                                </div>
                            ))}
                            </div>

                        <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 md:p-5">
                            <button type="button" onClick={closeDrawer} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"><X size={16} /> Cancel</button>
                            <button disabled={processing} type="submit" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-900">
                                <Save size={16} /> {drawerMode === 'create' ? 'Save Grade' : 'Save Changes'}
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
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Grade?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove grade record for <strong>{deleteTarget.studentNameEn}</strong>?</div>
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
