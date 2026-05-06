import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { KH } from '@/pages/admin/ui';
import { toast } from 'sonner';

type SettingsTab = 'school' | 'fees' | 'classes' | 'notifications';

const LEVEL_FEES = [
    { level: 'Beginner 1',     fee: 20 },
    { level: 'Beginner 2',     fee: 20 },
    { level: 'Intermediate 1', fee: 25 },
    { level: 'Intermediate 2', fee: 25 },
    { level: 'Advanced 1',     fee: 30 },
    { level: 'Advanced 2',     fee: 30 },
];

export default function SettingsPage() {
    const [tab, setTab] = useState<SettingsTab>('school');

    // School info state
    const [school, setSchool] = useState({
        nameKh: 'សាលា Frania',
        nameEn: 'Frania English School',
        address: 'Phnom Penh, Cambodia',
        phone: '023-123-456',
        email: 'info@frania.edu.kh',
        telegram: '@frania_school',
        principal: 'Mr. Vuthy',
        founded: '2018',
    });

    // Fee settings state
    const [levelFees, setLevelFees] = useState(LEVEL_FEES);
    const [lateFee, setLateFee]     = useState('5');
    const [dueDay, setDueDay]       = useState('5');

    // Notification toggles
    const [notifSettings, setNotifSettings] = useState({
        attendanceAlert: true,
        lowAttendanceThreshold: '70',
        feeReminder: true,
        feeReminderDays: '3',
        homeworkDue: true,
        systemUpdates: true,
    });

    const handleSave = (section: string) => {
        toast.success(`${section} settings saved!`);
    };

    const TABS: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'school',        label: 'School Info',      icon: '🏫' },
        { id: 'fees',          label: 'Fee Settings',     icon: '💳' },
        { id: 'classes',       label: 'Class Schedule',   icon: '📅' },
        { id: 'notifications', label: 'Notifications',    icon: '🔔' },
    ];

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>⚙️ Settings</div>
                    <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>កំណត់ · System Configuration</KH>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* Left nav */}
                    <div style={{ width: 200, flexShrink: 0 }}>
                        <div className="card" style={{ padding: 8 }}>
                            {TABS.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, textAlign: 'left', background: tab === t.id ? '#eff6ff' : 'none', color: tab === t.id ? '#2563eb' : '#64748b', transition: 'all 0.15s', marginBottom: 2 }}>
                                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content panel */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                        {/* School Info */}
                        {tab === 'school' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: '#1e293b' }}>🏫 School Information</div>

                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                                    <div style={{ width: 100, height: 100, borderRadius: 20, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏫</div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="f-group">
                                        <label className="f-label">ឈ្មោះសាលា (ខ្មែរ) / Khmer Name</label>
                                        <input className="f-input" value={school.nameKh} onChange={e => setSchool(p => ({ ...p, nameKh: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">School Name (English)</label>
                                        <input className="f-input" value={school.nameEn} onChange={e => setSchool(p => ({ ...p, nameEn: e.target.value }))} />
                                    </div>
                                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                                        <label className="f-label">Address / អាសយដ្ឋាន</label>
                                        <input className="f-input" value={school.address} onChange={e => setSchool(p => ({ ...p, address: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Phone / ទូរស័ព្ទ</label>
                                        <input className="f-input" type="tel" value={school.phone} onChange={e => setSchool(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Email</label>
                                        <input className="f-input" type="email" value={school.email} onChange={e => setSchool(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Telegram</label>
                                        <input className="f-input" value={school.telegram} onChange={e => setSchool(p => ({ ...p, telegram: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Principal / នាយកសាលា</label>
                                        <input className="f-input" value={school.principal} onChange={e => setSchool(p => ({ ...p, principal: e.target.value }))} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Year Founded</label>
                                        <input className="f-input" value={school.founded} onChange={e => setSchool(p => ({ ...p, founded: e.target.value }))} />
                                    </div>
                                </div>
                                <button onClick={() => handleSave('School info')}
                                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                                    ✓ Save Changes
                                </button>
                            </div>
                        )}

                        {/* Fee Settings */}
                        {tab === 'fees' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: '#1e293b' }}>💳 Fee Settings</div>

                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#64748b', marginBottom: 12 }}>Monthly Fee by Level</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {levelFees.map((lf, i) => (
                                            <div key={lf.level} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                                                <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{lf.level}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>$</span>
                                                    <input type="number" min="0" value={lf.fee}
                                                        onChange={e => setLevelFees(prev => prev.map((x, j) => j === i ? { ...x, fee: Number(e.target.value) } : x))}
                                                        style={{ width: 70, textAlign: 'center', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 14, fontWeight: 700, outline: 'none', background: 'white' }} />
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>/ month</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    <div className="f-group">
                                        <label className="f-label">Late Fee ($)</label>
                                        <input className="f-input" type="number" value={lateFee} onChange={e => setLateFee(e.target.value)} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Fee Due Day (of month)</label>
                                        <input className="f-input" type="number" min="1" max="28" value={dueDay} onChange={e => setDueDay(e.target.value)} />
                                    </div>
                                </div>

                                <button onClick={() => handleSave('Fee')}
                                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                    ✓ Save Fee Settings
                                </button>
                            </div>
                        )}

                        {/* Class Schedule */}
                        {tab === 'classes' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: '#1e293b' }}>📅 Class Schedule</div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        { label: 'Beginner 1',     time: '07:30–09:00', room: 'A1', days: 'Mon Wed Fri' },
                                        { label: 'Beginner 2',     time: '09:15–10:45', room: 'A2', days: 'Mon Wed Fri' },
                                        { label: 'Intermediate 1', time: '14:00–15:30', room: 'B1', days: 'Tue Thu Sat' },
                                        { label: 'Intermediate 2', time: '15:45–17:15', room: 'B2', days: 'Tue Thu Sat' },
                                        { label: 'Advanced 1',     time: '07:30–09:00', room: 'C1', days: 'Mon Wed Fri' },
                                    ].map(cls => (
                                        <div key={cls.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px 1fr', gap: 12, alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{cls.label}</div>
                                            <input className="f-input" defaultValue={cls.time} style={{ margin: 0 }} />
                                            <input className="f-input" defaultValue={cls.room} style={{ margin: 0 }} placeholder="Room" />
                                            <input className="f-input" defaultValue={cls.days} style={{ margin: 0 }} />
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => handleSave('Schedule')}
                                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
                                    ✓ Save Schedule
                                </button>
                            </div>
                        )}

                        {/* Notification settings */}
                        {tab === 'notifications' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: '#1e293b' }}>🔔 Notification Settings</div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Toggle row helper */}
                                    {[
                                        { key: 'attendanceAlert' as const, icon: '📋', labelKh: 'ការជូនដំណឹងវត្តមាន', label: 'Low Attendance Alerts' },
                                        { key: 'feeReminder'     as const, icon: '💳', labelKh: 'រំឭកការទូទាត់',      label: 'Fee Payment Reminders' },
                                        { key: 'homeworkDue'     as const, icon: '📝', labelKh: 'ការជូនដំណឹងកិច្ចការ', label: 'Homework Due Alerts' },
                                        { key: 'systemUpdates'   as const, icon: '⚙️', labelKh: 'ការធ្វើបច្ចុប្បន្នភាព', label: 'System Updates' },
                                    ].map(({ key, icon, labelKh, label }) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 20 }}>{icon}</span>
                                                <div>
                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{labelKh}</KH>
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => setNotifSettings(p => ({ ...p, [key]: !p[key] }))}
                                                style={{ width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'background 0.2s', background: notifSettings[key] ? '#2563eb' : '#e2e8f0', position: 'relative', flexShrink: 0 }}>
                                                <span style={{ position: 'absolute', top: 3, transition: 'left 0.2s', left: notifSettings[key] ? 23 : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                            </button>
                                        </div>
                                    ))}

                                    {notifSettings.attendanceAlert && (
                                        <div className="f-group">
                                            <label className="f-label">Low Attendance Threshold (%)</label>
                                            <input className="f-input" type="number" min="0" max="100" value={notifSettings.lowAttendanceThreshold}
                                                onChange={e => setNotifSettings(p => ({ ...p, lowAttendanceThreshold: e.target.value }))} style={{ maxWidth: 120 }} />
                                        </div>
                                    )}
                                    {notifSettings.feeReminder && (
                                        <div className="f-group">
                                            <label className="f-label">Remind X days before due date</label>
                                            <input className="f-input" type="number" min="1" max="30" value={notifSettings.feeReminderDays}
                                                onChange={e => setNotifSettings(p => ({ ...p, feeReminderDays: e.target.value }))} style={{ maxWidth: 120 }} />
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => handleSave('Notification')}
                                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                                    ✓ Save Notification Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
