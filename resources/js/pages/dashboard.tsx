import '@/pages/admin/admin.css';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, FeeTag, KH, ScoreChip } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CalendarCheck2,
    ClipboardCheck,
    Clock,
    DollarSign,
    GraduationCap,
    Plus,
    School,
    Sparkles,
    TrendingUp,
    UserRound,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
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
    grade: {
        speaking: number;
        listening: number;
        reading: number;
        writing: number;
    };
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

interface StatCard {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    accent: string;
    tone: string;
}

const avg = (grade: RecentStudent['grade']): number =>
    Math.round(
        (grade.speaking + grade.listening + grade.reading + grade.writing) / 4,
    );

const formatMoney = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(amount);

function DashboardTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="dashboard-tooltip">
            {label && <div className="dashboard-tooltip-label">{label}</div>}
            {payload.map((item: any) => (
                <div key={item.name} className="dashboard-tooltip-row">
                    <span style={{ background: item.color ?? '#2563eb' }} />
                    <strong>
                        {item.name}:&nbsp;
                        {item.name === 'revenue'
                            ? formatMoney(Number(item.value))
                            : item.value}
                        {item.name === 'rate' ? '%' : ''}
                    </strong>
                </div>
            ))}
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    action,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`dashboard-panel ${className}`}>
            <div className="dashboard-section-head">
                <div>
                    <h2>{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

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
    const { props } = usePage<SharedData>();
    const { lang } = useAdminTranslation();
    const isKh = lang === 'kh';
    const userName = props.auth?.user?.name ?? 'Admin';
    const latestRevenue = revenueTrend.at(-1)?.revenue ?? stats.monthlyRevenue;
    const previousRevenue = revenueTrend.at(-2)?.revenue ?? 0;
    const revenueChange =
        previousRevenue > 0
            ? Math.round(((latestRevenue - previousRevenue) / previousRevenue) * 100)
            : 0;

    const statCards: StatCard[] = [
        {
            icon: GraduationCap,
            label: 'Students',
            value: stats.totalStudents,
            accent: '#2563eb',
            tone: 'blue',
        },
        {
            icon: Users,
            label: 'Teachers',
            value: stats.totalTeachers,
            accent: '#7c3aed',
            tone: 'purple',
        },
        {
            icon: DollarSign,
            label: 'Revenue',
            value: formatMoney(stats.monthlyRevenue),
            accent: '#059669',
            tone: 'green',
        },
        {
            icon: ClipboardCheck,
            label: 'Attendance',
            value: `${stats.avgAttendance}%`,
            accent: '#d97706',
            tone: 'amber',
        },
    ];

    const feeTotal = feeStatus.paid + feeStatus.unpaid + feeStatus.partial;
    const paidRate = feeTotal > 0 ? Math.round((feeStatus.paid / feeTotal) * 100) : 0;

    const skillsData = [
        { skill: 'Speaking', labelKh: 'Speaking', avg: skillsAvg.speaking },
        { skill: 'Listening', labelKh: 'Listening', avg: skillsAvg.listening },
        { skill: 'Reading', labelKh: 'Reading', avg: skillsAvg.reading },
        { skill: 'Writing', labelKh: 'Writing', avg: skillsAvg.writing },
    ].map((skill) => ({
        ...skill,
        label: isKh ? skill.labelKh : skill.skill,
    }));

    const compactAttendance = attendanceByClass.slice(0, 5);
    const visibleStudents = recentStudents.slice(0, 5);
    const visibleClasses = classes.slice(0, 4);
    const urgentStudents = atRiskStudents.slice(0, 3);

    return (
        <AdminShell>
            <Head title="Dashboard" />

            <div className="dashboard-surface dashboard-mobile-app">
                <div className="dashboard-content fade-in">
                    <section className="dashboard-hero">
                        <div className="dashboard-hero-copy">
                            <span className="dashboard-kicker">
                                <Sparkles size={14} />
                                Live school overview
                            </span>
                            <h1>Good afternoon, {userName}</h1>
                            <p>
                                Here is today&apos;s school activity, attendance,
                                payments, and class progress.
                            </p>
                        </div>

                        <div className="dashboard-hero-card">
                            <div>
                                <span>Monthly revenue</span>
                                <strong>{formatMoney(latestRevenue)}</strong>
                            </div>
                            <Badge type={revenueChange >= 0 ? 'green' : 'red'}>
                                <TrendingUp size={12} />
                                {revenueChange >= 0 ? '+' : ''}
                                {revenueChange}%
                            </Badge>
                        </div>
                    </section>

                    <div className="dashboard-quick-actions">
                        <Link href="/admin/students/create">
                            <Plus size={16} />
                            Add student
                        </Link>
                        <Link href="/admin/attendance">
                            <CalendarCheck2 size={16} />
                            Attendance
                        </Link>
                        <Link href="/admin/classes">
                            <BookOpenCheck size={16} />
                            Classes
                        </Link>
                    </div>

                    <section className="dashboard-stat-grid">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <article
                                    key={stat.label}
                                    className={`dashboard-stat-card tone-${stat.tone}`}
                                >
                                    <span
                                        className="dashboard-stat-icon"
                                        style={{ color: stat.accent }}
                                    >
                                        <Icon size={20} strokeWidth={2.4} />
                                    </span>
                                    <span>{stat.label}</span>
                                    <strong>{stat.value}</strong>
                                </article>
                            );
                        })}
                    </section>

                    <div className="dashboard-insight-grid">
                        <SectionCard
                            title="Revenue trend"
                            subtitle="Last 6 months"
                            className="dashboard-chart-card dashboard-revenue-card"
                        >
                            <ResponsiveContainer width="100%" height={176}>
                                <AreaChart
                                    data={revenueTrend}
                                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="dashboardRevenue"
                                            x1="0"
                                            x2="0"
                                            y1="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#2563eb"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#2563eb"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        stroke="#e8edf5"
                                        strokeDasharray="4 4"
                                        vertical={false}
                                    />
                                    <XAxis
                                        axisLine={false}
                                        dataKey="month"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(value) =>
                                            `$${Number(value) / 1000}k`
                                        }
                                        tickLine={false}
                                    />
                                    <Tooltip content={<DashboardTooltip />} />
                                    <Area
                                        activeDot={{
                                            fill: '#2563eb',
                                            r: 5,
                                            stroke: '#fff',
                                            strokeWidth: 2,
                                        }}
                                        dataKey="revenue"
                                        fill="url(#dashboardRevenue)"
                                        name="revenue"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        type="monotone"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </SectionCard>

                        <SectionCard
                            title="Fee health"
                            subtitle={`${paidRate}% paid this cycle`}
                            className="dashboard-fee-card"
                        >
                            <div
                                className="dashboard-ring"
                                style={
                                    {
                                        '--dashboard-ring': `${paidRate}%`,
                                    } as CSSProperties
                                }
                            >
                                <div>
                                    <strong>{paidRate}%</strong>
                                    <span>Paid</span>
                                </div>
                            </div>
                            <div className="dashboard-fee-list">
                                <span>
                                    <i className="paid" />
                                    Paid <strong>{feeStatus.paid}</strong>
                                </span>
                                <span>
                                    <i className="partial" />
                                    Partial <strong>{feeStatus.partial}</strong>
                                </span>
                                <span>
                                    <i className="unpaid" />
                                    Unpaid <strong>{feeStatus.unpaid}</strong>
                                </span>
                            </div>
                        </SectionCard>
                    </div>

                    <div className="dashboard-insight-grid">
                        <SectionCard
                            title="Attendance by class"
                            subtitle="Average, last 30 days"
                            className="dashboard-chart-card"
                        >
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart
                                    data={compactAttendance}
                                    layout="vertical"
                                    margin={{ top: 4, right: 18, left: -18, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        horizontal={false}
                                        stroke="#e8edf5"
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(value) => `${value}%`}
                                        tickLine={false}
                                        type="number"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        dataKey="short"
                                        tick={{ fill: '#475569', fontSize: 11 }}
                                        tickLine={false}
                                        type="category"
                                        width={78}
                                    />
                                    <Tooltip content={<DashboardTooltip />} />
                                    <Bar
                                        barSize={14}
                                        dataKey="rate"
                                        name="rate"
                                        radius={[0, 999, 999, 0]}
                                    >
                                        {compactAttendance.map((entry) => (
                                            <Cell
                                                key={entry.short}
                                                fill={
                                                    entry.rate >= 80
                                                        ? '#10b981'
                                                        : entry.rate >= 60
                                                          ? '#f59e0b'
                                                          : '#ef4444'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>

                        <SectionCard
                            title="Skill average"
                            subtitle="All active students"
                            className="dashboard-chart-card"
                        >
                            <ResponsiveContainer width="100%" height={210}>
                                <RadarChart
                                    data={skillsData}
                                    margin={{ top: 8, right: 18, left: 18, bottom: 8 }}
                                >
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis
                                        dataKey="label"
                                        tick={{
                                            fill: '#475569',
                                            fontFamily: isKh
                                                ? "'Noto Sans Khmer', sans-serif"
                                                : 'inherit',
                                            fontSize: 11,
                                            fontWeight: 700,
                                        }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                                    />
                                    <Radar
                                        dataKey="avg"
                                        dot={{
                                            fill: '#4f46e5',
                                            r: 3,
                                            stroke: '#fff',
                                            strokeWidth: 2,
                                        }}
                                        fill="#4f46e5"
                                        fillOpacity={0.16}
                                        name="Avg"
                                        stroke="#4f46e5"
                                        strokeWidth={2.5}
                                    />
                                    <Tooltip content={<DashboardTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    </div>

                    {urgentStudents.length > 0 && (
                        <SectionCard
                            title="Needs attention"
                            subtitle={`${atRiskStudents.length} student alerts`}
                            action={
                                <Link className="dashboard-link" href="/admin/students">
                                    View all <ArrowRight size={14} />
                                </Link>
                            }
                        >
                            <div className="dashboard-alert-list">
                                {urgentStudents.map((student) => (
                                    <article
                                        key={student.id}
                                        className="dashboard-alert-row"
                                    >
                                        <div className="dashboard-alert-identity">
                                            <Avatar
                                                name={student.nameEn}
                                                size={42}
                                                src={student.photo}
                                            />
                                            <div>
                                                <KH>{student.nameKh}</KH>
                                                <span>{student.nameEn}</span>
                                            </div>
                                        </div>
                                        <div className="dashboard-alert-detail">
                                            <span>{student.level}</span>
                                            <strong>
                                                {student.attendance < 70
                                                    ? 'Low attendance'
                                                    : 'Needs review'}
                                            </strong>
                                        </div>
                                        <div className="dashboard-alert-meter">
                                            <strong>{student.attendance}%</strong>
                                            <span>Attend</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    <SectionCard
                        title="Recent students"
                        subtitle="Latest enrolled profiles"
                        action={
                            <Link
                                className="dashboard-primary-action"
                                href="/admin/students/create"
                            >
                                <Plus size={14} />
                                Add
                            </Link>
                        }
                    >
                        <div className="dashboard-student-list">
                            {visibleStudents.map((student) => (
                                <article
                                    key={student.id}
                                    className="dashboard-student-card"
                                >
                                    <Avatar
                                        name={student.nameEn}
                                        size={44}
                                        src={student.photo}
                                    />
                                    <div className="dashboard-student-main">
                                        <KH>{student.nameKh}</KH>
                                        <span>{student.nameEn}</span>
                                        <div>
                                            <Badge type="blue">{student.level}</Badge>
                                            <FeeTag status={student.fees} />
                                        </div>
                                    </div>
                                    <div className="dashboard-student-score">
                                        <ScoreChip score={avg(student.grade)} />
                                        <span>{student.attendance}%</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Classes"
                        subtitle="Today and active rooms"
                        action={
                            <Link className="dashboard-link" href="/admin/classes">
                                View all <ArrowRight size={14} />
                            </Link>
                        }
                    >
                        <div className="dashboard-class-grid">
                            {visibleClasses.map((classItem) => (
                                <article
                                    key={classItem.id}
                                    className="dashboard-class-card"
                                >
                                    <div>
                                        <span>
                                            <School size={15} />
                                            {classItem.room}
                                        </span>
                                        <strong>{classItem.name}</strong>
                                        <p>{classItem.teacher}</p>
                                    </div>
                                    <div className="dashboard-class-meta">
                                        <span>
                                            <Clock size={13} />
                                            {classItem.time}
                                        </span>
                                        <span>
                                            <UserRound size={13} />
                                            {classItem.count}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </SectionCard>

                    {recentPayments.length > 0 && (
                        <SectionCard
                            title="Recent payments"
                            subtitle="Latest fee activity"
                            action={
                                <Link className="dashboard-link" href="/admin/fee">
                                    View all <ArrowRight size={14} />
                                </Link>
                            }
                        >
                            <div className="dashboard-payment-list">
                                {recentPayments.slice(0, 4).map((payment) => (
                                    <article
                                        key={payment.id}
                                        className="dashboard-payment-row"
                                    >
                                        <div className="dashboard-payment-left">
                                            <Avatar name={payment.nameEn} size={38} />
                                            <div>
                                                <KH>{payment.nameKh}</KH>
                                                <span>{payment.method}</span>
                                            </div>
                                        </div>
                                        <div className="dashboard-payment-right">
                                            <strong>{formatMoney(payment.amount)}</strong>
                                            <span>{payment.date}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
