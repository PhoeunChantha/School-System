import {
    destroy,
    markAllRead,
    markRead,
    store,
    update,
} from '@/actions/App/Http/Controllers/Backends/NotificationController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, KH, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Bell, Check, Edit3, Plus, Trash2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { FormEvent, useMemo, useState } from 'react';
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

const CATEGORY_LABELS: Record<
    NotificationCategory,
    { kh: string; label: string; color: string; bg: string }
> = {
    attendance: {
        kh: 'វត្តមាន',
        label: 'Attendance',
        color: '#2563eb',
        bg: '#eff6ff',
    },
    fees: { kh: 'ថ្លៃ', label: 'Fees', color: '#d97706', bg: '#fffbeb' },
    homework: {
        kh: 'ការងារ',
        label: 'Homework',
        color: '#7c3aed',
        bg: '#f5f3ff',
    },
    system: {
        kh: 'ប្រព័ន្ធ',
        label: 'System',
        color: '#64748b',
        bg: '#f1f5f9',
    },
};

const DEFAULT_CATEGORY = CATEGORY_LABELS.system;

function isNotificationCategory(
    category: string,
): category is NotificationCategory {
    return category in CATEGORY_LABELS;
}

function getCategoryMeta(category: string) {
    return isNotificationCategory(category)
        ? CATEGORY_LABELS[category]
        : DEFAULT_CATEGORY;
}

function getSeverityType(severity: string) {
    return severity in severityType
        ? severityType[severity as NotificationSeverity]
        : severityType.info;
}

const severityType = {
    info: 'blue',
    warning: 'amber',
    urgent: 'red',
} as const;

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

