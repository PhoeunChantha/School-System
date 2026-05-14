import '@/pages/admin/admin.css';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, FeeTag, KH, PBar, ScoreChip } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    CreditCard,
    DollarSign,
    GraduationCap,
    Hourglass,
    ArrowRight,
    TriangleAlert,
    UserRound,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// ── Prop types ────────────────────────────────────────────

interface Stats {
    totalStudents: number;
    totalTeachers: number;
    monthlyRevenue: number;
    avgAttendance: number;
}

interface RevenueTrend {
    month: string;
    revenue: number;
    students: number;
}

interface FeeStatus {
    paid: number;
    unpaid: number;
    partial: number;
}

interface AttendanceByClass {
    name: string;
    short: string;
    rate: number;
}

interface SkillsAvg {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

interface AtRiskStudent {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    attendance: number;
    fees: 'Paid' | 'Unpaid' | 'Partial';
}

interface RecentPayment {
    id: number;
    nameKh: string;
    nameEn: string;
    amount: number;
    method: string;
    date: string;
    status: string;
}

interface RecentStudent {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    attendance: number;
    grade: { speaking: number; listening: number; reading: number; writing: number };
    fees: 'Paid' | 'Unpaid' | 'Partial';
    province: string;
}

interface ClassSummary {
    id: number;
    name: string;
    teacher: string;
    time: string;
    room: string;
    count: number;
    days: string;
}

interface DashboardProps {
    stats: Stats;
    revenueTrend: RevenueTrend[];
    feeStatus: FeeStatus;
    attendanceByClass: AttendanceByClass[];
    skillsAvg: SkillsAvg;
    atRiskStudents: AtRiskStudent[];
    recentPayments: RecentPayment[];
    recentStudents: RecentStudent[];
    classes: ClassSummary[];
}

// ── Helpers ───────────────────────────────────────────────

const avg = (g: RecentStudent['grade']) =>
    Math.round((g.speaking + g.listening + g.reading + g.writing) / 4);

const iconBadge = (Icon: LucideIcon, label: React.ReactNode) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon size={12} strokeWidth={2.4} />
        {label}
    </span>
);

// ── Custom tooltip ────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e2940', color: 'white', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {label && <div style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontSize: 11 }}>{label}</div>}
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color ?? '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color ?? '#fff', display: 'inline-block' }} />
                    {p.name}: <strong style={{ marginLeft: 2 }}>{typeof p.value === 'number' && p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}{p.name === 'rate' ? '%' : ''}</strong>
                </div>
            ))}
        </div>
    );
};

// ── Chart card wrapper ────────────────────────────────────
const ChartCard = ({ title, titleKh, subtitle, children, style = {} }: {
    title: string; titleKh: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties;
}) => (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, ...style }}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{titleKh}</KH>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>— {title}</span>
            </div>
            {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {children}
    </div>
);

