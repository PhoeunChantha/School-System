import { create as createHomework, destroy, edit as editHomework } from '@/actions/App/Http/Controllers/Backends/HomeworkAssignmentController';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { create as createHomeworkSubmission } from '@/routes/admin/homework-submissions';
import AdminShell from '@/pages/admin/shell';
import { Badge, KH, Pagination, PBar, RowActions } from '@/pages/admin/ui';
import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Edit3, FileText, Plus, Trash2, Upload, X } from 'lucide-react';

export interface HomeworkItem {
    id: number;
    routeKey?: string;
    titleKh: string;
    titleEn: string;
    className: string;
    dueOn: string;
    points: number;
    attachmentName: string;
    attachmentUrl: string;
    status: 'assigned' | 'draft' | 'closed';
    submitted: number;
    total: number;
    submissions: number;
}

interface HomeworkPageProps {
    homework: HomeworkItem[];
}

type OrderKey = 'due-desc' | 'due-asc' | 'title-asc' | 'class-asc' | 'submitted-desc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'due-desc', label: 'Due newest' },
    { value: 'due-asc', label: 'Due oldest' },
    { value: 'title-asc', label: 'Title A -> Z' },
    { value: 'class-asc', label: 'Class A -> Z' },
    { value: 'submitted-desc', label: 'Most submitted' },
];

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';

const statusBadge = (status: HomeworkItem['status']) => {
    if (status === 'assigned') return <Badge type="blue">Assigned</Badge>;
    if (status === 'closed') return <Badge type="gray">Closed</Badge>;
    return <Badge type="amber">Draft</Badge>;
};

function sortHomework(list: HomeworkItem[], order: OrderKey): HomeworkItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'due-desc': return b.dueOn.localeCompare(a.dueOn);
            case 'due-asc': return a.dueOn.localeCompare(b.dueOn);
            case 'title-asc': return a.titleEn.localeCompare(b.titleEn);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'submitted-desc': return b.submitted - a.submitted;
            default: return 0;
        }
    });
}

