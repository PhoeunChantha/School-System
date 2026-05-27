import { destroy, markAllRead, markRead, store, update } from '@/actions/App/Http/Controllers/Backends/NotificationController';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Bell, Check, CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type NotificationCategory = 'attendance' | 'fees' | 'homework' | 'system';
type NotificationSeverity = 'info' | 'warning' | 'urgent';
type CategoryFilter = NotificationCategory | 'all';
type DrawerMode = 'create' | 'edit';

interface NotificationItem {
    id: number;
    routeKey?: string;
    category: string;
    titleKh: string;
    title: string;
    body: string;
    severity: string;
    studentId: number | null;
    studentName: string;
    userId: number | null;
    userName: string;
    read: boolean;
    time: string;
    createdAt: string;
}

interface StudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
}

interface UserOption {
    id: number;
    routeKey?: string;
    name: string;
    email: string;
}

interface NotificationsPageProps {
    notifications: NotificationItem[];
    students: StudentOption[];
    users: UserOption[];
    summary: {
        notificationCount: number;
        unreadCount: number;
        urgentCount: number;
        readCount: number;
    };
}

interface NotificationFormData {
    category: NotificationCategory;
    title_kh: string;
    title: string;
    body: string;
    severity: NotificationSeverity;
    student_id: number | null;
    user_id: number | null;
    is_read: boolean;
}

const CATEGORY_LABELS: Record<NotificationCategory, { label: string; tone: 'blue' | 'amber' | 'violet' | 'slate' }> = {
    attendance: { label: 'Attendance', tone: 'blue' },
    fees: { label: 'Fees', tone: 'amber' },
    homework: { label: 'Homework', tone: 'violet' },
    system: { label: 'System', tone: 'slate' },
};

const DEFAULT_CATEGORY = CATEGORY_LABELS.system;

function isNotificationCategory(category: string): category is NotificationCategory {
    return category in CATEGORY_LABELS;
}

function getCategoryMeta(category: string) {
    return isNotificationCategory(category) ? CATEGORY_LABELS[category] : DEFAULT_CATEGORY;
}

const severityType = {
    info: 'blue',
    warning: 'amber',
    urgent: 'red',
} as const;

function getSeverityType(severity: string) {
    return severity in severityType ? severityType[severity as NotificationSeverity] : severityType.info;
}

const emptyForm: NotificationFormData = {
    category: 'system',
    title_kh: '',
    title: '',
    body: '',
    severity: 'info',
    student_id: null,
    user_id: null,
    is_read: false,
};

const pageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)]';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

