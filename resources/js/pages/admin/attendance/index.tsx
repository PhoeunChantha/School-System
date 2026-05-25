import { create, destroy, downloadLayout, edit, exportMethod, importMethod } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { router } from '@inertiajs/react';
import { Download, Edit3, FileDown, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type OrderKey = 'date-desc' | 'date-asc' | 'class-asc' | 'present-desc' | 'absent-desc';

interface AttendanceClass {
    id: number;
    routeKey?: string;
    name: string;
    students: { id: number; nameKh: string; nameEn: string; province: string }[];
}

interface AttendanceRecordItem {
    id: number;
    routeKey?: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    province: string;
    status: AttendanceStatus;
    note: string;
}

interface AttendanceSessionItem {
    id: number;
    routeKey?: string;
    schoolClassId: number;
    className: string;
    attendanceDate: string;
    period: string;
    markedAt: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    records: AttendanceRecordItem[];
}

interface AttendancePageProps {
    sessions: AttendanceSessionItem[];
    classes: AttendanceClass[];
    summary: {
        sessionCount: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        excusedCount: number;
    };
}

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'class-asc', label: 'Class A -> Z' },
    { value: 'present-desc', label: 'Present Most' },
    { value: 'absent-desc', label: 'Absent Most' },
];

const PERIODS = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'full_day', label: 'Full Day' },
];

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';

function periodLabel(period: string): string {
    return PERIODS.find(item => item.value === period)?.label ?? period;
}

function sortSessions(list: AttendanceSessionItem[], order: OrderKey): AttendanceSessionItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc': return b.attendanceDate.localeCompare(a.attendanceDate);
            case 'date-asc': return a.attendanceDate.localeCompare(b.attendanceDate);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'present-desc': return b.presentCount - a.presentCount;
            case 'absent-desc': return b.absentCount - a.absentCount;
            default: return 0;
        }
    });
}

