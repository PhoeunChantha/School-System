import type { Screen } from '../data';
import { TEACHERS, CLASSES } from '../data';
import { KH, Avatar, Badge } from '../ui';

// ── Teachers Screen ──
export function TeachersScreen() {
    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Teacher</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {TEACHERS.map(t => (
                    <div key={t.id} className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                            <Avatar name={t.nameEn} size={56} />
                            <div>
                                <KH style={{ fontWeight: 800, fontSize: 16, display: 'block' }}>{t.nameKh}</KH>
                                <div style={{ fontSize: 13, color: '#64748b' }}>{t.nameEn}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.subject}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            {[{ l: 'Classes', v: t.classes, c: '#3b82f6' }, { l: 'Students', v: t.students, c: '#8b5cf6' }].map(s => (
                                <div key={s.l} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, marginBottom: 12 }}>
                            <span>📞</span><span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.phone}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Schedule</button>
                            <button style={{ flex: 1, background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Edit</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Classes Screen ──
interface ClassesProps { go: (s: Screen) => void; }
export function ClassesScreen({ go }: ClassesProps) {
    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Class</button>
            </div>
            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>Class / ថ្នាក់</th><th>Teacher</th><th>Room</th><th>Schedule</th><th>Days</th><th>Students</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {CLASSES.map(cls => (
                            <tr key={cls.id}>
                                <td><span style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</span></td>
                                <td style={{ fontSize: 13, color: '#64748b' }}>{cls.teacher}</td>
                                <td><Badge type="blue">{cls.room}</Badge></td>
                                <td style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>🕐 {cls.time}</td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{cls.days}</td>
                                <td><span style={{ fontWeight: 700 }}>{cls.count}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => go('attendance')} style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Attendance</button>
                                        <button style={{ background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Edit</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
