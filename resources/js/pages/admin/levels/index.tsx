import { FormEvent, useEffect, useMemo, useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/LevelController';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Pagination, RowActions, type RowAction } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Level {
    id: number;
    routeKey?: string;
    name: string;
    monthlyFee: number;
    sortOrder: number;
    isActive: boolean;
    studentCount: number;
}

interface LevelsPageProps {
    levels: Level[];
}

interface LevelFormData {
    name: string;
    monthly_fee: string | number;
    sort_order: string | number;
    is_active: boolean;
}

type View = 'list' | 'add' | 'edit';
type OrderKey = 'sort-asc' | 'name-asc' | 'name-desc' | 'fee-asc' | 'fee-desc' | 'students-desc' | 'students-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'sort-asc', label: 'Sort order' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'fee-asc', label: 'Fee Low' },
    { value: 'fee-desc', label: 'Fee High' },
    { value: 'students-desc', label: 'Students Most' },
    { value: 'students-asc', label: 'Students Least' },
];
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

function sortLevels(list: Level[], order: OrderKey): Level[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'sort-asc': return a.sortOrder - b.sortOrder;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'fee-asc': return a.monthlyFee - b.monthlyFee;
            case 'fee-desc': return b.monthlyFee - a.monthlyFee;
            case 'students-desc': return b.studentCount - a.studentCount;
            case 'students-asc': return a.studentCount - b.studentCount;
            default: return 0;
        }
    });
}

