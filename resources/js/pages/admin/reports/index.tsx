import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, TEACHERS, CLASSES, PAYMENTS, HOMEWORK, avg } from '@/pages/admin/data';
import { KH, Avatar, PBar, Badge, ScoreChip } from '@/pages/admin/ui';
import type { LucideIcon } from 'lucide-react';
import { ChartNoAxesColumn, CheckCircle2, ClipboardCheck, CreditCard, DollarSign, Download, GraduationCap, Hourglass, Printer, Star, TriangleAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type ReportTab = 'attendance' | 'grades' | 'fees';

function badgeIcon(Icon: LucideIcon, label: string) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon size={12} strokeWidth={2.6} />{label}</span>;
}

export default function ReportsPage() {
    const [tab, setTab] = useState<ReportTab>('attendance');

    const totalRevenue   = PAYMENTS.filter(p => p.status === 'verified').reduce((a, p) => a + p.amount, 0);
    const avgAttendance  = Math.round(STUDENTS.reduce((a, s) => a + s.attendance, 0) / STUDENTS.length);
    const avgGrade       = Math.round(STUDENTS.reduce((a, s) => a + avg(s), 0) / STUDENTS.length);
    const paidCount      = STUDENTS.filter(s => s.fees === 'Paid').length;
    const unpaidCount    = STUDENTS.filter(s => s.fees === 'Unpaid').length;

    const handleExport = (type: string) =>
        toast.success(`Exporting ${type} report…`, { description: 'CSV download will start shortly.' });
    const handlePrint = () => window.print();

    const TABS: { id: ReportTab; label: string; icon: LucideIcon }[] = [
        { id: 'attendance', label: 'Attendance',  icon: ClipboardCheck },
        { id: 'grades',     label: 'Grades',      icon: Star },
        { id: 'fees',       label: 'Fee Summary', icon: CreditCard },
    ];

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ChartNoAxesColumn size={20} color="#2563eb" />
                            Reports
                        </div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>រាយការណ៍សាលា · May 2026</KH>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleExport(tab)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Download size={14} /> Export CSV
                        </button>
                        <button onClick={handlePrint} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Printer size={14} /> Print
                        </button>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                    {[
                        { icon: GraduationCap, lk: 'សិស្សទាំងអស់', l: 'Total Students',    v: STUDENTS.length,    bg: '#eff6ff', c: '#2563eb' },
                        { icon: ClipboardCheck, lk: 'វត្តមានមធ្យម',  l: 'Avg Attendance',   v: `${avgAttendance}%`, bg: '#f0fdf4', c: '#16a34a' },
                        { icon: Star, lk: 'ពិន្ទុមធ្យម',   l: 'Avg Grade',        v: avgGrade,            bg: '#fffbeb', c: '#d97706' },
                        { icon: DollarSign, lk: 'ចំណូលខែនេះ',   l: 'Fees Collected',   v: `$${totalRevenue}`,  bg: '#f5f3ff', c: '#7c3aed' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                <s.icon size={20} strokeWidth={2.4} />
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: s.c, marginBottom: 2 }}>{s.v}</div>
                            <KH style={{ fontSize: 11, color: '#64748b', display: 'block' }}>{s.lk}</KH>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {TABS.map(t => {
                        const Icon = t.icon;

                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', borderColor: tab === t.id ? '#3b82f6' : '#e2e8f0', background: tab === t.id ? '#eff6ff' : 'white', color: tab === t.id ? '#2563eb' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Icon size={14} /> {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Attendance report */}
                {tab === 'attendance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Class attendance summary */}
                        <div className="card" style={{ padding: 20 }}>
                            <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 14 }}>វត្តមានតាមថ្នាក់</KH>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {CLASSES.map(cls => {
                                    const clsStudents = STUDENTS.filter(s => s.cls === cls.name);
                                    const rate = clsStudents.length
                                        ? Math.round(clsStudents.reduce((a, s) => a + s.attendance, 0) / clsStudents.length)
                                        : 0;
                                    return (
                                        <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 140, flexShrink: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{cls.name}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{cls.teacher}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <PBar value={rate} color={rate >= 80 ? 'green' : rate >= 60 ? 'amber' : 'red'} height={10} />
                                            </div>
                                            <div style={{ width: 60, textAlign: 'right', fontWeight: 800, fontSize: 14, color: rate >= 80 ? '#10b981' : rate >= 60 ? '#d97706' : '#ef4444', flexShrink: 0 }}>
                                                {rate}%
                                            </div>
                                            <Badge type={rate >= 80 ? 'green' : rate >= 60 ? 'amber' : 'red'}>
                                                {clsStudents.length} students
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Student attendance table */}
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div style={{ padding: '16px 20px 0' }}>
                                <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 4 }}>វត្តមានតាមសិស្ស</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Individual attendance — May 2026</div>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Status</th></tr></thead>
                                <tbody>
                                    {[...STUDENTS].sort((a, b) => a.attendance - b.attendance).map(s => (
                                        <tr key={s.id}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={s.nameEn} size={32} />
                                                <div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div>
                                            </div></td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{s.cls}</td>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                                                <div style={{ flex: 1 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} /></div>
                                                <span style={{ fontSize: 12, fontWeight: 700, width: 36, color: s.attendance >= 80 ? '#10b981' : '#ef4444' }}>{s.attendance}%</span>
                                            </div></td>
                                            <td><Badge type={s.attendance >= 80 ? 'green' : s.attendance >= 60 ? 'amber' : 'red'}>
                                                {s.attendance >= 80 ? badgeIcon(CheckCircle2, 'Good') : s.attendance >= 60 ? badgeIcon(TriangleAlert, 'Warning') : badgeIcon(TriangleAlert, 'At Risk')}
                                            </Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Grades report */}
                {tab === 'grades' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Skill averages */}
                        <div className="card" style={{ padding: 20 }}>
                            <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 16 }}>ពិន្ទុជំនាញមធ្យម</KH>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                                {(['speaking', 'listening', 'reading', 'writing'] as const).map(sk => {
                                    const skKh = { speaking: 'និយាយ', listening: 'ស្ដាប់', reading: 'អាន', writing: 'សរសេរ' }[sk];
                                    const skAvg = Math.round(STUDENTS.reduce((a, s) => a + s.grade[sk], 0) / STUDENTS.length);
                                    return (
                                        <div key={sk} style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <KH style={{ fontWeight: 700, fontSize: 14 }}>{skKh}</KH>
                                                <ScoreChip score={skAvg} />
                                            </div>
                                            <PBar value={skAvg} color={skAvg >= 75 ? 'green' : skAvg >= 50 ? 'blue' : 'amber'} height={8} />
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textTransform: 'capitalize' }}>{sk}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Full grades table */}
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div style={{ padding: '16px 20px 0', marginBottom: 4 }}>
                                <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>ពិន្ទុសិស្សទាំងអស់</KH>
                            </div>
                            <table className="data-table">
                                <thead><tr>
                                    <th>Student</th><th>Level</th>
                                    <th><KH>និយាយ</KH></th><th><KH>ស្ដាប់</KH></th><th><KH>អាន</KH></th><th><KH>សរសេរ</KH></th>
                                    <th>Average</th>
                                </tr></thead>
                                <tbody>
                                    {[...STUDENTS].sort((a, b) => avg(b) - avg(a)).map(s => (
                                        <tr key={s.id}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={s.nameEn} size={30} />
                                                <div><KH style={{ fontWeight: 700, fontSize: 12, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div>
                                            </div></td>
                                            <td><Badge type="blue">{s.level}</Badge></td>
                                            <td><ScoreChip score={s.grade.speaking} /></td>
                                            <td><ScoreChip score={s.grade.listening} /></td>
                                            <td><ScoreChip score={s.grade.reading} /></td>
                                            <td><ScoreChip score={s.grade.writing} /></td>
                                            <td><span style={{ fontWeight: 800, fontSize: 15, color: avg(s) >= 75 ? '#10b981' : avg(s) >= 50 ? '#3b82f6' : '#f59e0b' }}>{avg(s)}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Fee summary report */}
                {tab === 'fees' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Collection summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                            {[
                                { lk: 'ប្រមូលបាន', l: 'Collected',   v: `$${totalRevenue}`, c: '#10b981', bg: '#f0fdf4' },
                                { lk: 'នៅខ្វះ',    l: 'Outstanding', v: `$${unpaidCount * 25}`, c: '#ef4444', bg: '#fff1f2' },
                                { lk: 'ក្បាលគ្រប',  l: 'Paid',        v: paidCount,          c: '#2563eb', bg: '#eff6ff' },
                                { lk: 'មិនទាន់',   l: 'Unpaid',      v: unpaidCount,         c: '#f59e0b', bg: '#fffbeb' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: s.bg, borderRadius: 14, padding: 16, border: `1px solid ${s.c}30` }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: s.c, marginBottom: 2 }}>{s.v}</div>
                                    <KH style={{ fontSize: 12, color: s.c, display: 'block', opacity: 0.8 }}>{s.lk}</KH>
                                    <div style={{ fontSize: 11, color: s.c, opacity: 0.6 }}>{s.l}</div>
                                </div>
                            ))}
                        </div>

                        {/* Payment history */}
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div style={{ padding: '16px 20px 0', marginBottom: 4 }}>
                                <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>ប្រវត្តិការទូទាត់</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Payment History — May 2026</div>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody>
                                    {PAYMENTS.map(p => (
                                        <tr key={p.id}>
                                            <td><KH style={{ fontWeight: 700, fontSize: 13 }}>{p.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{p.nameEn}</div></td>
                                            <td><span style={{ fontWeight: 700 }}>${p.amount}</span></td>
                                            <td><Badge type="blue">{p.method}</Badge></td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{p.date}</td>
                                            <td><Badge type={p.status === 'verified' ? 'green' : p.status === 'pending' ? 'amber' : 'blue'}>
                                                {p.status === 'verified' ? badgeIcon(CheckCircle2, 'Verified') : p.status === 'pending' ? badgeIcon(Hourglass, 'Pending') : 'Partial'}
                                            </Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Per-student fee status */}
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div style={{ padding: '16px 20px 0', marginBottom: 4 }}>
                                <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>ស្ថានភាពថ្លៃតាមសិស្ស</KH>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Level</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {STUDENTS.map(s => (
                                        <tr key={s.id}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={s.nameEn} size={30} />
                                                <div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div>
                                            </div></td>
                                            <td><Badge type="blue">{s.level}</Badge></td>
                                            <td><span style={{ fontWeight: 700 }}>${s.amt}</span></td>
                                            <td><Badge type={s.fees === 'Paid' ? 'green' : s.fees === 'Unpaid' ? 'red' : 'amber'}>
                                                {s.fees === 'Paid' ? badgeIcon(CheckCircle2, 'Paid') : s.fees === 'Unpaid' ? badgeIcon(XCircle, 'Unpaid') : 'Partial'}
                                            </Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