export default function AttendancePage({ sessions, classes, summary }: AttendancePageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('attendance.create') || can('attendance.mark');
    const canUpdate = can('attendance.update');
    const canDelete = can('attendance.delete');
    const canImport = can('attendance.import');
    const canExport = can('attendance.export');
    const canDownloadLayout = can('attendance.download-layout');
    const canManageAttendance = canAny(['attendance.update', 'attendance.delete']);
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionItem | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const importFile = (file: File | null) => {
        if (!file) return;
        if (!canImport) return;

        router.post(importMethod.url(), { import_file: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Attendance imported successfully.'),
            onError: () => toast.error('Unable to import attendance. Please check the CSV layout.'),
            onFinish: () => {
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            },
        });
    };

    useEffect(() => { setPage(1); }, [selectedClass, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = sessions.filter(session => {
            const matchesClass = selectedClass === 'all' || session.schoolClassId === selectedClass;
            const matchesSearch = !query
                || session.className.toLowerCase().includes(query)
                || session.attendanceDate.includes(search)
                || periodLabel(session.period).toLowerCase().includes(query)
                || session.markedAt.toLowerCase().includes(query);

            return matchesClass && matchesSearch;
        });

        return sortSessions(base, orderBy);
    }, [orderBy, search, selectedClass, sessions]);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Attendance deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>
            <div className="fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Attendance</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{summary.sessionCount} sessions</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">{summary.presentCount} present · {summary.absentCount} absent</p>
                    </div>
                    {canCreate && (
                        <button type="button" onClick={() => router.visit(create.url())} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Mark attendance">
                            <Plus size={17} />
                        </button>
                    )}
                </section>

                <div className="hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <KH className="block text-lg font-black text-slate-900 dark:text-slate-50">Attendance</KH>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">Track daily class attendance</div>
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
                        {canCreate && (
                            <button onClick={() => router.visit(create.url())} className={primaryButtonClass}>
                                + Mark Attendance
                            </button>
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

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Sessions', value: summary.sessionCount, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Present', value: summary.presentCount, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Absent', value: summary.absentCount, className: 'border-red-500/25 bg-red-500/10 text-red-500' },
                        { label: 'Late', value: summary.lateCount, className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
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
                        <AdminSelect
                            value={orderBy}
                            onChange={value => setOrderBy(value as OrderKey)}
                            options={ORDER_OPTIONS}
                            className="min-w-0 md:min-w-[150px]"
                            triggerClassName={controlInputClass}
                        />
                        <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 md:block" />
                        <AdminSelect
                            value={perPage.toString()}
                            onChange={value => setPerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            className="min-w-0 md:min-w-[130px]"
                            triggerClassName={controlInputClass}
                        />
                        <AdminSelect
                            value={String(selectedClass)}
                            onChange={value => setSelectedClass(value === 'all' ? 'all' : Number(value))}
                            options={[{ value: 'all', label: 'All classes' }, ...classes.map(schoolClass => ({ value: String(schoolClass.id), label: schoolClass.name }))]}
                            className="col-span-2 min-w-0 md:col-span-1 md:min-w-[150px]"
                            triggerClassName={controlInputClass}
                        />
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[260px]`} data-role="attendance-search" placeholder="Search attendance..." />
                    </div>

                    <table className="data-table hidden md:table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Class</th>
                                <th>Period</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Late</th>
                                <th>Excused</th>
                                {canManageAttendance && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageAttendance ? 8 : 7} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No attendance found for <strong>"{search}"</strong></> : 'Data not found'}
                                    </td>
                                </tr>
                            ) : paginated.map(session => (
                                <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td>
                                        <div className="text-[13px] font-black text-slate-900 dark:text-slate-100">{session.attendanceDate}</div>
                                        <div className="text-[11px] font-bold text-slate-400">{session.markedAt || 'Not marked'}</div>
                                    </td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{session.className}</td>
                                    <td><Badge type="blue">{periodLabel(session.period)}</Badge></td>
                                    <td className="font-black text-emerald-600 dark:text-emerald-300">{session.presentCount}</td>
                                    <td className="font-black text-red-600 dark:text-red-300">{session.absentCount}</td>
                                    <td className="font-black text-amber-600 dark:text-amber-300">{session.lateCount}</td>
                                    <td className="font-black text-blue-600 dark:text-blue-300">{session.excusedCount}</td>
                                    {canManageAttendance && (
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${session.className} ${session.attendanceDate}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((session.routeKey ?? session.id) as never)), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(session), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="grid gap-3 md:hidden">
                        {paginated.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {search ? <>No attendance found for <strong>"{search}"</strong></> : 'Data not found'}
                            </div>
                        ) : paginated.map((session) => (
                            <article key={session.id} className={mobileCardClass}>
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <span className="block text-[11px] font-black text-blue-400">{session.attendanceDate}</span>
                                        <strong className="mt-0.5 block text-base font-black leading-tight text-slate-900 dark:text-slate-50">{session.className}</strong>
                                        <p className="mt-0.5 text-[11px] font-bold text-slate-400">{session.markedAt || 'Not marked'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge type="blue">{periodLabel(session.period)}</Badge>
                                        {canManageAttendance && (
                                            <RowActions
                                                ariaLabel={`Actions for ${session.className} ${session.attendanceDate}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((session.routeKey ?? session.id) as never)), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(session), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: 'Present', value: session.presentCount, className: 'text-emerald-500' },
                                        { label: 'Absent', value: session.absentCount, className: 'text-red-500' },
                                        { label: 'Late', value: session.lateCount, className: 'text-amber-500' },
                                        { label: 'Excused', value: session.excusedCount, className: 'text-blue-500' },
                                    ].map(item => (
                                        <div key={item.label} className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">{item.label}</span>
                                            <strong className={`mt-1 block text-base font-black leading-none ${item.className}`}>{item.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Attendance?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove attendance for <strong>{deleteTarget.className}</strong> on <strong>{deleteTarget.attendanceDate}</strong>?</div>
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
