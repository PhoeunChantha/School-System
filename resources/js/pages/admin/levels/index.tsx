import { FormEvent, useEffect, useMemo, useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/LevelController';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Pagination } from '@/pages/admin/ui';
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
        reset();
        setData({ name: '', monthly_fee: '', sort_order: 0, is_active: true });
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (level: Level) => {
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
        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`"${deleteTarget.name}" deleted.`);
                setDeleteTarget(null);
            },
        });
    };

    const inputError = (message?: string) =>
        message ? <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{message}</div> : null;

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
            <div className="fade-in" style={{ padding: 24 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Levels</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{levels.length} level{levels.length !== 1 ? 's' : ''} total</div>
                    </div>
                    <button onClick={openAdd} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Add Level</button>
                </div>

                {/* Modal Dialog */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? `Edit - ${editing.name}` : 'Add New Level'}</DialogTitle>
                            <DialogDescription>
                                {editing ? 'Update the level details below.' : 'Create a new course level.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="f-group">
                                <label className="f-label">Level Name *</label>
                                <input className="f-input" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Beginner 1" />
                                {errors.name && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
                            </div>
                            <div className="f-group">
                                <label className="f-label">Monthly Fee ($) *</label>
                                <input type="number" className="f-input" value={data.monthly_fee} min={0} step="0.01" onChange={e => setData('monthly_fee', e.target.value)} placeholder="0.00" />
                                {errors.monthly_fee && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.monthly_fee}</div>}
                            </div>
                            <div className="f-group">
                                <label className="f-label">Sort Order</label>
                                <input type="number" className="f-input" value={data.sort_order} min={0} onChange={e => setData('sort_order', e.target.value)} placeholder="0" />
                                {errors.sort_order && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.sort_order}</div>}
                            </div>
                            <div className="f-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                />
                                <label htmlFor="is_active" style={{ fontSize: 13, color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Active (visible in student enrollment)</label>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                                <button type="button" onClick={closeModal} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                                <button type="submit" disabled={processing} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Save size={15} /> {processing ? 'Saving...' : editing ? 'Update Level' : 'Save Level'}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* List */}
                <>
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                            <Select value={orderBy} onValueChange={e => setOrderBy(e as OrderKey)}>
                                <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                            <Select value={perPage.toString()} onValueChange={e => { setPerPage(Number(e)); setPage(1); }}>
                                <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n} per page</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                            </span>

                            <input
                                className="f-input"
                                style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                                placeholder="Search levels..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['#', 'Name', 'Students', 'Status', ''].map((h, i) => (
                                        <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                            {search ? 'No levels match your search.' : 'No levels yet. Click "+ Add Level" to create one.'}
                                        </td>
                                    </tr>
                                )}
                                {paginated.map(level => (
                                    <tr key={level.id} style={{ borderBottom: '1px solid #f8fafc' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{level.sortOrder}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{level.name}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>{level.studentCount} student{level.studentCount !== 1 ? 's' : ''}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: level.isActive ? '#f0fdf4' : '#fef2f2', color: level.isActive ? '#16a34a' : '#dc2626' }}>
                                                {level.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button onClick={() => openEdit(level)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginRight: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Edit3 size={13} /> Edit</button>
                                            <button onClick={() => setDeleteTarget(level)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Trash2 size={13} /> Delete</button>
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