export default function NotificationsPage({
    notifications,
    students,
    users,
    summary,
}: NotificationsPageProps) {
    const { can } = useAdminPermissions();
    const canCreate = can('notifications.create');
    const canUpdate = can('notifications.update');
    const canDelete = can('notifications.delete');
    const canMarkRead = can('notifications.mark-read');
    const canMarkAllRead = can('notifications.mark-all-read');
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingNotification, setEditingNotification] =
        useState<NotificationItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(
        null,
    );

    const { data, setData, post, put, processing, errors, reset } =
        useForm<NotificationFormData>(emptyForm);

    const displayed = useMemo(
        () =>
            category === 'all'
                ? notifications
                : notifications.filter(
                      (notification) => notification.category === category,
                  ),
        [category, notifications],
    );

    const categories: { id: CategoryFilter; label: string }[] = [
        { id: 'all', label: `All (${notifications.length})` },
        ...Object.entries(CATEGORY_LABELS).map(([id, meta]) => ({
            id: id as NotificationCategory,
            label: `${meta.label} (${notifications.filter((notification) => notification.category === id).length})`,
        })),
    ];

    const openCreateDrawer = () => {
        if (!canCreate) {
            return;
        }

        reset();
        setData(emptyForm);
        setEditingNotification(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (notification: NotificationItem) => {
        if (!canUpdate) {
            return;
        }

        setData({
            category: isNotificationCategory(notification.category)
                ? notification.category
                : 'system',
            title_kh: notification.titleKh,
            title: notification.title,
            body: notification.body,
            severity:
                notification.severity in severityType
                    ? (notification.severity as NotificationSeverity)
                    : 'info',
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
                toast.success(
                    drawerMode === 'edit'
                        ? 'Notification updated.'
                        : 'Notification created.',
                );
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingNotification) {
            put(
                update.url(
                    (editingNotification.routeKey ??
                        editingNotification.id) as never,
                ),
                options,
            );
            return;
        }

        post(store.url(), options);
    };

    const markNotificationRead = (notification: NotificationItem) => {
        if (!canMarkRead) {
            return;
        }

        if (notification.read) {
            return;
        }

        router.put(
            markRead.url((notification.routeKey ?? notification.id) as never),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Notification marked as read.'),
            },
        );
    };

    const markEveryNotificationRead = () => {
        if (!canMarkAllRead) {
            return;
        }

        router.put(
            markAllRead.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('All notifications marked as read.'),
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(
            destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Notification deleted.');
                    setDeleteTarget(null);
                },
            },
        );
    };

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 800,
                                    fontSize: 18,
                                    color: '#1e293b',
                                }}
                            >
                                Notifications
                            </div>
                            {summary.unreadCount > 0 && (
                                <span
                                    style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        borderRadius: 99,
                                        padding: '2px 8px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                    }}
                                >
                                    {summary.unreadCount} new
                                </span>
                            )}
                        </div>
                        <KH
                            style={{
                                fontSize: 12,
                                color: '#94a3b8',
                                display: 'block',
                            }}
                        >
                            ការជូនដំណឹង - School notifications
                        </KH>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {canMarkAllRead && summary.unreadCount > 0 && (
                            <button
                                onClick={markEveryNotificationRead}
                                className="admin-btn admin-btn-ghost"
                            >
                                <Check size={15} />
                                Mark All Read
                            </button>
                        )}
                        {canCreate && (
                            <button
                                onClick={openCreateDrawer}
                                className="admin-btn admin-btn-primary"
                            >
                                <Plus size={15} />
                                Add Notification
                            </button>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill,minmax(150px,1fr))',
                        gap: 12,
                    }}
                >
                    {[
                        {
                            label: 'Total',
                            value: summary.notificationCount,
                            color: '#3b82f6',
                            bg: '#eff6ff',
                        },
                        {
                            label: 'Unread',
                            value: summary.unreadCount,
                            color: '#ef4444',
                            bg: '#fff1f2',
                        },
                        {
                            label: 'Urgent',
                            value: summary.urgentCount,
                            color: '#f59e0b',
                            bg: '#fffbeb',
                        },
                        {
                            label: 'Read',
                            value: summary.readCount,
                            color: '#10b981',
                            bg: '#f0fdf4',
                        },
                    ].map((card) => (
                        <div
                            key={card.label}
                            style={{
                                background: card.bg,
                                border: `1px solid ${card.color}30`,
                                borderRadius: 14,
                                padding: 16,
                            }}
                        >
                            <div
                                style={{
                                    color: card.color,
                                    fontSize: 24,
                                    fontWeight: 900,
                                }}
                            >
                                {card.value}
                            </div>
                            <div
                                style={{
                                    color: card.color,
                                    opacity: 0.72,
                                    fontSize: 11,
                                }}
                            >
                                {card.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {categories.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setCategory(option.id)}
                            style={{
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: '1.5px solid',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 800,
                                borderColor:
                                    category === option.id
                                        ? '#3b82f6'
                                        : '#e2e8f0',
                                background:
                                    category === option.id
                                        ? '#eff6ff'
                                        : 'white',
                                color:
                                    category === option.id
                                        ? '#2563eb'
                                        : '#64748b',
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                    {displayed.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '60px 0',
                                color: '#94a3b8',
                            }}
                        >
                            <Bell size={38} style={{ margin: '0 auto 12px' }} />
                            <div style={{ fontWeight: 800 }}>
                                No notifications
                            </div>
                        </div>
                    )}
                    {displayed.map((notification) => {
                        const cat = getCategoryMeta(notification.category);
                        return (
                            <div
                                key={notification.id}
                                style={{
                                    background: notification.read
                                        ? 'white'
                                        : '#f8faff',
                                    border: `1px solid ${notification.read ? '#e8edf5' : '#bfdbfe'}`,
                                    borderRadius: 14,
                                    padding: '16px 18px',
                                    display: 'flex',
                                    gap: 14,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <button
                                    onClick={() =>
                                        markNotificationRead(notification)
                                    }
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        border: 'none',
                                        background:
                                            notification.severity === 'urgent'
                                                ? '#fff1f2'
                                                : cat.bg,
                                        color:
                                            notification.severity === 'urgent'
                                                ? '#ef4444'
                                                : cat.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        cursor: notification.read
                                            ? 'default'
                                            : 'pointer',
                                    }}
                                    title={
                                        notification.read
                                            ? 'Read'
                                            : 'Mark as read'
                                    }
                                >
                                    {notification.read ? (
                                        <Check size={19} />
                                    ) : (
                                        <Bell size={19} />
                                    )}
                                </button>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 4,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {notification.titleKh && (
                                            <KH
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {notification.titleKh}
                                            </KH>
                                        )}
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: '#1e293b',
                                                fontWeight: 800,
                                            }}
                                        >
                                            {notification.title}
                                        </span>
                                        {!notification.read && (
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    display: 'inline-block',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <Badge
                                            type={getSeverityType(
                                                notification.severity,
                                            )}
                                        >
                                            {notification.severity || 'info'}
                                        </Badge>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                background: cat.bg,
                                                color: cat.color,
                                                padding: '1px 7px',
                                                borderRadius: 99,
                                                fontWeight: 800,
                                            }}
                                        >
                                            <KH>{cat.kh}</KH>
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#64748b',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {notification.body || '-'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                            marginTop: 6,
                                        }}
                                    >
                                        {notification.time}
                                        {notification.studentName &&
                                            ` - Student: ${notification.studentName}`}
                                        {notification.userName &&
                                            ` - User: ${notification.userName}`}
                                    </div>
                                </div>

                                {(canUpdate || canDelete) && (
                                    <div style={{ flexShrink: 0 }}>
                                        <RowActions
                                            ariaLabel={`Actions for ${notification.title}`}
                                            actions={[
                                                {
                                                    key: 'edit',
                                                    label: 'Edit',
                                                    icon: Edit3,
                                                    onSelect: () =>
                                                        openEditDrawer(
                                                            notification,
                                                        ),
                                                    hidden: !canUpdate,
                                                },
                                                {
                                                    key: 'delete',
                                                    label: 'Delete',
                                                    icon: Trash2,
                                                    onSelect: () =>
                                                        setDeleteTarget(
                                                            notification,
                                                        ),
                                                    variant: 'destructive',
                                                    separatorBefore: true,
                                                    hidden: !canDelete,
                                                },
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Sheet
                open={drawerMode !== null}
                onOpenChange={(open) => {
                    if (!open) closeDrawer();
                }}
            >
                <SheetContent
                    side="right"
                    className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]"
                >
                    {drawerMode && (
                        <form
                            onSubmit={submitNotification}
                            className="flex min-h-full flex-col bg-white"
                        >
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create'
                                        ? 'Add Notification'
                                        : 'Edit Notification'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create'
                                        ? 'Create a school notification'
                                        : editingNotification?.title}
                                </SheetDescription>
                            </SheetHeader>

                            <div
                                style={{
                                    padding: 24,
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 16,
                                }}
                            >
                                <Field label="Category" error={errors.category}>
                                    <AdminSelect
                                        value={data.category}
                                        onChange={(value) =>
                                            setData(
                                                'category',
                                                value as NotificationCategory,
                                            )
                                        }
                                        options={Object.entries(
                                            CATEGORY_LABELS,
                                        ).map(([id, meta]) => ({
                                            value: id,
                                            label: meta.label,
                                        }))}
                                    />
                                </Field>
                                <Field label="Severity" error={errors.severity}>
                                    <AdminSelect
                                        value={data.severity}
                                        onChange={(value) =>
                                            setData(
                                                'severity',
                                                value as NotificationSeverity,
                                            )
                                        }
                                        options={[
                                            { value: 'info', label: 'Info' },
                                            {
                                                value: 'warning',
                                                label: 'Warning',
                                            },
                                            {
                                                value: 'urgent',
                                                label: 'Urgent',
                                            },
                                        ]}
                                    />
                                </Field>
                                <Field
                                    label="Khmer Title"
                                    error={errors.title_kh}
                                    wide
                                >
                                    <input
                                        style={fieldStyle}
                                        value={data.title_kh}
                                        onChange={(event) =>
                                            setData(
                                                'title_kh',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field label="Title" error={errors.title} wide>
                                    <input
                                        style={fieldStyle}
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Body" error={errors.body} wide>
                                    <textarea
                                        style={{
                                            ...fieldStyle,
                                            minHeight: 118,
                                            resize: 'vertical',
                                        }}
                                        value={data.body}
                                        onChange={(event) =>
                                            setData('body', event.target.value)
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Student"
                                    error={errors.student_id}
                                >
                                    <AdminSelect
                                        value={
                                            data.student_id
                                                ? String(data.student_id)
                                                : 'none'
                                        }
                                        onChange={(value) =>
                                            setData(
                                                'student_id',
                                                value === 'none'
                                                    ? null
                                                    : Number(value),
                                            )
                                        }
                                        options={[
                                            {
                                                value: 'none',
                                                label: 'No student',
                                            },
                                            ...students.map((student) => ({
                                                value: String(student.id),
                                                label: student.nameEn,
                                            })),
                                        ]}
                                    />
                                </Field>
                                <Field label="User" error={errors.user_id}>
                                    <AdminSelect
                                        value={
                                            data.user_id
                                                ? String(data.user_id)
                                                : 'none'
                                        }
                                        onChange={(value) =>
                                            setData(
                                                'user_id',
                                                value === 'none'
                                                    ? null
                                                    : Number(value),
                                            )
                                        }
                                        options={[
                                            { value: 'none', label: 'No user' },
                                            ...users.map((user) => ({
                                                value: String(user.id),
                                                label: user.name,
                                            })),
                                        ]}
                                    />
                                </Field>
                                <label
                                    style={{
                                        gridColumn: '1 / -1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: '#64748b',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.is_read}
                                        onChange={(event) =>
                                            setData(
                                                'is_read',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Mark as read
                                </label>
                            </div>

                            <div
                                style={{
                                    marginTop: 'auto',
                                    padding: 24,
                                    borderTop: '1px solid #e2e8f0',
                                    display: 'flex',
                                    gap: 10,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    style={{
                                        flex: 1,
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={processing}
                                    type="submit"
                                    style={{
                                        flex: 2,
                                        background: processing
                                            ? '#93c5fd'
                                            : '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '12px',
                                        fontWeight: 800,
                                        cursor: processing
                                            ? 'default'
                                            : 'pointer',
                                    }}
                                >
                                    {drawerMode === 'create'
                                        ? 'Save Notification'
                                        : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {deleteTarget && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 230,
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 20,
                            padding: 30,
                            maxWidth: 420,
                            width: '100%',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: '#1e293b',
                                    marginBottom: 6,
                                }}
                            >
                                Delete Notification?
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: '#64748b',
                                    lineHeight: 1.5,
                                }}
                            >
                                Remove <strong>{deleteTarget.title}</strong>?
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    flex: 1,
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Field({
    label,
    error,
    children,
    wide = false,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    wide?: boolean;
}) {
    return (
        <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
            <label
                style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#64748b',
                    marginBottom: 6,
                }}
            >
                {label}
            </label>
            {children}
            {error && <div className="field-error">{error}</div>}
        </div>
    );
}

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
