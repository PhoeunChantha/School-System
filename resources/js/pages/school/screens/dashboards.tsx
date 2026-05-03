import type { Screen } from '../data';
import { STUDENTS, TEACHERS, CLASSES, PAYMENTS, HOMEWORK, avg } from '../data';
import { KH, Avatar, PBar, Badge, FeeTag, ScoreChip } from '../ui';

interface GoProps { go: (s: Screen) => void; }

// ── Admin Dashboard ──
export function AdminDashboard({ go }: GoProps) {
    const atRisk = STUDENTS.filter(s => s.attendance < 70 || s.fees === 'Unpaid');
    const totalRevenue = PAYMENTS.filter(p => p.status === 'verified').reduce((a, p) => a + p.amount, 0);

    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stat cards */}
            <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                    { icon: '🎓', lk: 'សិស្សទាំងអស់', l: 'Total Students',  v: STUDENTS.length,    sub: 'Active enrolled', color: '#3b82f6', bg: '#eff6ff' },
                    { icon: '👩‍🏫', lk: 'គ្រូបង្រៀន',   l: 'Teachers',       v: TEACHERS.length,    sub: 'All subjects',    color: '#8b5cf6', bg: '#f5f3ff' },
                    { icon: '💰', lk: 'ចំណូលខែនេះ',  l: 'Monthly Revenue', v: `$${totalRevenue}`, sub: 'May 2026',        color: '#10b981', bg: '#f0fdf4' },
                    { icon: '📋', lk: 'អត្រាវត្តមាន', l: 'Attendance Rate', v: '87%',              sub: 'School average',  color: '#f59e0b', bg: '#fffbeb' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: 99 }}>↑ 5%</span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{s.v}</div>
                        <KH style={{ fontSize: 12, color: '#64748b', display: 'block', lineHeight: 1.3 }}>{s.lk}</KH>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* At-risk students */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>⚠️</span>
                                <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>សិស្សត្រូវការជំនួយ</KH>
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>At-risk students — {atRisk.length} alerts</div>
                        </div>
                        <button onClick={() => go('students')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {atRisk.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                                <Avatar name={s.nameEn} size={36} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <KH style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.level}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {s.attendance < 70 && <Badge type="red">📋 {s.attendance}%</Badge>}
                                    {s.fees === 'Unpaid' && <Badge type="amber">💳 Unpaid</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent payments */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>ការទូទាត់ថ្មីៗ</KH>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Recent Payments</div>
                        </div>
                        <button onClick={() => go('fees')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                    </div>
                    <table className="data-table">
                        <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                        <tbody>
                            {PAYMENTS.slice(0, 4).map(p => (
                                <tr key={p.id}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={p.nameEn} size={28} /><div><KH style={{ fontWeight: 700, fontSize: 12, display: 'block' }}>{p.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{p.date}</div></div></div></td>
                                    <td><span style={{ fontWeight: 700 }}>${p.amount}</span></td>
                                    <td><Badge type="blue">{p.method}</Badge></td>
                                    <td><Badge type={p.status === 'verified' ? 'green' : p.status === 'pending' ? 'amber' : 'blue'}>{p.status === 'verified' ? '✓ Verified' : p.status === 'pending' ? '⏳ Pending' : '~ Partial'}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Students overview */}
            <div className="card">
                <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                        <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>សិស្សថ្មីៗ</KH>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Recent Students</div>
                    </div>
                    <button onClick={() => go('students')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8 }}>+ Add Student</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Student / សិស្ស</th><th>Level</th><th>Attendance</th><th>Avg Score</th><th>Fee</th><th>Province</th></tr></thead>
                        <tbody>
                            {STUDENTS.slice(0, 6).map(s => (
                                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => go('students')}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nameEn} size={32} /><div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div></div></td>
                                    <td><Badge type="blue">{s.level}</Badge></td>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, minWidth: 80 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} /></div><span style={{ fontSize: 12, fontWeight: 700, color: s.attendance >= 80 ? '#10b981' : '#ef4444', width: 36 }}>{s.attendance}%</span></div></td>
                                    <td><ScoreChip score={avg(s)} /></td>
                                    <td><FeeTag status={s.fees} /></td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{s.province}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Classes overview */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div><KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>ថ្នាក់ទាំងអស់</KH><div style={{ fontSize: 12, color: '#94a3b8' }}>All Classes</div></div>
                    <button onClick={() => go('classes')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                    {CLASSES.map(cls => (
                        <div key={cls.id} style={{ background: '#f8fafc', borderRadius: 12, padding: 14, border: '1px solid #e8edf5' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{cls.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{cls.teacher}</div>
                            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>🕐 {cls.time}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Badge type="gray">Room {cls.room}</Badge>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{cls.count} 👤</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Teacher Dashboard ──
export function TeacherDashboard({ go }: GoProps) {
    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
                {[
                    { icon: '🏫', lk: 'ថ្នាក់',   l: 'My Classes', v: 3,   c: '#3b82f6', bg: '#eff6ff' },
                    { icon: '👥', lk: 'សិស្ស',    l: 'Students',   v: 55,  c: '#8b5cf6', bg: '#f5f3ff' },
                    { icon: '📝', lk: 'កិច្ចការ',  l: 'HW Due',     v: 2,   c: '#f59e0b', bg: '#fffbeb' },
                    { icon: '📋', lk: 'វត្តមាន',  l: 'Today',      v: '—', c: '#10b981', bg: '#f0fdf4' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{s.v}</div>
                        <KH style={{ fontSize: 11, color: '#64748b', display: 'block' }}>{s.lk}</KH>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                    <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 14 }}>ម៉ោងរៀនថ្ងៃនេះ</KH>
                    {[
                        { t: '07:30–09:00', c: 'Beginner 1',     r: 'A1', n: 18, s: 'now' },
                        { t: '09:15–10:45', c: 'Intermediate 2', r: 'B2', n: 22, s: 'next' },
                        { t: '14:00–15:30', c: 'Advanced 1',     r: 'C1', n: 15, s: 'later' },
                    ].map((cls, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none', alignItems: 'center' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: cls.s === 'now' ? '#f0fdf4' : cls.s === 'next' ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: cls.s === 'now' ? '#10b981' : cls.s === 'next' ? '#3b82f6' : '#94a3b8' }}>{cls.t.split('–')[0]}</div>
                            </div>
                            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{cls.c}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Room {cls.r} · {cls.n} students</div></div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Badge type={cls.s === 'now' ? 'green' : cls.s === 'next' ? 'blue' : 'gray'}>{cls.s === 'now' ? '● Now' : cls.s === 'next' ? 'Next' : 'Later'}</Badge>
                                {cls.s === 'now' && <button onClick={() => go('attendance')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Attendance</button>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                        <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>កិច្ចការផ្ទះ</KH>
                        <button onClick={() => go('homework')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
                    </div>
                    {HOMEWORK.map(hw => (
                        <div key={hw.id} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div><KH style={{ fontWeight: 700, fontSize: 13 }}>{hw.titleKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{hw.cls} · Due {hw.due}</div></div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{hw.done}/{hw.total}</span>
                            </div>
                            <PBar value={hw.done} max={hw.total} color="blue" height={6} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <KH style={{ fontWeight: 800, fontSize: 15 }}>ការសម្តែងសិស្ស</KH>
                    <button onClick={() => go('students')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>All →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Student</th><th>Level</th><th>Attendance</th><th>Speaking</th><th>Listening</th><th>Reading</th><th>Writing</th><th>Avg</th></tr></thead>
                        <tbody>
                            {STUDENTS.slice(0, 5).map(s => (
                                <tr key={s.id}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={s.nameEn} size={28} /><KH style={{ fontWeight: 700, fontSize: 12 }}>{s.nameKh}</KH></div></td>
                                    <td><Badge type="blue">{s.level}</Badge></td>
                                    <td><span style={{ fontWeight: 700, color: s.attendance >= 80 ? '#10b981' : '#ef4444' }}>{s.attendance}%</span></td>
                                    <td><ScoreChip score={s.grade.speaking} /></td>
                                    <td><ScoreChip score={s.grade.listening} /></td>
                                    <td><ScoreChip score={s.grade.reading} /></td>
                                    <td><ScoreChip score={s.grade.writing} /></td>
                                    <td><span style={{ fontWeight: 800 }}>{avg(s)}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── Student Dashboard ──
export function StudentDashboard({ go }: GoProps) {
    const s = STUDENTS[0];
    const a = avg(s);
    const skills = [
        { sk: 'Speaking',  skKh: 'និយាយ', v: s.grade.speaking },
        { sk: 'Listening', skKh: 'ស្ដាប់', v: s.grade.listening },
        { sk: 'Reading',   skKh: 'អាន',   v: s.grade.reading },
        { sk: 'Writing',   skKh: 'សរសេរ', v: s.grade.writing },
    ];

    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 20, padding: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
                    <Avatar name={s.nameEn} size={72} />
                    <div style={{ flex: 1 }}>
                        <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 2 }}>{s.nameKh}</KH>
                        <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{s.nameEn}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{s.level}</span>
                            <span style={{ background: s.fees === 'Paid' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: s.fees === 'Paid' ? '#6ee7b7' : '#fca5a5' }}>{s.fees}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 40, fontWeight: 800 }}>{a}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Avg Score</div>
                    </div>
                </div>
                <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,0.7)' }}>
                        <span>Level Progress: Intermediate 2 → Advanced 1</span><span>68%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 8 }}>
                        <div style={{ background: 'white', borderRadius: 99, height: 8, width: '68%', transition: 'width 0.5s' }} />
                    </div>
                </div>
            </div>

            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div><KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>ពិន្ទុជំនាញ</KH><div style={{ fontSize: 12, color: '#94a3b8' }}>Skill Grades</div></div>
                        <button onClick={() => go('grades')} style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Detail →</button>
                    </div>
                    {skills.map(sk => (
                        <div key={sk.sk} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <div><KH style={{ fontWeight: 700, fontSize: 13 }}>{sk.skKh}</KH><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({sk.sk})</span></div>
                                <ScoreChip score={sk.v} />
                            </div>
                            <PBar value={sk.v} color={sk.v >= 75 ? 'green' : sk.v >= 50 ? 'blue' : 'amber'} height={7} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: s.attendance >= 80 ? '#10b981' : '#ef4444' }}>{s.attendance}%</div>
                            <KH style={{ fontSize: 11, color: '#64748b', display: 'block' }}>វត្តមាន</KH>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Attendance</div>
                            <div style={{ marginTop: 8 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} height={5} /></div>
                        </div>
                        <div className="stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>2</div>
                            <KH style={{ fontSize: 11, color: '#64748b', display: 'block' }}>ការងារ</KH>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>HW Due</div>
                        </div>
                    </div>
                    <div style={{ background: s.fees === 'Paid' ? '#f0fdf4' : '#fff1f2', border: `1px solid ${s.fees === 'Paid' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 16, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>💳</span>
                            <div style={{ flex: 1 }}>
                                <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', color: s.fees === 'Paid' ? '#14532d' : '#991b1b' }}>{s.fees === 'Paid' ? 'ថ្លៃសិក្សាបានបង់' : 'ថ្លៃសិក្សាមិនទាន់បង់'}</KH>
                                <div style={{ fontSize: 12, color: s.fees === 'Paid' ? '#16a34a' : '#ef4444' }}>May 2026 · ${s.amt}</div>
                            </div>
                            <FeeTag status={s.fees} />
                        </div>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                        <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 10 }}>កិច្ចការ</KH>
                        {HOMEWORK.slice(0, 2).map(hw => (
                            <div key={hw.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}><KH style={{ fontWeight: 700, fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hw.titleKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>Due {hw.due}</div></div>
                                <Badge type="amber">Pending</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Parent Dashboard ──
export function ParentDashboard({ go: _go }: GoProps) {
    const child = STUDENTS[0];
    const a = avg(child);
    const skills = [
        { sk: 'Speaking',  skKh: 'និយាយ', v: child.grade.speaking },
        { sk: 'Listening', skKh: 'ស្ដាប់', v: child.grade.listening },
        { sk: 'Reading',   skKh: 'អាន',   v: child.grade.reading },
        { sk: 'Writing',   skKh: 'សរសេរ', v: child.grade.writing },
    ];

    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 20, padding: 24, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 16px' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Your Child / កូនរបស់អ្នក</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={child.nameEn} size={46} /><div><KH style={{ fontWeight: 800, fontSize: 18, display: 'block' }}>{child.nameKh}</KH><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{child.nameEn} · {child.level}</div></div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[
                            { l: 'Attendance', v: `${child.attendance}%`, c: child.attendance >= 80 ? '#6ee7b7' : '#fca5a5' },
                            { l: 'Avg Score',  v: a,                       c: 'white' },
                            { l: 'Fee Status', v: child.fees,              c: child.fees === 'Paid' ? '#6ee7b7' : '#fca5a5' },
                        ].map((st, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 26, fontWeight: 800, color: st.c }}>{st.v}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{st.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                    <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 14 }}>ពិន្ទុជំនាញ</KH>
                    {skills.map(sk => (
                        <div key={sk.sk} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 60, flexShrink: 0 }}><KH style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{sk.skKh}</KH></div>
                            <div style={{ flex: 1 }}><PBar value={sk.v} color={sk.v >= 75 ? 'green' : sk.v >= 50 ? 'blue' : 'amber'} height={7} /></div>
                            <ScoreChip score={sk.v} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: child.fees === 'Paid' ? '#f0fdf4' : '#fff1f2', border: `1px solid ${child.fees === 'Paid' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 16, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <KH style={{ fontWeight: 700, fontSize: 14, color: child.fees === 'Paid' ? '#14532d' : '#991b1b' }}>{child.fees === 'Paid' ? 'ថ្លៃបានបង់' : 'ថ្លៃមិនទាន់បង់'}</KH>
                            <FeeTag status={child.fees} />
                        </div>
                        <div style={{ fontSize: 13, color: child.fees === 'Paid' ? '#16a34a' : '#ef4444' }}>${child.amt} · May 2026</div>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 18, marginRight: 8 }}>📋</span><KH style={{ fontWeight: 700, fontSize: 13 }}>វត្តមាន / Attendance</KH></div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: child.attendance >= 80 ? '#10b981' : '#ef4444', marginBottom: 8 }}>{child.attendance}%</div>
                        <PBar value={child.attendance} color={child.attendance >= 80 ? 'green' : 'red'} height={8} />
                    </div>
                    <button style={{ background: '#0891b2', color: 'white', border: 'none', borderRadius: 14, padding: '14px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                        <span style={{ fontSize: 20 }}>✉️</span>
                        <div style={{ textAlign: 'left' }}><KH style={{ display: 'block', fontWeight: 700 }}>ទំនាក់ទំនងគ្រូ</KH><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Contact via Telegram</div></div>
                    </button>
                </div>
            </div>
        </div>
    );
}
