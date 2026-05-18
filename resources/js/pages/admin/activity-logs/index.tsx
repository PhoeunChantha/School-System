import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ActivityLogController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Avatar, Badge, KH, Pagination } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { toast } from 'sonner';

interface ActivityLogItem {
    id: number;
    routeKey?: string;
    userId: number | null;
    userName: string;
    userEmail: string;
    event: string;
    description: string;
    properties: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    time: string;
}

interface UserOption {
    id: number;
    routeKey?: string;
    name: string;
    email: string;
}

interface ActivityLogsPageProps {
    logs: ActivityLogItem[];
    users: UserOption[];
    events: string[];
    summary: {
        logCount: number;
        userCount: number;
        eventCount: number;
        manualCount: number;
    };
}

interface ActivityLogFormData {
    user_id: number | null;
    event: string;
    description: string;
    properties: Record<string, string>;
    ip_address: string;
    user_agent: string;
}

type DrawerMode = 'create' | 'edit';

const emptyForm: ActivityLogFormData = {
    user_id: null,
    event: 'manual',
    description: '',
    properties: {},
    ip_address: '',
    user_agent: '',
};

function eventBadge(event: string): 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray' {
    if (event.includes('deleted')) return 'red';
    if (event.includes('updated')) return 'amber';
    if (event.includes('created')) return 'green';
    if (event.includes('login')) return 'blue';
    if (event.includes('manual')) return 'purple';
    return 'gray';
}

export default function ActivityLogsPage({ logs, users, events, summary }: ActivityLogsPageProps) {
    const [selectedEvent, setSelectedEvent] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingLog, setEditingLog] = useState<ActivityLogItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ActivityLogItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<ActivityLogFormData>(emptyForm);

    useEffect(() => { setPage(1); }, [selectedEvent, selectedUser, search, perPage]);

    const filtered = useMemo(
        () => logs.filter(log => {
            const eventMatches = selectedEvent === 'all' || log.event === selectedEvent;
            const userMatches = selectedUser === 'all' || log.userId === selectedUser;
            const query = search.toLowerCase();
            const searchMatches = !query
                || log.userName.toLowerCase().includes(query)
                || log.userEmail.toLowerCase().includes(query)
                || log.event.toLowerCase().includes(query)
                || log.description.toLowerCase().includes(query)
                || log.ipAddress.toLowerCase().includes(query);

            return eventMatches && userMatches && searchMatches;
        }),
        [logs, selectedEvent, selectedUser, search],
    );

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const openCreateDrawer = () => {
        reset();
        setData(emptyForm);
        setEditingLog(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (log: ActivityLogItem) => {
        const properties: Record<string, string> = {};
        Object.entries(log.properties ?? {}).forEach(([key, value]) => {
            properties[key] = String(value ?? '');
        });

        setData({
            user_id: log.userId,
            event: log.event,
            description: log.description,
            properties,
            ip_address: log.ipAddress,
            user_agent: log.userAgent,
        });
        setEditingLog(log);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingLog(null);
    };

    const submitLog = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Activity log updated.' : 'Activity log created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingLog) {
            put(update.url((editingLog.routeKey ?? editingLog.id) as never), options);
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
                toast.success('Activity log deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Activity Logs</div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>កំណត់ត្រាសកម្មភាព - Audit system activity</KH>
                    </div>
                    <button onClick={openCreateDrawer} style={primaryButton}>
                        <Plus size={16} />
                        Add Log
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Logs', value: summary.logCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Users', value: summary.userCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Events', value: summary.eventCount, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Manual', value: summary.manualCount, color: '#7c3aed', bg: '#f5f3ff' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <AdminSelect
                            value={selectedEvent}
                            onChange={setSelectedEvent}
                            options={[{ value: 'all', label: 'All events' }, ...events.map(event => ({ value: event, label: event }))]}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-extrabold"
                        />
                        <AdminSelect
                            value={String(selectedUser)}
                            onChange={value => setSelectedUser(value === 'all' ? 'all' : Number(value))}
                            options={[{ value: 'all', label: 'All users' }, ...users.map(user => ({ value: String(user.id), label: user.name }))]}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-extrabold"
                        />
                        <AdminSelect
                            value={perPage.toString()}
                            onChange={value => setPerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            style={{ minWidth: 130 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-extrabold"
                        />
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="f-input"
                            placeholder="Search activity logs..."
                            style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                        />
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Event</th>
                                <th>Description</th>
                                <th>IP</th>
                                <th>When</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '38px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        {search ? <>No activity logs found for <strong>"{search}"</strong></> : 'No activity logs found'}
                                    </td>
                                </tr>
                            ) : paginated.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        {log.userName ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={log.userName} size={34} />
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{log.userName}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.userEmail}</div>
                                                </div>
                                            </div>
                                        ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>System</span>}
                                    </td>
                                    <td><Badge type={eventBadge(log.event)}>{log.event}</Badge></td>
                                    <td style={{ maxWidth: 360 }}>
                                        <div style={{ fontSize: 13, color: '#374151', fontWeight: 700 }}>{log.description || '-'}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{Object.keys(log.properties ?? {}).length} properties</div>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{log.ipAddress || '-'}</td>
                                    <td>
                                        <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 800 }}>{log.time}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.createdAt}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEditDrawer(log)} style={iconButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit"><Edit3 size={14} /></button>
                                            <button onClick={() => setDeleteTarget(log)} style={iconButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete"><Trash2 size={14} /></button>
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
                        <form onSubmit={submitLog} className="flex min-h-full flex-col bg-white">
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create' ? 'Add Activity Log' : 'Edit Activity Log'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Create a manual audit entry' : editingLog?.event}
                                </SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Field label="User" error={errors.user_id} wide>
                                    <AdminSelect
                                        value={data.user_id ? String(data.user_id) : 'system'}
                                        onChange={value => setData('user_id', value === 'system' ? null : Number(value))}
                                        options={[{ value: 'system', label: 'System' }, ...users.map(user => ({ value: String(user.id), label: user.name }))]}
                                    />
                                </Field>
                                <Field label="Event" error={errors.event}>
                                    <input style={fieldStyle} value={data.event} onChange={event => setData('event', event.target.value)} />
                                </Field>
                                <Field label="IP Address" error={errors.ip_address}>
                                    <input style={fieldStyle} value={data.ip_address} onChange={event => setData('ip_address', event.target.value)} />
                                </Field>
                                <Field label="Description" error={errors.description} wide>
                                    <textarea style={{ ...fieldStyle, minHeight: 105, resize: 'vertical' }} value={data.description} onChange={event => setData('description', event.target.value)} />
                                </Field>
                                <Field label="Property: source" wide>
                                    <input style={fieldStyle} value={data.properties.source ?? ''} onChange={event => setData('properties', { ...data.properties, source: event.target.value })} />
                                </Field>
                                <Field label="User Agent" error={errors.user_agent} wide>
                                    <textarea style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} value={data.user_agent} onChange={event => setData('user_agent', event.target.value)} />
                                </Field>
                            </div>

                            <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer' }}>
                                    {drawerMode === 'create' ? 'Save Log' : 'Save Changes'}
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
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Activity Log?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove <strong>{deleteTarget.event}</strong> log?</div>
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



