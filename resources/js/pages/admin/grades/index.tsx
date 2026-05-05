import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, CLASSES, type Grade } from '@/pages/admin/data';
import { KH, Avatar, ScoreChip } from '@/pages/admin/ui';

export default function GradesPage() {
    const [selClass, setSelClass] = useState('all');
    const [editing, setEditing] = useState<number | null>(null);
    const [grades, setGrades] = useState<Record<number, Grade>>(() => {
        const g: Record<number, Grade> = {};
        STUDENTS.forEach(s => { g[s.id] = { ...s.grade }; });
        return g;
    });

    const skills: (keyof Grade)[] = ['speaking', 'listening', 'reading', 'writing'];
    const skillKh: Record<keyof Grade, string> = { speaking: 'និយាយ', listening: 'ស្ដាប់', reading: 'អាន', writing: 'សរសេរ' };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Class filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ id: 'all', l: 'All Classes' }, ...CLASSES.map(c => ({ id: c.name, l: c.name }))].map(f => (
                        <button key={f.id} onClick={() => setSelClass(f.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: selClass === f.id ? '#3b82f6' : '#e2e8f0', background: selClass === f.id ? '#eff6ff' : 'white', color: selClass === f.id ? '#2563eb' : '#64748b' }}>
                            {f.l}
                        </button>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th>Student</th>
                            {skills.map(sk => (
                                <th key={sk}>
                                    <KH>{skillKh[sk]}</KH>
                                    <div style={{ fontSize: 9, fontWeight: 400, color: '#94a3b8', textTransform: 'capitalize' }}>{sk}</div>
                                </th>
                            ))}
                            <th>Average</th>
                            <th>Action</th>
                        </tr></thead>
                        <tbody>
                            {STUDENTS.filter(s => selClass === 'all' || s.cls === selClass).map(s => {
                                const g = grades[s.id];
                                const a = Math.round(Object.values(g).reduce((x, y) => x + y, 0) / 4);
                                const isEd = editing === s.id;
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={s.nameEn} size={30} />
                                                <div>
                                                    <KH style={{ fontWeight: 700, fontSize: 12, display: 'block' }}>{s.nameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.level}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {skills.map(sk => (
                                            <td key={sk}>
                                                {isEd
                                                    ? <input type="number" min={0} max={100} value={g[sk]}
                                                        onChange={e => setGrades(p => ({ ...p, [s.id]: { ...p[s.id], [sk]: Number(e.target.value) } }))}
                                                        style={{ width: 60, textAlign: 'center', border: '1.5px solid #3b82f6', borderRadius: 6, padding: '4px', fontSize: 13, fontWeight: 700, color: '#2563eb', outline: 'none', background: '#eff6ff' }} />
                                                    : <ScoreChip score={g[sk]} />
                                                }
                                            </td>
                                        ))}
                                        <td><span style={{ fontWeight: 800, fontSize: 14, color: a >= 75 ? '#10b981' : a >= 50 ? '#3b82f6' : '#f59e0b' }}>{a}</span></td>
                                        <td>
                                            <button onClick={() => setEditing(isEd ? null : s.id)}
                                                style={{ background: isEd ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isEd ? '#86efac' : '#e2e8f0'}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: isEd ? '#16a34a' : '#64748b' }}>
                                                {isEd ? '✓ Save' : '✏️ Edit'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminShell>
    );
}