// ═════════════════════════════════════════════════════════
export default function Dashboard({
    stats,
    revenueTrend,
    feeStatus,
    attendanceByClass,
    skillsAvg,
    atRiskStudents,
    recentPayments,
    recentStudents,
    classes,
}: DashboardProps) {

    const totalStudents = stats.totalStudents;

    const feeData = [
        { name: 'Paid',    value: feeStatus.paid,    color: '#10b981' },
        { name: 'Unpaid',  value: feeStatus.unpaid,  color: '#ef4444' },
        { name: 'Partial', value: feeStatus.partial, color: '#f59e0b' },
    ];

    const skillsData = [
        { skill: 'Speaking', skKh: 'និយាយ', avg: skillsAvg.speaking },
        { skill: 'Listening', skKh: 'ស្ដាប់', avg: skillsAvg.listening },
        { skill: 'Reading',  skKh: 'អាន',   avg: skillsAvg.reading },
        { skill: 'Writing',  skKh: 'សរសេរ', avg: skillsAvg.writing },
    ];

    const DonutLabel = ({ cx, cy }: any) => (
        <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#1e293b" style={{ fontSize: 26, fontWeight: 800 }}>
                {totalStudents}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 11 }}>
                students
            </text>
        </>
    );

    return (
        <AdminShell>
            <Head title="Dashboard" />
            <div className="admin-wrap" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── Stat cards ── */}
                    <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                        {[
                            { icon: GraduationCap, lk: 'សិស្សទាំងអស់', l: 'Total Students',   v: stats.totalStudents,               bg: '#eff6ff', c: '#2563eb' },
                            { icon: Users, lk: 'គ្រូបង្រៀន',   l: 'Teachers',        v: stats.totalTeachers,               bg: '#f5f3ff', c: '#7c3aed' },
                            { icon: DollarSign, lk: 'ចំណូលខែនេះ',   l: 'Monthly Revenue', v: `$${stats.monthlyRevenue.toFixed(0)}`, bg: '#f0fdf4', c: '#10b981' },
                            { icon: ClipboardCheck, lk: 'អត្រាវត្តមាន',  l: 'Avg Attendance',  v: `${stats.avgAttendance}%`,         bg: '#fffbeb', c: '#d97706' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.icon size={22} strokeWidth={2.4} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{s.v}</div>
                                <KH style={{ fontSize: 12, color: '#64748b', display: 'block', lineHeight: 1.3 }}>{s.lk}</KH>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Charts row 1: Revenue trend + Fee donut ── */}
                    <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 16 }}>

                        {/* Revenue area chart */}
                        <ChartCard titleKh="ចំណូលប្រចាំខែ" title="Monthly Revenue Trend" subtitle="Last 6 months · USD">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={revenueTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                                    <Tooltip content={<DarkTooltip />} />
                                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                {revenueTrend.slice(-3).map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>${d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue.toFixed(0)}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.month}</div>
                                    </div>
                                ))}
                                {revenueTrend.length >= 2 && (() => {
                                    const last = revenueTrend[revenueTrend.length - 1].revenue;
                                    const prev = revenueTrend[revenueTrend.length - 2].revenue;
                                    const pct  = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : '—';
                                    return (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: last >= prev ? '#10b981' : '#ef4444' }}>{last >= prev ? '+' : ''}{pct}%</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>vs prev</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </ChartCard>

                        {/* Fee donut */}
                        <ChartCard titleKh="ស្ថានភាពថ្លៃ" title="Fee Status" subtitle={`${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={feeData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false} label={DonutLabel} isAnimationActive animationBegin={200} animationDuration={800}>
                                            {feeData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<DarkTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', width: '100%' }}>
                                    {feeData.map(f => (
                                        <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
                                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{f.name}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ChartCard>
                    </div>

                    {/* ── Charts row 2: Attendance + Skills ── */}
                    <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                        {/* Attendance by class */}
                        <ChartCard titleKh="វត្តមានតាមថ្នាក់" title="Attendance by Class" subtitle="Average % · last 30 days">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={attendanceByClass} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barSize={14}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                    <YAxis type="category" dataKey="short" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} width={88} />
                                    <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                                    <Bar dataKey="rate" name="rate" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={700}>
                                        {attendanceByClass.map((entry, i) => (
                                            <Cell key={i} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 60 ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                                {[{ c: '#10b981', l: '≥80% Good' }, { c: '#f59e0b', l: '60–79% Warning' }, { c: '#ef4444', l: '<60% At Risk' }].map(lg => (
                                    <div key={lg.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 2, background: lg.c, display: 'inline-block' }} />
                                        {lg.l}
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        {/* Skills average radar */}
                        <ChartCard titleKh="ពិន្ទុជំនាញ" title="Avg Skill Scores" subtitle="All students · speaking, listening, reading, writing">
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={skillsData} margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="skKh" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700, fontFamily: "'Noto Sans Khmer',sans-serif" }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                                    <Radar name="Avg" dataKey="avg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.18} strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: 'white' }} isAnimationActive animationDuration={800} />
                                    <Tooltip content={<DarkTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                {skillsData.map(sk => (
                                    <div key={sk.skill} className="dashboard-soft-tile" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: sk.avg >= 75 ? '#10b981' : sk.avg >= 50 ? '#3b82f6' : '#f59e0b' }}>{sk.avg}</div>
                                        <KH style={{ fontSize: 10, color: '#64748b', display: 'block' }}>{sk.skKh}</KH>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    {/* ── At-risk + Recent payments ── */}
                    <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="card dashboard-list-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <TriangleAlert size={20} color="#d97706" strokeWidth={2.4} />
                                        <KH className="dark-text-strong" style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>សិស្សត្រូវការជំនួយ</KH>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>At-risk — {atRiskStudents.length} alerts</div>
                                </div>
                                    <Link href="/admin/students" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>View All <ArrowRight size={13} /></Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {atRiskStudents.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Check size={14} />
                                        No at-risk students
                                    </div>
                                )}
                                {atRiskStudents.map(s => (
                                    <div key={s.id} className="dashboard-risk-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                                        <Avatar name={s.nameEn} src={s.photo} size={36} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <KH className="dark-text-strong" style={{ fontWeight: 700, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.level}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            {s.attendance < 70 && <Badge type="red">{iconBadge(ClipboardCheck, `${s.attendance}%`)}</Badge>}
                                            {s.fees === 'Unpaid' && <Badge type="amber">{iconBadge(CreditCard, 'Unpaid')}</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>ការទូទាត់ថ្មីៗ</KH>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Recent Payments</div>
                                </div>
                                    <Link href="/admin/fee" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>View All <ArrowRight size={13} /></Link>
                            </div>
                            {recentPayments.length === 0
                                ? <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>No payments yet</div>
                                : (
                                    <table className="data-table">
                                        <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {recentPayments.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <Avatar name={p.nameEn} size={28} />
                                                            <div>
                                                                <KH style={{ fontWeight: 700, fontSize: 12, display: 'block' }}>{p.nameKh}</KH>
                                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.date}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span style={{ fontWeight: 700 }}>${p.amount.toFixed(2)}</span></td>
                                                    <td><Badge type="blue">{p.method}</Badge></td>
                                                    <td>
                                                        <Badge type={p.status === 'paid' ? 'green' : 'amber'}>
                                                            {p.status === 'paid' ? iconBadge(CheckCircle2, 'Paid') : iconBadge(Hourglass, 'Pending')}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )
                            }
                        </div>
                    </div>

                    {/* ── Recent students overview ── */}
                    <div className="card">
                        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div>
                                <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>សិស្សថ្មីៗ</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Recent Students</div>
                            </div>
                            <Link href="/admin/students/create" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>+ Add Student</Link>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Level</th><th>Attendance</th><th>Avg Score</th><th>Fee</th><th>Province</th></tr></thead>
                                <tbody>
                                    {recentStudents.map(s => (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Avatar name={s.nameEn} src={s.photo} size={32} />
                                                    <div>
                                                        <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH>
                                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><Badge type="blue">{s.level}</Badge></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ flex: 1, minWidth: 80 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} /></div>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance >= 80 ? '#10b981' : '#ef4444', width: 36 }}>{s.attendance}%</span>
                                                </div>
                                            </td>
                                            <td><ScoreChip score={avg(s.grade)} /></td>
                                            <td><FeeTag status={s.fees} /></td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{s.province}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Classes overview ── */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <KH style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block' }}>ថ្នាក់ទាំងអស់</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>All Classes</div>
                            </div>
                                    <Link href="/admin/classes" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>View All <ArrowRight size={13} /></Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                            {classes.map(cls => (
                                <div key={cls.id} className="dashboard-soft-tile" style={{ background: '#f8fafc', borderRadius: 12, padding: 14, border: '1px solid #e8edf5' }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{cls.name}</div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{cls.teacher}</div>
                                    <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} strokeWidth={2.4} />
                                        {cls.time}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Badge type="gray">Room {cls.room}</Badge>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            {cls.count}
                                            <UserRound size={12} strokeWidth={2.4} />
                                        </span>
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
