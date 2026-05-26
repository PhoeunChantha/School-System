import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ActivityLogController';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Avatar, Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Edit3, Eye, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
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

const pageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const selectClass = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

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
    const [viewingLog, setViewingLog] = useState<ActivityLogItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ActivityLogItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<ActivityLogFormData>(emptyForm);

    useEffect(() => {
        setPage(1);
    }, [selectedEvent, selectedUser, search, perPage]);

    const filtered = useMemo(
        () =>
            logs.filter((log) => {
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
        if (!deleteTarget) return;

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Activity log deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const actionsFor = (log: ActivityLogItem) => [
        { key: 'view', label: 'View detail', icon: Eye, onSelect: () => setViewingLog(log) },
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(log) },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(log), variant: 'destructive' as const, separatorBefore: true },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-black text-blue-500">Audit trail</p>
                            <h1 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">Activity Logs</h1>
                            <p className="mt-1 truncate text-xs font-bold text-slate-400">{filtered.length} visible from {summary.logCount} records</p>
                        </div>
                        <button onClick={openCreateDrawer} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add log">
                            <Plus size={18} />
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <MetricCard label="Logs" value={summary.logCount} tone="blue" />
                    <MetricCard label="Users" value={summary.userCount} tone="green" />
                    <MetricCard label="Events" value={summary.eventCount} tone="amber" />
                    <MetricCard label="Manual" value={summary.manualCount} tone="purple" />
                </div>

                <section className={panelClass}>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3">
                        <div className="contents md:flex md:flex-wrap md:items-center md:gap-2">
                            <AdminSelect value={selectedEvent} onChange={setSelectedEvent} options={[{ value: 'all', label: 'All events' }, ...events.map(event => ({ value: event, label: event }))]} className="min-w-0 md:w-[180px]" triggerClassName={selectClass} />
                            <AdminSelect value={String(selectedUser)} onChange={value => setSelectedUser(value === 'all' ? 'all' : Number(value))} options={[{ value: 'all', label: 'All users' }, ...users.map(user => ({ value: String(user.id), label: user.name }))]} className="min-w-0 md:w-[180px]" triggerClassName={selectClass} />
                            <AdminSelect value={perPage.toString()} onChange={value => setPerPage(Number(value))} options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))} className="min-w-0 md:w-[130px]" triggerClassName={selectClass} />
                            <div className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-400 dark:border-slate-700 dark:bg-slate-950 md:w-auto md:border-0 md:bg-transparent md:px-0 dark:md:bg-transparent">
                                {filtered.length} results
                            </div>
                        </div>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${inputClass} col-span-2 md:col-start-3 md:w-full`} placeholder="Search activity logs..." />
                    </div>
                </section>

                <section className="grid gap-3">
                    {paginated.length === 0 && (
                        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                            {search ? <>No activity logs found for <strong>"{search}"</strong></> : 'No activity logs found'}
                        </div>
                    )}

                    {paginated.map(log => (
                        <article key={log.id} className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                            <div className="flex items-start gap-3">
                                {log.userName ? <Avatar name={log.userName} size={42} /> : <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-500 dark:bg-slate-700 dark:text-slate-300">SYS</div>}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{log.userName || 'System'}</p>
                                            <p className="truncate text-[11px] font-bold text-slate-400">{log.userEmail || log.ipAddress || 'Internal event'}</p>
                                        </div>
                                        <RowActions ariaLabel={`Actions for ${log.event}`} actions={actionsFor(log)} />
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <Badge type={eventBadge(log.event)}>{log.event}</Badge>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">{log.time}</span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{log.description || '-'}</p>
                                    <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                                        <MiniFact label="IP" value={log.ipAddress || '-'} />
                                        <MiniFact label="Props" value={`${Object.keys(log.properties ?? {}).length}`} />
                                        <MiniFact label="Date" value={log.createdAt || '-'} />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                {filtered.length > 0 && (
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    </div>
                )}
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
                    {drawerMode && (
                        <form onSubmit={submitLog} className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">{drawerMode === 'create' ? 'Add Activity Log' : 'Edit Activity Log'}</SheetTitle>
                                <SheetDescription>{drawerMode === 'create' ? 'Record a manual audit entry' : editingLog?.createdAt}</SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-5">
                                <Field label="User" error={errors.user_id}>
                                    <AdminSelect value={data.user_id ? String(data.user_id) : 'none'} onChange={value => setData('user_id', value === 'none' ? null : Number(value))} options={[{ value: 'none', label: 'System' }, ...users.map(user => ({ value: String(user.id), label: user.name }))]} triggerClassName={inputClass} />
                                </Field>
                                <Field label="Event" error={errors.event}>
                                    <input className={inputClass} value={data.event} onChange={event => setData('event', event.target.value)} />
                                </Field>
                                <Field label="IP Address" error={errors.ip_address}>
                                    <input className={inputClass} value={data.ip_address} onChange={event => setData('ip_address', event.target.value)} />
                                </Field>
                                <Field label="Property: source">
                                    <input className={inputClass} value={data.properties.source ?? ''} onChange={event => setData('properties', { ...data.properties, source: event.target.value })} />
                                </Field>
                                <Field label="Description" error={errors.description} wide>
                                    <textarea className={`${inputClass} min-h-28 resize-y`} value={data.description} onChange={event => setData('description', event.target.value)} />
                                </Field>
                                <Field label="User Agent" error={errors.user_agent} wide>
                                    <textarea className={`${inputClass} min-h-24 resize-y`} value={data.user_agent} onChange={event => setData('user_agent', event.target.value)} />
                                </Field>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                                <button type="button" onClick={closeDrawer} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                    <X size={15} /> Cancel
                                </button>
                                <button disabled={processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                    {drawerMode === 'create' ? 'Save Log' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <Sheet open={viewingLog !== null} onOpenChange={(open) => { if (!open) setViewingLog(null); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
                    {viewingLog && (
                        <div className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                        <Eye size={20} />
                                    </span>
                                    <div>
                                        <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">Activity Detail</SheetTitle>
                                        <SheetDescription>{viewingLog.createdAt}</SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="grid gap-3 p-4">
                                <DetailSection title="Actor">
                                    {viewingLog.userName ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar name={viewingLog.userName} size={42} />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{viewingLog.userName}</p>
                                                <p className="truncate text-xs font-bold text-slate-400">{viewingLog.userEmail}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-300">System</p>
                                    )}
                                </DetailSection>

                                <DetailSection title="Event">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge type={eventBadge(viewingLog.event)}>{viewingLog.event}</Badge>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300">{viewingLog.time}</span>
                                    </div>
                                </DetailSection>

                                <DetailSection title="Description">
                                    <p className="text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">{viewingLog.description || '-'}</p>
                                </DetailSection>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <DetailField label="IP Address" value={viewingLog.ipAddress || '-'} />
                                    <DetailField label="Created At" value={viewingLog.createdAt || '-'} />
                                </div>

                                <DetailSection title="Properties">
                                    {Object.keys(viewingLog.properties ?? {}).length === 0 ? (
                                        <p className="text-sm font-semibold text-slate-400">No properties recorded</p>
                                    ) : (
                                        <div className="grid gap-2">
                                            {Object.entries(viewingLog.properties ?? {}).map(([key, value]) => (
                                                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                                                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{key}</div>
                                                    <div className="mt-1 text-sm font-bold break-words text-slate-700 dark:text-slate-200">{formatPropertyValue(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </DetailSection>

                                <DetailSection title="User Agent">
                                    <p className="text-xs font-semibold leading-5 break-words text-slate-500 dark:text-slate-300">{viewingLog.userAgent || '-'}</p>
                                </DetailSection>
                            </div>
                        </div>
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
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Activity Log?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.event}</strong> log?</div>
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

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'amber' | 'purple' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="text-2xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function MiniFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 border-r border-slate-200 p-2 last:border-r-0 dark:border-slate-700">
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-1 truncate text-[11px] font-black text-slate-800 dark:text-slate-100">{value}</div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
            <div className="text-sm font-bold break-words text-slate-800 dark:text-slate-100">{value}</div>
        </div>
    );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">{title}</div>
            {children}
        </section>
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

function metricClass(tone: 'blue' | 'green' | 'amber' | 'purple') {
    if (tone === 'green') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500';
    if (tone === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-500';
    if (tone === 'purple') return 'border-violet-500/25 bg-violet-500/10 text-violet-500';
    return 'border-blue-500/25 bg-blue-500/10 text-blue-500';
}

function formatPropertyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}
