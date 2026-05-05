import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, CLASSES } from '@/pages/admin/data';
import { KH, Avatar, Badge } from '@/pages/admin/ui';

type AttStatus = 'present' | 'absent' | 'unmarked';

export default function AttendancePage() {
    const [selClass, setSelClass] = useState(0);
    const [statuses, setStatuses] = useState<Record<number, AttStatus>>({});
    const [saved, setSaved] = useState(false);

    const toggle = (id: number) => {
        setStatuses(p => ({
            ...p,
            [id]: p[id] === 'present' ? 'absent' : p[id] === 'absent' ? 'unmarked' : 'present',
        }));
    };

    const markAll = () => {
        const a: Record<number, AttStatus> = {};
        STUDENTS.forEach(s => { a[s.id] = 'present'; });
        setStatuses(a);
    };

    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

    const present = Object.values(statuses).filter(v => v === 'present').length;
    const absent  = Object.values(statuses).filter(v => v === 'absent').length;

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Header card */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                            <KH style={{ fontWeight: 800, fontSize: 16, display: 'block' }}>គ្រប់គ្រងវត្តមាន</KH>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Attendance · May 03, 2026</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {CLASSES.map((cls, i) => (
                                <button key={i} onClick={() => setSelClass(i)}
                                    style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: selClass === i ? '#3b82f6' : '#e2e8f0', background: selClass === i ? '#eff6ff' : 'white', color: selClass === i ? '#2563eb' : '#64748b' }}>
                                    {cls.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Present: {present}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Absent: {absent}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#e2e8f0' }} /><span style={{ fontSize: 13, color: '#94a3b8' }}>Unmarked: {STUDENTS.length - present - absent}</span></div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button onClick={markAll} style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Mark All Present</button>
                            <button onClick={save} style={{ background: saved ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                                {saved ? '✓ Saved!' : '💾 Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Student grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {STUDENTS.map(s => {
                        const st = statuses[s.id] ?? 'unmarked';
                        const bg = st === 'present' ? '#f0fdf4' : st === 'absent' ? '#fff1f2' : 'white';
                        const border = st === 'present' ? '#86efac' : st === 'absent' ? '#fca5a5' : '#e8edf5';
                        return (
                            <div key={s.id} onClick={() => toggle(s.id)}
                                style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: 14, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Avatar name={s.nameEn} size={40} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn} · {s.level}</div>
                                    {s.attendance < 70 && <Badge type="amber">⚠ Low</Badge>}
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: st === 'present' ? '#10b981' : st === 'absent' ? '#ef4444' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: st !== 'unmarked' ? 'white' : '#cbd5e1', transition: 'all 0.15s', flexShrink: 0 }}>
                                    {st === 'present' ? '✓' : st === 'absent' ? '✗' : '·'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminShell>
    );
}