export default function HomeworkPage({ homework }: HomeworkPageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('homework.create');
    const canUpdate = can('homework.update');
    const canDelete = can('homework.delete');
    const canSubmitHomework = can('homework-submissions.create');
    const canManageHomework = canAny(['homework.update', 'homework.delete']);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [orderBy, setOrderBy] = useState<OrderKey>('due-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [deleteTarget, setDeleteTarget] = useState<HomeworkItem | null>(null);

    useEffect(() => { setPage(1); }, [search, status, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = homework.filter(item => {
            const matchesSearch = !query
                || item.titleKh.includes(search)
                || item.titleEn.toLowerCase().includes(query)
                || item.className.toLowerCase().includes(query);
            const matchesStatus = status === 'all' || item.status === status;

            return matchesSearch && matchesStatus;
        });

        return sortHomework(base, orderBy);
    }, [homework, orderBy, search, status]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const totalAssigned = homework.length;
    const totalSubmissions = homework.reduce((sum, item) => sum + item.submitted, 0);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Homework deleted.', {
                    description: deleteTarget.titleEn || deleteTarget.titleKh,
                });
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 md:gap-5 md:p-6 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Homework List</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">
                            {totalAssigned} assigned - {totalSubmissions} submissions received
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {canSubmitHomework && (
                            <Link href={createHomeworkSubmission.url()} className={ghostButtonClass}>
                                <Upload size={15} /> Student Submit
                            </Link>
                        )}
                    </div>
                </div>

                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:rounded-[28px] md:p-5">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Homework list</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{totalAssigned} assigned</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">{totalSubmissions} submissions received</p>
                    </div>
                    {canCreate && (
                        <Link href={createHomework.url()} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Assign homework">
                            <Plus size={18} />
                        </Link>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[18px] border border-blue-500/25 bg-blue-500/10 p-3 text-blue-500">
                        <div className="text-2xl font-black leading-none">{filtered.length}</div>
                        <div className="mt-1 text-[11px] font-black opacity-70">Results</div>
                    </div>
                    <div className="rounded-[18px] border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-500">
                        <div className="text-2xl font-black leading-none">{totalSubmissions}</div>
                        <div className="mt-1 text-[11px] font-black opacity-70">Submissions</div>
                    </div>
                </div>

                <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-3 md:border-0 md:border-b md:border-slate-200 md:bg-white md:p-4 md:shadow-none md:backdrop-blur-none dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:order-2 md:col-span-1 md:w-[320px]`} placeholder="Search homework..." />
                        <div className="contents md:order-1 md:flex md:items-center md:gap-2">
                        <Select value={status} onValueChange={(val) => setStatus(val)}>
                            <SelectTrigger className={`${controlInputClass} w-full md:w-[150px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={orderBy} onValueChange={(val) => setOrderBy(val as OrderKey)}>
                            <SelectTrigger className={`${controlInputClass} w-full md:w-[160px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                            <SelectTrigger className={`${controlInputClass} w-full md:w-[130px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(size => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {canSubmitHomework && (
                            <Link href={createHomeworkSubmission.url()} className={`${ghostButtonClass} md:hidden`}>
                                <Upload size={14} /> Submit
                            </Link>
                        )}
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <table className="data-table hidden md:table md:min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Homework</th>
                                <th>Class</th>
                                <th>Due Date</th>
                                <th>Points</th>
                                <th>Progress</th>
                                <th>Status</th>
                                {canManageHomework && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageHomework ? 7 : 6} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        Data not found
                                    </td>
                                </tr>
                            ) : paginated.map(item => {
                                const completion = item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0;

                                return (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                        <td>
                                            <KH className="block text-[13px] font-black text-slate-900 dark:text-slate-50">{item.titleKh}</KH>
                                            <div className="text-[11px] font-bold text-slate-400">{item.titleEn || 'Untitled homework'}</div>
                                            {item.attachmentUrl && (
                                                <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-300">
                                                    <FileText size={12} /> {item.attachmentName || 'Homework file'}
                                                </a>
                                            )}
                                        </td>
                                        <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{item.className}</td>
                                        <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{item.dueOn}</td>
                                        <td className="text-xs font-black text-slate-900 dark:text-slate-50">{item.points}</td>
                                        <td>
                                            <div className="flex min-w-[150px] items-center gap-2">
                                                <PBar value={item.submitted} max={Math.max(1, item.total)} color={completion >= 80 ? 'green' : 'blue'} height={8} />
                                                <span className="whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-300">{item.submitted}/{item.total}</span>
                                            </div>
                                        </td>
                                        <td>{statusBadge(item.status)}</td>
                                        {canManageHomework && (
                                            <td>
                                                <RowActions
                                                    ariaLabel={`Actions for ${item.titleEn || item.titleKh}`}
                                                    actions={[
                                                        { key: 'edit', label: 'Edit', icon: Edit3, href: editHomework.url((item.routeKey ?? item.id) as never), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(item), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
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
                                Data not found
                            </div>
                        ) : paginated.map(item => {
                            const completion = item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0;

                            return (
                                <article key={item.id} className={mobileCardClass}>
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{item.titleKh}</KH>
                                            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{item.titleEn || 'Untitled homework'}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {statusBadge(item.status)}
                                            {canManageHomework && (
                                                <RowActions
                                                    ariaLabel={`Actions for ${item.titleEn || item.titleKh}`}
                                                    actions={[
                                                        { key: 'edit', label: 'Edit', icon: Edit3, href: editHomework.url((item.routeKey ?? item.id) as never), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(item), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                    ]}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Class</span>
                                            <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{item.className}</strong>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Due</span>
                                            <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{item.dueOn}</strong>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Points</span>
                                            <strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{item.points}</strong>
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-950">
                                        <div className="mb-2 flex items-center justify-between text-[11px] font-black">
                                            <span className="text-slate-400">Submitted</span>
                                            <span className={completion >= 80 ? 'text-emerald-500' : 'text-blue-500'}>{item.submitted}/{item.total}</span>
                                        </div>
                                        <PBar value={item.submitted} max={Math.max(1, item.total)} color={completion >= 80 ? 'green' : 'blue'} height={8} />
                                    </div>

                                    {item.attachmentUrl && (
                                        <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 rounded-xl bg-blue-500/10 px-2.5 py-2 text-[11px] font-black text-blue-600 dark:text-blue-300">
                                            <FileText size={12} /> <span className="truncate">{item.attachmentName || 'Homework file'}</span>
                                        </a>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {filtered.length > 0 && (
                        <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4" onClick={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Homework?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Are you sure you want to remove <strong>{deleteTarget.titleEn || deleteTarget.titleKh}</strong>?</div>
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
