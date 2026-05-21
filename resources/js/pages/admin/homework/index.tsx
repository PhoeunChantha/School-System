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
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Homework List</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {totalAssigned} assigned - {totalSubmissions} submissions received
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {canSubmitHomework && (
                            <Link href={createHomeworkSubmission.url()} className="admin-btn admin-btn-ghost">
                                <Upload size={15} /> Student Submit
                            </Link>
                        )}
                        {canCreate && (
                            <Link href={createHomework.url()} className="admin-btn admin-btn-primary">
                                <Plus size={15} /> Assign New
                            </Link>
                        )}
                    </div>
                </div>

                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" style={{ maxWidth: 240 }} placeholder="Search homework..." />
                        <Select value={status} onValueChange={(val) => setStatus(val)}>
                            <SelectTrigger className="f-input" style={{ width: 'auto', minWidth: 140 }}>
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
                            <SelectTrigger className="f-input" style={{ width: 'auto', minWidth: 160 }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                            <SelectTrigger className="f-input" style={{ width: 'auto', minWidth: 120 }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(size => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <table className="data-table">
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
                                    <td colSpan={canManageHomework ? 7 : 6} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        Data not found
                                    </td>
                                </tr>
                            ) : paginated.map(item => {
                                const completion = item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0;

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{item.titleKh}</KH>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.titleEn || 'Untitled homework'}</div>
                                            {item.attachmentUrl && (
                                                <a href={item.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, color: '#2563eb', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                                    <FileText size={12} /> {item.attachmentName || 'Homework file'}
                                                </a>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{item.className}</td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{item.dueOn}</td>
                                        <td style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{item.points}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                                                <PBar value={item.submitted} max={Math.max(1, item.total)} color={completion >= 80 ? 'green' : 'blue'} height={8} />
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{item.submitted}/{item.total}</span>
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

                    {filtered.length > 0 && (
                        <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </div>
            </div>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Homework?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Are you sure you want to remove <strong>{deleteTarget.titleEn || deleteTarget.titleKh}</strong>?</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}



