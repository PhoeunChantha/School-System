import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { KH, Badge } from '@/pages/admin/ui';
import { toast } from 'sonner';

type NotifCategory = 'all' | 'attendance' | 'fees' | 'homework' | 'system';

interface Notification {
    id: number;
    category: Exclude<NotifCategory, 'all'>;
    icon: string;
    titleKh: string;
    title: string;
    body: string;
    time: string;
    read: boolean;
    priority: 'high' | 'normal';
}

const INITIAL_NOTIFS: Notification[] = [
    { id: 1,  category: 'attendance', icon: '📋', titleKh: 'វត្តមានទាប',       title: 'Low Attendance Alert',      body: 'ទូច ចន្ទ (Touch Chantha) attendance dropped to 45% — immediate action required.',       time: '10 min ago', read: false, priority: 'high' },
    { id: 2,  category: 'attendance', icon: '📋', titleKh: 'វត្តមានទាប',       title: 'Low Attendance Alert',      body: 'ហេង វណ្ណៈ (Heng Vanna) attendance at 65% — below the 70% threshold.',                 time: '25 min ago', read: false, priority: 'high' },
    { id: 3,  category: 'fees',       icon: '💳', titleKh: 'ថ្លៃមិនទាន់បង់',  title: 'Payment Overdue',           body: 'ចាន់ ស្រីណា (Chan Sreyna) — May 2026 fee of $25 is overdue.',                          time: '1 hour ago', read: false, priority: 'high' },
    { id: 4,  category: 'fees',       icon: '💳', titleKh: 'ការទូទាត់ថ្មី',    title: 'Payment Received',          body: 'ម៉ែន ពិសី (Men Pisey) paid $25 via ABA on May 01, 2026.',                              time: '2 hours ago', read: true,  priority: 'normal' },
    { id: 5,  category: 'homework',   icon: '📝', titleKh: 'កិច្ចការផុតកំណត',  title: 'Homework Due Tomorrow',     body: '"Write about your family" (Beginner 1) is due tomorrow — 6 submissions pending.',     time: '3 hours ago', read: false, priority: 'high' },
    { id: 6,  category: 'homework',   icon: '📝', titleKh: 'ការដាក់ស្នើថ្មី',  title: 'New Submissions',           body: '5 new homework submissions for "Present Perfect exercises" (Intermediate 2).',        time: '4 hours ago', read: true,  priority: 'normal' },
    { id: 7,  category: 'system',     icon: '⚙️', titleKh: 'ធ្វើបច្ចុប្បន្នភាព', title: 'System Updated',            body: 'School Management System updated to version 4.0. New features: Reports, Certificates.', time: '1 day ago',  read: true,  priority: 'normal' },
    { id: 8,  category: 'attendance', icon: '📋', titleKh: 'របាយការណ៍ប្រចាំថ្ងៃ','title': 'Daily Attendance Summary', body: 'Today: 85% average attendance across all classes. 2 classes below threshold.',           time: '1 day ago',  read: true,  priority: 'normal' },
    { id: 9,  category: 'fees',       icon: '💳', titleKh: 'ការសង្ខេបប្រចាំខែ', title: 'Monthly Fee Summary',       body: 'May 2026: $105 collected, $450 outstanding from 3 students.',                          time: '2 days ago', read: true,  priority: 'normal' },
    { id: 10, category: 'system',     icon: '🔔', titleKh: 'ថ្ងៃឈប់សម្រាក',     title: 'Upcoming Holiday',          body: 'Visak Bochea Day — May 12, 2026. Classes suspended. Attendance not required.',         time: '3 days ago', read: true,  priority: 'normal' },
];

const CATEGORY_LABELS: Record<Exclude<NotifCategory, 'all'>, { kh: string; color: string; bg: string }> = {
    attendance: { kh: 'វត្តមាន', color: '#2563eb', bg: '#eff6ff' },
    fees:       { kh: 'ថ្លៃ',    color: '#d97706', bg: '#fffbeb' },
    homework:   { kh: 'ការងារ',   color: '#7c3aed', bg: '#f5f3ff' },
    system:     { kh: 'ប្រព័ន្ធ', color: '#64748b', bg: '#f1f5f9' },
};

export default function NotificationsPage() {
    const [notifs, setNotifs]     = useState<Notification[]>(INITIAL_NOTIFS);
    const [category, setCategory] = useState<NotifCategory>('all');

    const unreadCount = notifs.filter(n => !n.read).length;

    const displayed = category === 'all' ? notifs : notifs.filter(n => n.category === category);

    const markRead = (id: number) =>
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const markAllRead = () => {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read.');
    };

    const deleteNotif = (id: number) => {
        setNotifs(prev => prev.filter(n => n.id !== id));
        toast.success('Notification removed.');
    };

    const CATEGORIES: { id: NotifCategory; label: string; icon: string }[] = [
        { id: 'all',        label: `All (${notifs.length})`,                                     icon: '🔔' },
        { id: 'attendance', label: `Attendance (${notifs.filter(n => n.category === 'attendance').length})`, icon: '📋' },
        { id: 'fees',       label: `Fees (${notifs.filter(n => n.category === 'fees').length})`,      icon: '💳' },
        { id: 'homework',   label: `Homework (${notifs.filter(n => n.category === 'homework').length})`, icon: '📝' },
        { id: 'system',     label: `System (${notifs.filter(n => n.category === 'system').length})`,   icon: '⚙️' },
    ];

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>🔔 Notifications</div>
                            {unreadCount > 0 && (
                                <span style={{ background: '#ef4444', color: 'white', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>ការជូនដំណឹង · School Notifications</KH>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            ✓ Mark All as Read
                        </button>
                    )}
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setCategory(c.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderColor: category === c.id ? '#3b82f6' : '#e2e8f0', background: category === c.id ? '#eff6ff' : 'white', color: category === c.id ? '#2563eb' : '#64748b' }}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>

                {/* Notifications list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {displayed.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                            <div style={{ fontWeight: 700 }}>No notifications</div>
                        </div>
                    )}
                    {displayed.map(n => {
                        const cat = CATEGORY_LABELS[n.category];
                        return (
                            <div key={n.id}
                                style={{ background: n.read ? 'white' : '#f8faff', border: `1px solid ${n.read ? '#e8edf5' : '#bfdbfe'}`, borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.15s' }}
                                onClick={() => markRead(n.id)}>
                                {/* Icon */}
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: n.priority === 'high' ? '#fff1f2' : cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                    {n.priority === 'high' ? '⚠️' : n.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <KH style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{n.titleKh}</KH>
                                        <span style={{ fontSize: 12, color: '#64748b' }}>— {n.title}</span>
                                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />}
                                        {n.priority === 'high' && <Badge type="red">Urgent</Badge>}
                                        <span style={{ fontSize: 11, background: cat.bg, color: cat.color, padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>
                                            <KH>{cat.kh}</KH>
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{n.body}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{n.time}</div>
                                </div>

                                {/* Delete */}
                                <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16, padding: '4px', flexShrink: 0, lineHeight: 1 }}
                                    title="Dismiss">✕</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminShell>
    );
}
