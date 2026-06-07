import { destroy } from '@/actions/App/Http/Controllers/Backends/GradePeriodController';
import { create, edit } from '@/routes/admin/grade-periods';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { Link, router } from '@inertiajs/react';
import { CalendarDays, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface GradePeriod {
    id: number;
    routeKey?: string;
    name: string;
    type: 'monthly' | 'term' | 'final';
    academicYear: string;
    startsOn: string;
    endsOn: string;
    isCurrent: boolean;
    recordCount: number;
}

interface GradePeriodsPageProps {
    periods: GradePeriod[];
    summary: {
        total: number;
        monthly: number;
        term: number;
        final: number;
    };
}

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';

export default function GradePeriodsPage({ periods, summary }: GradePeriodsPageProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<GradePeriod | null>(null);

    useEffect(() => { setPage(1); }, [search, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return periods.filter(period => !query
            || period.name.toLowerCase().includes(query)
            || period.type.toLowerCase().includes(query)
            || period.academicYear.toLowerCase().includes(query));
    }, [periods, search]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Grade period deleted.');
                setDeleteTarget(null);
            },
            onError: () => toast.error('Unable to delete grade period.'),
        });
    };

    return (
        <AdminShell>
            <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 md:gap-5 md:p-6 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))]">
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Grade periods</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{filtered.length} periods</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">Manage monthly, term, and final periods</p>
                    </div>
                    <Link href={create.url()} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add period">
                        <Plus size={18} />
                    </Link>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Total', value: summary.total, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Monthly', value: summary.monthly, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Term', value: summary.term, className: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500' },
                        { label: 'Final', value: summary.final, className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-[18px] border p-3 ${card.className}`}>
                            <div className="text-2xl font-black leading-none">{card.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-x-0 md:border-t-0 md:shadow-none">
                        <select value={perPage} onChange={event => setPerPage(Number(event.target.value))} className={controlInputClass}>
                            {[10, 25, 50].map(size => <option key={size} value={size}>{size} per page</option>)}
                        </select>
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[280px]`} placeholder="Search periods..." />
                    </div>

                    <table className="data-table hidden md:table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Type</th>
                                <th>Academic Year</th>
                                <th>Dates</th>
                                <th>Records</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No periods found for <strong>"{search}"</strong></> : 'No grade periods found'}
                                    </td>
                                </tr>
                            ) : paginated.map(period => (
                                <tr key={period.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><CalendarDays size={16} /></span>
                                            <span className="text-sm font-black text-slate-900 dark:text-slate-50">{period.name}</span>
                                        </div>
                                    </td>
                                    <td><Badge type="blue">{period.type}</Badge></td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{period.academicYear}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{period.startsOn || '-'} to {period.endsOn || '-'}</td>
                                    <td className="text-xs font-black text-slate-700 dark:text-slate-200">{period.recordCount}</td>
                                    <td>{period.isCurrent ? <Badge type="green">Current</Badge> : <Badge type="gray">Inactive</Badge>}</td>
                                    <td>
                                        <RowActions
                                            ariaLabel={`Actions for ${period.name}`}
                                            actions={[
                                                { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((period.routeKey ?? period.id) as never)) },
                                                { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(period), variant: 'destructive', separatorBefore: true },
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginated.map(period => (
                            <div className={mobileCardClass} key={period.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-slate-50">{period.name}</div>
                                        <div className="mt-1 text-[11px] font-bold text-slate-400">{period.type} - {period.academicYear}</div>
                                    </div>
                                    <RowActions
                                        ariaLabel={`Actions for ${period.name}`}
                                        actions={[
                                            { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((period.routeKey ?? period.id) as never)) },
                                            { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(period), variant: 'destructive', separatorBefore: true },
                                        ]}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {period.isCurrent && <Badge type="green">Current</Badge>}
                                    <Badge type="blue">{period.recordCount} records</Badge>
                                </div>
                                <div className="mt-3 text-[11px] font-bold text-slate-400">{period.startsOn || '-'} to {period.endsOn || '-'}</div>
                            </div>
                        ))}
                    </div>
                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Period?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.name}</strong>? Periods with grade records cannot be deleted.</div>
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
