import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import {
    read as readStudentMessages,
    show as showStudentMessage,
} from '@/routes/student/notifications';
import { Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CheckCheck,
    CheckCircle,
    Info,
    MessageCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: number;
    routeKey: string;
    category: string;
    title: string;
    body: string;
    severity: string;
    read: boolean;
    createdAt: string;
}

interface Props {
    profile: StudentProfile;
    notifications: Notification[];
}

type TabKey = 'all' | 'unread';

function severityConfig(severity: string) {
    if (severity === 'critical' || severity === 'urgent') {
        return { bg: '#fee2e2', color: '#e11d48', icon: AlertTriangle };
    }
    if (severity === 'warning') {
        return { bg: '#fef3c7', color: '#d97706', icon: AlertTriangle };
    }
    if (severity === 'success') {
        return { bg: '#dcfce7', color: '#059669', icon: CheckCircle };
    }
    if (severity === 'info') {
        return { bg: '#dbeafe', color: '#2563eb', icon: Info };
    }

    return { bg: '#ffedd5', color: '#ea580c', icon: Bell };
}

function formatTime(date: string) {
    if (!date) {
        return '';
    }

    const timestamp = new Date(date);
    const diff = Date.now() - timestamp.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) {
        return 'Just now';
    }
    if (mins < 60) {
        return `${mins}m ago`;
    }
    if (hours < 24) {
        return `${hours}h ago`;
    }
    if (days < 7) {
        return `${days}d ago`;
    }

    return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export default function StudentNotifications({
    profile,
    notifications,
}: Props) {
    const [tab, setTab] = useState<TabKey>('all');

    const unread = notifications.filter((notification) => !notification.read);
    const shown = tab === 'unread' ? unread : notifications;

    return (
        <StudentShell
            profile={profile}
            activePage="notifications"
            title="Messages"
        >
            <div className="s-page-header s-fade-up">
                <div
                    className="s-page-accent"
                    style={{ background: '#dbeafe' }}
                >
                    <MessageCircle size={18} color="#2563eb" />
                </div>
                <div className="s-page-title">Messages</div>
                {unread.length > 0 && (
                    <button
                        type="button"
                        className="student-message-read-btn"
                        onClick={() => {
                            router.put(
                                readStudentMessages.url(),
                                {},
                                {
                                    only: ['profile', 'notifications'],
                                    preserveScroll: true,
                                },
                            );
                        }}
                    >
                        <CheckCheck size={14} />
                        Read all
                    </button>
                )}
            </div>

            <div className="s-tabs s-fade-up s-delay-1">
                <button
                    className={`s-tab${tab === 'all' ? ' active' : ''}`}
                    aria-selected={tab === 'all'}
                    onClick={() => setTab('all')}
                >
                    All ({notifications.length})
                </button>
                <button
                    className={`s-tab${tab === 'unread' ? ' active' : ''}`}
                    aria-selected={tab === 'unread'}
                    onClick={() => setTab('unread')}
                >
                    Unread ({unread.length})
                </button>
            </div>

            {shown.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <Bell className="s-empty-icon" size={42} />
                        <div className="s-empty-text">
                            {tab === 'unread'
                                ? 'All messages are read'
                                : 'No messages yet'}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-2">
                    {shown.map((notification) => {
                        const cfg = severityConfig(notification.severity);
                        const SevIcon = cfg.icon;

                        return (
                            <Link
                                key={notification.id}
                                href={showStudentMessage(
                                    notification.routeKey as unknown as number,
                                )}
                                className="s-list-item"
                                style={
                                    !notification.read
                                        ? {
                                              background: '#fafbff',
                                              textDecoration: 'none',
                                          }
                                        : { textDecoration: 'none' }
                                }
                            >
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 13,
                                        background: cfg.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        position: 'relative',
                                    }}
                                >
                                    <SevIcon size={18} color={cfg.color} />
                                    {!notification.read && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: -2,
                                                right: -2,
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: '#ea580c',
                                                border: '2px solid white',
                                            }}
                                        />
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: notification.read
                                                ? 600
                                                : 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                        }}
                                    >
                                        {notification.title}
                                    </div>
                                    {notification.body && (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: '#6b7280',
                                                fontWeight: 400,
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {notification.body}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: '#d1d5db',
                                            fontWeight: 600,
                                            marginTop: 4,
                                        }}
                                    >
                                        {formatTime(notification.createdAt)}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
