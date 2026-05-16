import { update } from '@/actions/App/Http/Controllers/Backends/SchoolSettingController';
import AdminShell from '@/pages/admin/shell';
import { KH } from '@/pages/admin/ui';
import { router } from '@inertiajs/react';
import { Bell, CalendarDays, CreditCard, School, Save } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { toast } from 'sonner';

type SettingsTab = 'school' | 'fees' | 'classes' | 'notifications';

interface SchoolSettings {
    nameKh: string;
    nameEn: string;
    address: string;
    phone: string;
    email: string;
    telegram: string;
    principal: string;
    founded: string;
}

interface LevelFeeSetting {
    level: string;
    fee: number;
}

interface FeeSettings {
    levelFees: LevelFeeSetting[];
    lateFee: string;
    dueDay: string;
}

interface ScheduleSetting {
    label: string;
    time: string;
    room: string;
    days: string;
}

interface ClassSettings {
    schedule: ScheduleSetting[];
}

interface NotificationSettings {
    attendanceAlert: boolean;
    lowAttendanceThreshold: string;
    feeReminder: boolean;
    feeReminderDays: string;
    homeworkDue: boolean;
    systemUpdates: boolean;
}

interface SettingsPageProps {
    settings: {
        school: SchoolSettings;
        fees: FeeSettings;
        classes: ClassSettings;
        notifications: NotificationSettings;
    };
}