export default function NotificationsPage({ notifications, students, users, summary }: NotificationsPageProps) {
    const { can } = useAdminPermissions();
    const canCreate = can('notifications.create');
    const canUpdate = can('notifications.update');
    const canDelete = can('notifications.delete');
    const canMarkRead = can('notifications.mark-read');
    const canMarkAllRead = can('notifications.mark-all-read');
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<NotificationFormData>(emptyForm);

    const displayed = useMemo(
        () => category === 'all' ? notifications : notifications.filter(notification => notification.category === category),
        [category, notifications],
    );
    const paginatedDisplayed = useMemo(
        () => displayed.slice((page - 1) * perPage, page * perPage),
        [displayed, page, perPage],
    );

    useEffect(() => {
        setPage(1);
    }, [category, perPage]);

    const categories: { id: CategoryFilter; label: string }[] = [
        { id: 'all', label: `All (${notifications.length})` },
        ...Object.entries(CATEGORY_LABELS).map(([id, meta]) => ({
            id: id as NotificationCategory,
            label: `${meta.label} (${notifications.filter(notification => notification.category === id).length})`,
        })),
    ];

    const openCreateDrawer = () => {
        if (!canCreate) return;
        reset();
        setData(emptyForm);
        setEditingNotification(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (notification: NotificationItem) => {
        if (!canUpdate) return;
        setData({
            category: isNotificationCategory(notification.category) ? notification.category : 'system',
            title_kh: notification.titleKh,
            title: notification.title,
            body: notification.body,
            severity: notification.severity in severityType ? (notification.severity as NotificationSeverity) : 'info',
            student_id: notification.studentId,
            user_id: notification.userId,
            is_read: notification.read,
        });
        setEditingNotification(notification);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingNotification(null);
    };

    const submitNotification = (event: FormEvent<HTMLFormElement>) => {
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
                toast.success(drawerMode === 'edit' ? 'Notification updated.' : 'Notification created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingNotification) {
            put(update.url((editingNotification.routeKey ?? editingNotification.id) as never), options);
            return;
        }

        post(store.url(), options);
    };

    const markNotificationRead = (notification: NotificationItem) => {
        if (!canMarkRead || notification.read) return;

        router.put(markRead.url((notification.routeKey ?? notification.id) as never), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Notification marked as read.'),
        });
    };

    const markEveryNotificationRead = () => {
        if (!canMarkAllRead) return;

        router.put(markAllRead.url(), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('All notifications marked as read.'),
        });
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
                toast.success('Notification deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const actionsFor = (notification: NotificationItem) => [
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(notification), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(notification), variant: 'destructive' as const, separatorBefore: true, hidden: !canDelete },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <strong className="text-xl font-black text-slate-900 dark:text-slate-50">Notifications</strong>
                                {summary.unreadCount > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">{summary.unreadCount} new</span>}
                            </div>
                            <p className="mt-1 truncate text-xs font-bold text-slate-400">School notifications and student updates</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {canMarkAllRead && summary.unreadCount > 0 && (
                                <button onClick={markEveryNotificationRead} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900" aria-label="Mark all read">
                                    <Check size={17} />
                                </button>
                            )}
                            {canCreate && (
                                <button onClick={openCreateDrawer} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add notification">
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <MetricCard label="Total" value={summary.notificationCount} tone="blue" />
                    <MetricCard label="Unread" value={summary.unreadCount} tone="red" />
                    <MetricCard label="Urgent" value={summary.urgentCount} tone="amber" />
                    <MetricCard label="Read" value={summary.readCount} tone="green" />
                </div>

                <section className={panelClass}>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {categories.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setCategory(option.id)}
                                className={`min-h-9 shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition ${category === option.id ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid gap-3">
                    {displayed.length === 0 && (
                        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-950">
                                <Bell size={30} />
                            </div>
                            No notifications
                        </div>
                    )}
                    {paginatedDisplayed.map(notification => {
                        const cat = getCategoryMeta(notification.category);
                        const isUnread = !notification.read;

                        return (
                            <article key={notification.id} className={`${mobileCardClass} relative overflow-hidden ${isUnread ? 'border-blue-300 bg-white dark:border-blue-500/40 dark:bg-slate-800/95' : 'border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-800/90'}`}>
                                {isUnread && <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-blue-500" />}
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => markNotificationRead(notification)}
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${notification.severity === 'urgent' ? 'bg-red-500/10 text-red-500' : `${toneSoftClass(cat.tone)} ${toneTextClass(cat.tone)}`} ${notification.read ? 'cursor-default' : 'cursor-pointer hover:scale-[1.03]'}`}
                                        title={notification.read ? 'Read' : 'Mark as read'}
                                    >
                                        {notification.read ? <CheckCircle2 size={19} /> : <Bell size={19} />}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                            {isUnread && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                                            <Badge type={getSeverityType(notification.severity)}>{notification.severity || 'info'}</Badge>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${toneSoftClass(cat.tone)} ${toneTextClass(cat.tone)}`}>{cat.label}</span>
                                        </div>
                                        <KH className="block line-clamp-1 text-sm font-black text-slate-900 dark:text-slate-50">{notification.titleKh || notification.title}</KH>
                                        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{notification.body}</p>
                                        <p className="mt-2 truncate text-[11px] font-bold text-slate-400">
                                            {notification.time}
                                            {notification.studentName && ` - Student: ${notification.studentName}`}
                                            {notification.userName && ` - User: ${notification.userName}`}
                                        </p>
                                    </div>
                                    {(canUpdate || canDelete) && <RowActions ariaLabel={`Actions for ${notification.title}`} actions={actionsFor(notification)} />}
                                </div>
                            </article>
                        );
                    })}
                    {displayed.length > 0 && (
                        <Pagination total={displayed.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </section>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitNotification} className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {drawerMode === 'create' ? 'Add Notification' : 'Edit Notification'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Create a school notification' : editingNotification?.title}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-5">
                                <Field label="Category" error={errors.category}>
                                    <AdminSelect value={data.category} onChange={value => setData('category', value as NotificationCategory)} options={Object.entries(CATEGORY_LABELS).map(([id, meta]) => ({ value: id, label: meta.label }))} triggerClassName={inputClass} />
                                </Field>
                                <Field label="Severity" error={errors.severity}>
                                    <AdminSelect value={data.severity} onChange={value => setData('severity', value as NotificationSeverity)} options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'urgent', label: 'Urgent' }]} triggerClassName={inputClass} />
                                </Field>
                                <Field label="Khmer Title" error={errors.title_kh} wide>
                                    <input className={inputClass} value={data.title_kh} onChange={event => setData('title_kh', event.target.value)} />
                                </Field>
                                <Field label="Title" error={errors.title} wide>
                                    <input className={inputClass} value={data.title} onChange={event => setData('title', event.target.value)} />
                                </Field>
                                <Field label="Body" error={errors.body} wide>
                                    <textarea className={`${inputClass} min-h-28 resize-y`} value={data.body} onChange={event => setData('body', event.target.value)} />
                                </Field>
                                <Field label="Student" error={errors.student_id}>
                                    <AdminSelect value={data.student_id ? String(data.student_id) : 'none'} onChange={value => setData('student_id', value === 'none' ? null : Number(value))} options={[{ value: 'none', label: 'No student' }, ...students.map(student => ({ value: String(student.id), label: student.nameEn }))]} triggerClassName={inputClass} />
                                </Field>
                                <Field label="User" error={errors.user_id}>
                                    <AdminSelect value={data.user_id ? String(data.user_id) : 'none'} onChange={value => setData('user_id', value === 'none' ? null : Number(value))} options={[{ value: 'none', label: 'No user' }, ...users.map(user => ({ value: String(user.id), label: user.name }))]} triggerClassName={inputClass} />
                                </Field>
                                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 md:col-span-2">
                                    <input type="checkbox" checked={data.is_read} onChange={event => setData('is_read', event.target.checked)} />
                                    Mark as read
                                </label>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                                <button type="button" onClick={closeDrawer} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                    <X size={15} /> Cancel
                                </button>
                                <button disabled={processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                    {drawerMode === 'create' ? 'Save Notification' : 'Save Changes'}
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
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Notification?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.title}</strong>?</div>
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

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'red' | 'amber' | 'green' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="text-2xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function metricClass(tone: 'blue' | 'red' | 'amber' | 'green') {
    if (tone === 'red') return 'border-red-500/25 bg-red-500/10 text-red-500';
    if (tone === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-500';
    if (tone === 'green') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500';
    return 'border-blue-500/25 bg-blue-500/10 text-blue-500';
}

function toneSoftClass(tone: 'blue' | 'amber' | 'violet' | 'slate') {
    if (tone === 'amber') return 'bg-amber-500/10';
    if (tone === 'violet') return 'bg-violet-500/10';
    if (tone === 'slate') return 'bg-slate-500/10';
    return 'bg-blue-500/10';
}

function toneTextClass(tone: 'blue' | 'amber' | 'violet' | 'slate') {
    if (tone === 'amber') return 'text-amber-500';
    if (tone === 'violet') return 'text-violet-500';
    if (tone === 'slate') return 'text-slate-500 dark:text-slate-300';
    return 'text-blue-500';
}
