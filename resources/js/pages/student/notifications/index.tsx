import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: number;
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

function formatTime(d: string) {
    if (!d) return '';
    const dt = new Date(d);
    const now = Date.now();
    const diff = now - dt.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StudentNotifications({
    profile,
    notifications,
}: Props) {
    const [tab, setTab] = useState<TabKey>('all');

    const unread = notifications.filter((n) => !n.read);
    const shown = tab === 'unread' ? unread : notifications;

    return (
        <StudentShell
            profile={profile}
            activePage="notifications"
            title="Notifications"
        >
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div
                    className="s-page-accent"
                    style={{ background: '#ffedd5' }}
                >
                    <Bell size={18} color="#ea580c" />
                </div>
                <div className="s-page-title">Notifications</div>
            </div>

            {/* ── Tabs ── */}
            <div className="s-tabs s-fade-up s-delay-1">
                <button
                    className={`s-tab${tab === 'all' ? 'active' : ''}`}
                    aria-selected={tab === 'all'}
                    onClick={() => setTab('all')}
                >
                    All ({notifications.length})
                </button>
                <button
                    className={`s-tab${tab === 'unread' ? 'active' : ''}`}
                    aria-selected={tab === 'unread'}
                    onClick={() => setTab('unread')}
                >
                    Unread ({unread.length})
                </button>
            </div>

            {/* ── List ── */}
            {shown.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <span className="s-empty-icon">🔔</span>
                        <div className="s-empty-text">
                            {tab === 'unread'
                                ? 'All caught up!'
                                : 'No notifications yet'}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-2">
                    {shown.map((notif, i) => {
                        const cfg = severityConfig(notif.severity);
                        const SevIcon = cfg.icon;

                        return (
                            <div
                                key={notif.id}
                                className="s-list-item"
                                style={
                                    !notif.read
                                        ? { background: '#fafbff' }
                                        : undefined
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
                                    {!notif.read && (
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
                                            fontWeight: notif.read ? 600 : 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                        }}
                                    >
                                        {notif.title}
                                    </div>
                                    {notif.body && (
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
                                            {notif.body}
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
                                        {formatTime(notif.createdAt)}
                                        {notif.category &&
                                            notif.category !== 'general' && (
                                                <span> · {notif.category}</span>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
