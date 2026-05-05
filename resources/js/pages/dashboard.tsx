import '@/pages/admin/admin.css';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, TEACHERS, CLASSES, PAYMENTS, avg } from '@/pages/admin/data';
import { KH, Avatar, PBar, Badge, FeeTag, ScoreChip } from '@/pages/admin/ui';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard() {
    const atRisk = STUDENTS.filter(s => s.attendance < 70 || s.fees === 'Unpaid');
    const totalRevenue = PAYMENTS.filter(p => p.status === 'verified').reduce((a, p) => a + p.amount, 0);

    return (
        <AdminShell>
            <Head title="Dashboard" />

            {/* admin-wrap activates scoped school styles without imposing the full-screen shell */}
            <div className="admin-wrap" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Stat cards */}
                    <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                        {[
                            { icon: '🎓', lk: 'សិស្សទាំងអស់', l: 'Total Students',  v: STUDENTS.length,    bg: '#eff6ff' },
                            { icon: '👩‍🏫', lk: 'គ្រូបង្រៀន',   l: 'Teachers',       v: TEACHERS.length,    bg: '#f5f3ff' },
                            { icon: '💰', lk: 'ចំណូលខែនេះ',  l: 'Monthly Revenue', v: `$${totalRevenue}`, bg: '#f0fdf4' },
                            { icon: '📋', lk: 'អត្រាវត្តមាន', l: 'Attendance Rate', v: '87%',              bg: '#fffbeb' },
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
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>At-risk — {atRisk.length} alerts</div>
                                </div>
                                <Link href="/admin/students" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {atRisk.map(s => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                                        <Avatar name={s.nameEn} size={36} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
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
                                <Link href="/admin/fee" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
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
                            <Link href="/admin/students" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>+ Add Student</Link>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Level</th><th>Attendance</th><th>Avg Score</th><th>Fee</th><th>Province</th></tr></thead>
                                <tbody>
                                    {STUDENTS.slice(0, 6).map(s => (
                                        <tr key={s.id}>
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
                            <Link href="/admin/classes" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
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
            </div>
        </AdminShell>
    );
}