const tabs: { id: SettingsTab; label: string; icon: ElementType }[] = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'fees', label: 'Fee Settings', icon: CreditCard },
    { id: 'classes', label: 'Class Schedule', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage({ settings }: SettingsPageProps) {
    const [tab, setTab] = useState<SettingsTab>('school');
    const [school, setSchool] = useState<SchoolSettings>(settings.school);
    const [fees, setFees] = useState<FeeSettings>(settings.fees);
    const [classes, setClasses] = useState<ClassSettings>(settings.classes);
    const [notifications, setNotifications] = useState<NotificationSettings>(settings.notifications);
    const [savingGroup, setSavingGroup] = useState<SettingsTab | null>(null);

    const saveGroup = (group: SettingsTab, value: object) => {
        setSavingGroup(group);
        router.put(update.url(group), { value: value as unknown as string }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved.'),
            onFinish: () => setSavingGroup(null),
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Settings</div>
                    <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>áž€áŸ†ážŽážáŸ‹ Â· System configuration</KH>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ width: 210, flexShrink: 0 }}>
                        <div className="card" style={{ padding: 8 }}>
                            {tabs.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.id} onClick={() => setTab(item.id)} style={tabButton(tab === item.id)}>
                                        <Icon size={17} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {tab === 'school' && (
                            <SettingsPanel title="School Information" onSave={() => saveGroup('school', school)} saving={savingGroup === 'school'}>
                                <div style={formGrid}>
                                    <Field label="Khmer Name">
                                        <input style={inputStyle} value={school.nameKh} onChange={event => setSchool(current => ({ ...current, nameKh: event.target.value }))} />
                                    </Field>
                                    <Field label="English Name">
                                        <input style={inputStyle} value={school.nameEn} onChange={event => setSchool(current => ({ ...current, nameEn: event.target.value }))} />
                                    </Field>
                                    <Field label="Address" wide>
                                        <input style={inputStyle} value={school.address} onChange={event => setSchool(current => ({ ...current, address: event.target.value }))} />
                                    </Field>
                                    <Field label="Phone">
                                        <input style={inputStyle} type="tel" value={school.phone} onChange={event => setSchool(current => ({ ...current, phone: event.target.value }))} />
                                    </Field>
                                    <Field label="Email">
                                        <input style={inputStyle} type="email" value={school.email} onChange={event => setSchool(current => ({ ...current, email: event.target.value }))} />
                                    </Field>
                                    <Field label="Telegram">
                                        <input style={inputStyle} value={school.telegram} onChange={event => setSchool(current => ({ ...current, telegram: event.target.value }))} />
                                    </Field>
                                    <Field label="Principal">
                                        <input style={inputStyle} value={school.principal} onChange={event => setSchool(current => ({ ...current, principal: event.target.value }))} />
                                    </Field>
                                    <Field label="Year Founded">
                                        <input style={inputStyle} value={school.founded} onChange={event => setSchool(current => ({ ...current, founded: event.target.value }))} />
                                    </Field>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'fees' && (
                            <SettingsPanel title="Fee Settings" onSave={() => saveGroup('fees', fees)} saving={savingGroup === 'fees'}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                                    {fees.levelFees.map((levelFee, index) => (
                                        <div key={`${levelFee.level}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                                            <div style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{levelFee.level}</div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b' }}>$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={levelFee.fee}
                                                onChange={event => setFees(current => ({
                                                    ...current,
                                                    levelFees: current.levelFees.map((item, itemIndex) => itemIndex === index ? { ...item, fee: Number(event.target.value) } : item),
                                                }))}
                                                style={{ ...inputStyle, width: 86, textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>/ month</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={formGrid}>
                                    <Field label="Late Fee">
                                        <input style={inputStyle} type="number" value={fees.lateFee} onChange={event => setFees(current => ({ ...current, lateFee: event.target.value }))} />
                                    </Field>
                                    <Field label="Fee Due Day">
                                        <input style={inputStyle} type="number" min="1" max="28" value={fees.dueDay} onChange={event => setFees(current => ({ ...current, dueDay: event.target.value }))} />
                                    </Field>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'classes' && (
                            <SettingsPanel title="Class Schedule" onSave={() => saveGroup('classes', classes)} saving={savingGroup === 'classes'}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {classes.schedule.map((item, index) => (
                                        <div key={`${item.label}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1fr) minmax(120px,1fr) 90px minmax(130px,1fr)', gap: 12, alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                                            <input style={inputStyle} value={item.label} onChange={event => setClasses(current => updateSchedule(current, index, 'label', event.target.value))} />
                                            <input style={inputStyle} value={item.time} onChange={event => setClasses(current => updateSchedule(current, index, 'time', event.target.value))} />
                                            <input style={inputStyle} value={item.room} onChange={event => setClasses(current => updateSchedule(current, index, 'room', event.target.value))} />
                                            <input style={inputStyle} value={item.days} onChange={event => setClasses(current => updateSchedule(current, index, 'days', event.target.value))} />
                                        </div>
                                    ))}
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'notifications' && (
                            <SettingsPanel title="Notification Settings" onSave={() => saveGroup('notifications', notifications)} saving={savingGroup === 'notifications'}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        { key: 'attendanceAlert' as const, labelKh: 'áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„ážœážáŸ’ážáž˜áž¶áž“', label: 'Low Attendance Alerts' },
                                        { key: 'feeReminder' as const, labelKh: 'ážšáŸ†áž›áž¹áž€áž€áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹', label: 'Fee Payment Reminders' },
                                        { key: 'homeworkDue' as const, labelKh: 'áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„áž€áž·áž…áŸ’áž…áž€áž¶ážš', label: 'Homework Due Alerts' },
                                        { key: 'systemUpdates' as const, labelKh: 'áž€áž¶ážšáž’áŸ’ážœáž¾áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áž—áž¶áž–', label: 'System Updates' },
                                    ].map(item => (
                                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 12, gap: 12 }}>
                                            <div>
                                                <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{item.labelKh}</KH>
                                                <div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div>
                                            </div>
                                            <button type="button" onClick={() => setNotifications(current => ({ ...current, [item.key]: !current[item.key] }))} style={toggleStyle(notifications[item.key])}>
                                                <span style={toggleKnobStyle(notifications[item.key])} />
                                            </button>
                                        </div>
                                    ))}

                                    {notifications.attendanceAlert && (
                                        <Field label="Low Attendance Threshold">
                                            <input style={{ ...inputStyle, maxWidth: 140 }} type="number" min="0" max="100" value={notifications.lowAttendanceThreshold} onChange={event => setNotifications(current => ({ ...current, lowAttendanceThreshold: event.target.value }))} />
                                        </Field>
                                    )}
                                    {notifications.feeReminder && (
                                        <Field label="Reminder Days Before Due">
                                            <input style={{ ...inputStyle, maxWidth: 140 }} type="number" min="1" max="30" value={notifications.feeReminderDays} onChange={event => setNotifications(current => ({ ...current, feeReminderDays: event.target.value }))} />
                                        </Field>
                                    )}
                                </div>
                            </SettingsPanel>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}

function SettingsPanel({ title, children, onSave, saving }: { title: string; children: ReactNode; onSave: () => void; saving: boolean }) {
    return (
        <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#1e293b' }}>{title}</div>
                <button disabled={saving} onClick={onSave} style={{ background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: saving ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Save size={15} />
                    {saving ? 'Saving' : 'Save'}
                </button>
            </div>
            {children}
        </div>
    );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
    return (
        <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

function updateSchedule(settings: ClassSettings, index: number, key: keyof ScheduleSetting, value: string): ClassSettings {
    return {
        schedule: settings.schedule.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    };
}

function tabButton(active: boolean): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 13,
        textAlign: 'left',
        background: active ? '#eff6ff' : 'transparent',
        color: active ? '#2563eb' : '#64748b',
        marginBottom: 2,
    };
}

function toggleStyle(active: boolean): CSSProperties {
    return {
        width: 44,
        height: 24,
        borderRadius: 99,
        border: 'none',
        cursor: 'pointer',
        background: active ? '#2563eb' : '#e2e8f0',
        position: 'relative',
        flexShrink: 0,
    };
}

function toggleKnobStyle(active: boolean): CSSProperties {
    return {
        position: 'absolute',
        top: 3,
        left: active ? 23 : 3,
        width: 18,
        height: 18,
        background: 'white',
        borderRadius: '50%',
        display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    };
}

const formGrid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 16,
};

const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 40,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};