export default function LevelsPage({ levels }: LevelsPageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('levels.create');
    const canUpdate = can('levels.update');
    const canDelete = can('levels.delete');
    const canManageLevels = canAny(['levels.update', 'levels.delete']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Level | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('sort-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);

    const { data, setData, post, put, processing, errors, reset } = useForm<LevelFormData>({
        name: '',
        monthly_fee: '',
        sort_order: 0,
        is_active: true,
    });

    const openAdd = () => {
        if (!canCreate) {
            return;
        }

        reset();
        setData({ name: '', monthly_fee: '', sort_order: 0, is_active: true });
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (level: Level) => {
        if (!canUpdate) {
            return;
        }

        setData({
            name: level.name,
            monthly_fee: level.monthlyFee,
            sort_order: level.sortOrder,
            is_active: level.isActive,
        });
        setEditing(level);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editing) {
            put(update.url((editing.routeKey ?? editing.id) as never), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Level updated successfully!');
                    closeModal();
                },
            });
        } else {
            post(store.url(), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Level created successfully!');
                    closeModal();
                },
            });
        }
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
                toast.success(`"${deleteTarget.name}" deleted.`);
                setDeleteTarget(null);
            },
        });
    };

    const inputError = (message?: string) =>
        message ? <div className={errorTextClass}>{message}</div> : null;

    const levelActions = (level: Level): RowAction[] => [
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEdit(level), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(level), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
    ];

    useEffect(() => { setPage(1); }, [search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = levels.filter(l =>
            !q ||
            l.name.toLowerCase().includes(q) ||
            String(l.sortOrder).includes(q) ||
            String(l.monthlyFee).includes(q) ||
            String(l.studentCount).includes(q) ||
            (l.isActive ? 'active' : 'inactive').includes(q),
        );

        return sortLevels(base, orderBy);
    }, [levels, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>
            <div className="fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">

                {/* Header */}
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Level directory</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{levels.length} levels</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">
                            {levels.reduce((total, level) => total + level.studentCount, 0)} students
                            {' '}·{' '}
                            {levels.filter((level) => level.isActive).length} active
                        </p>
                    </div>
                    {canCreate && (
                        <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]" type="button" onClick={openAdd}>
                            <Plus size={17} />
                        </button>
                    )}
                </section>

                <div className="hidden items-center justify-between md:flex">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Levels</div>
                        <div className="text-xs font-bold text-slate-400">{levels.length} level{levels.length !== 1 ? 's' : ''} total</div>
                    </div>
                    {canCreate && <button onClick={openAdd} className={primaryButtonClass}><Plus size={15} /> Add Level</button>}
                </div>

                {/* Modal Dialog */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="rounded-[24px] border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? `Edit - ${editing.name}` : 'Add New Level'}</DialogTitle>
                            <DialogDescription>
                                {editing ? 'Update the level details below.' : 'Create a new course level.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>Level Name *</label>
                                <input className={fieldInputClass} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Beginner 1" />
                                {inputError(errors.name)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>Monthly Fee ($) *</label>
                                <input type="number" className={fieldInputClass} value={data.monthly_fee} min={0} step="0.01" onChange={e => setData('monthly_fee', e.target.value)} placeholder="0.00" />
                                {inputError(errors.monthly_fee)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>Sort Order</label>
                                <input type="number" className={fieldInputClass} value={data.sort_order} min={0} onChange={e => setData('sort_order', e.target.value)} placeholder="0" />
                                {inputError(errors.sort_order)}
                            </div>
                            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/70">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 cursor-pointer accent-blue-600"
                                />
                                <label htmlFor="is_active" className="cursor-pointer text-[13px] font-semibold text-slate-700 dark:text-slate-300">Active (visible in student enrollment)</label>
                            </div>
                            <div className="mt-6 flex gap-2.5">
                                <button type="button" onClick={closeModal} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300"><X size={15} /> Cancel</button>
                                <button type="submit" disabled={processing} className="inline-flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-blue-600 p-3 text-[13px] font-bold text-white disabled:opacity-70">
                                    <Save size={15} /> {processing ? 'Saving...' : editing ? 'Update Level' : 'Save Level'}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* List */}
                <>
                    <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-b md:shadow-none">
                            <span className="hidden text-[11px] font-black text-slate-400 md:inline">Sort by</span>
                            <Select value={orderBy} onValueChange={e => setOrderBy(e as OrderKey)}>
                                <SelectTrigger className={`${controlInputClass} min-w-[150px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="hidden h-5 w-px bg-slate-200 md:block" />

                            <Select value={perPage.toString()} onValueChange={e => { setPerPage(Number(e)); setPage(1); }}>
                                <SelectTrigger className={`${controlInputClass} min-w-[120px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n} per page</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span className="hidden text-[11px] font-extrabold text-slate-400 md:inline">
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                            </span>

                            <input
                                className={`${controlInputClass} col-span-2 w-full md:ml-auto md:max-w-[260px]`}
                                data-role="levels-search"
                                placeholder="Search levels..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <table className="data-table hidden md:table">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700">
                                    {['#', 'Name', 'Students', 'Status', ...(canManageLevels ? ['Actions'] : [])].map((h, i, arr) => (
                                        <th key={i} className={`px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 ${canManageLevels && i === arr.length - 1 ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={canManageLevels ? 5 : 4} className="px-4 py-10 text-center text-[13px] text-slate-400">
                                            {search ? 'No levels match your search.' : 'No levels yet. Click "+ Add Level" to create one.'}
                                        </td>
                                    </tr>
                                )}
                                {paginated.map(level => (
                                    <tr key={level.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">
                                        <td className="px-4 py-3 text-xs text-slate-400">{level.sortOrder}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-50">{level.name}</td>
                                        <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{level.studentCount} student{level.studentCount !== 1 ? 's' : ''}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${level.isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'}`}>
                                                {level.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {canManageLevels && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <RowActions ariaLabel={`Actions for ${level.name}`} actions={levelActions(level)} />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="grid gap-3 md:hidden">
                            {paginated.length === 0 ? (
                                <div className="py-8 text-center text-sm font-bold text-slate-500">
                                    {search ? 'No levels match your search.' : 'No levels yet.'}
                                </div>
                            ) : (
                                paginated.map((level) => (
                                    <article key={level.id} className={mobileCardClass}>
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div>
                                                <span className="block text-[11px] font-black text-blue-500">#{level.sortOrder}</span>
                                                <strong className="block text-sm font-black text-slate-900 dark:text-slate-50">{level.name}</strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${level.isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'}`}>
                                                    {level.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                {canManageLevels && (
                                                    <RowActions ariaLabel={`Actions for ${level.name}`} actions={levelActions(level)} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5 dark:border-slate-700 dark:bg-slate-950/70">
                                            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-700">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Students</span>
                                                <strong className="text-xs font-black text-slate-900 dark:text-slate-50">{level.studentCount}</strong>
                                            </div>
                                            <div className="flex items-center justify-between px-3 py-2.5">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Monthly fee</span>
                                                <strong className="text-xs font-black text-slate-900 dark:text-slate-50">${level.monthlyFee}</strong>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>

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
                </>

                {/* Delete confirm */}
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div className="card" style={{ padding: 28, maxWidth: 380, width: '90%' }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>Delete Level?</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                                {deleteTarget.studentCount > 0 && (
                                    <span style={{ color: '#dc2626' }}> This level has {deleteTarget.studentCount} enrolled student{deleteTarget.studentCount !== 1 ? 's' : ''}.</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                                <button onClick={confirmDelete} style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={15} /> Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
