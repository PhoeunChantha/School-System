import '@/pages/admin/admin.css';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, ScoreChip } from '@/pages/admin/ui';
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
import type { ReactNode } from 'react';
import {
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

interface TopStudentScore {
    id: number;
    studentId: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    className: string;
    period: string;
    score: number;
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
    topStudentScores: TopStudentScore[];
    classes: ClassSummary[];
}

interface StatCard {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    accent: string;
    iconClass: string;
}

const panelClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const rowCardClass = 'rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-950/70';
const mutedTextClass = 'text-[11px] font-extrabold text-slate-400';

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
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {label && <div className="mb-1 font-black text-slate-700 dark:text-slate-100">{label}</div>}
            {payload.map((item: any) => (
                <div key={item.name} className="flex items-center gap-1.5 font-extrabold text-slate-600 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color ?? '#2563eb' }} />
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
        <section className={`${panelClass} ${className}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[15px] font-black text-slate-900 dark:text-slate-50">{title}</h2>
                    {subtitle && <p className="mt-1 text-[11px] font-extrabold text-slate-400">{subtitle}</p>}
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
    attendanceByClass,
    skillsAvg,
    atRiskStudents,
    topStudentScores,
    classes,
}: DashboardProps) {
    const { props } = usePage<SharedData>();
    const { lang } = useAdminTranslation();
    const isKh = lang === 'kh';
    const userName = props.auth?.user?.name ?? 'Admin';
    const statCards: StatCard[] = [
        {
            icon: GraduationCap,
            label: 'Students',
            value: stats.totalStudents,
            accent: '#2563eb',
            iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
        },
        {
            icon: Users,
            label: 'Teachers',
            value: stats.totalTeachers,
            accent: '#7c3aed',
            iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
        },
        {
            icon: DollarSign,
            label: 'Revenue',
            value: formatMoney(stats.monthlyRevenue),
            accent: '#059669',
            iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
        },
        {
            icon: ClipboardCheck,
            label: 'Attendance',
            value: `${stats.avgAttendance}%`,
            accent: '#d97706',
            iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
        },
    ];

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
    const visibleTopScores = topStudentScores.slice(0, 5);
    const visibleClasses = classes.slice(0, 4);
    const urgentStudents = atRiskStudents.slice(0, 3);

    return (
        <AdminShell>
            <Head title="Dashboard" />

            <div className="min-h-full bg-slate-50 dark:bg-slate-950 md:p-6 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="fade-in mx-auto flex max-w-7xl flex-col gap-4 max-md:gap-3">
                    <section>
                        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-900 p-7 text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] max-md:rounded-[22px] max-md:p-4 dark:border-slate-700 dark:bg-slate-800">
                            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-black text-blue-100 max-md:mb-4">
                                <Sparkles size={14} />
                                Live school overview
                            </span>
                            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal max-md:text-[21px]">
                                Good afternoon, {userName}
                            </h1>
                            <p className="mt-3 max-w-lg text-sm font-extrabold leading-5 text-slate-300 max-md:mt-1.5 max-md:text-[12px] max-md:leading-4">
                                Here is today&apos;s school activity, attendance,
                                payments, and class progress.
                            </p>
                        </div>
                    </section>

                    <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <Link className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" href="/admin/students/create">
                            <Plus size={16} />
                            Add student
                        </Link>
                        <Link className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" href="/admin/attendance">
                            <CalendarCheck2 size={16} />
                            Attendance
                        </Link>
                        <Link className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" href="/admin/classes">
                            <BookOpenCheck size={16} />
                            Classes
                        </Link>
                    </div>

                    <section className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:gap-2">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <article
                                    key={stat.label}
                                    className="rounded-[18px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] max-md:min-h-[80px] max-md:p-3 dark:border-slate-700 dark:bg-slate-800/90"
                                >
                                    <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl max-md:mb-2 max-md:h-8 max-md:w-8 ${stat.iconClass}`}>
                                        <Icon size={20} strokeWidth={2.4} />
                                    </span>
                                    <span className="block text-[11px] font-extrabold text-slate-400">{stat.label}</span>
                                    <strong className="mt-1 block text-2xl font-black text-slate-900 max-md:text-xl dark:text-slate-50">{stat.value}</strong>
                                </article>
                            );
                        })}
                    </section>

                    {/*
                    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 max-md:gap-3">
                        Revenue trend and Fee health are hidden by request.
                    </div>
                    */}

                    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 max-md:gap-3">
                        <SectionCard
                            title="Attendance by class"
                            subtitle="Average, last 30 days"
                            className="min-h-[260px]"
                        >
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart
                                    data={compactAttendance}
                                    margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e8edf5"
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        axisLine={false}
                                        dataKey="short"
                                        interval={0}
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(value) => `${value}%`}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<DashboardTooltip />} />
                                    <Bar
                                        barSize={26}
                                        dataKey="rate"
                                        name="rate"
                                        radius={[0, 0, 0, 0]}
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
                            className="min-h-[260px]"
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
                                <Link className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300" href="/admin/students">
                                    View all <ArrowRight size={14} />
                                </Link>
                            }
                        >
                            <div className="grid gap-2">
                                {urgentStudents.map((student) => (
                                    <article
                                        key={student.id}
                                        className={`${rowCardClass} relative overflow-hidden before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-red-500`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={student.nameEn}
                                                size={42}
                                                src={student.photo}
                                            />
                                            <div className="min-w-0">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{student.nameKh}</KH>
                                                <span className="block truncate text-[11px] font-extrabold text-slate-400">{student.nameEn}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-slate-400">{student.level}</span>
                                                <strong className="block text-xs font-black text-slate-800 dark:text-slate-100">
                                                    {student.attendance < 70
                                                        ? 'Low attendance'
                                                        : 'Needs review'}
                                                </strong>
                                            </div>
                                            <div className="rounded-2xl bg-red-50 px-3 py-2 text-right dark:bg-red-500/15">
                                                <strong className="block text-base font-black text-red-600 dark:text-red-300">{student.attendance}%</strong>
                                                <span className="text-[10px] font-black uppercase text-red-400">Attend</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    <SectionCard
                        title="Top student scores"
                        subtitle="Highest grade averages"
                        action={
                            <Link
                                className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300"
                                href="/admin/grades"
                            >
                                View grades <ArrowRight size={14} />
                            </Link>
                        }
                    >
                        <div className="grid gap-3">
                            {visibleTopScores.length === 0 && (
                                <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-black text-slate-400 dark:border-slate-700 dark:bg-slate-950/70">
                                    No grade scores recorded yet.
                                </div>
                            )}
                            <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2">
                                {visibleTopScores.map((student, index) => {
                                    const ringValue = Math.max(0, Math.min(100, Math.round(student.score)));
                                    const ringColor = ringValue >= 85 ? '#10b981' : ringValue >= 70 ? '#2563eb' : ringValue >= 50 ? '#f59e0b' : '#ef4444';

                                    return (
                                        <article
                                            key={student.id}
                                            className={`${rowCardClass} flex min-h-[210px] flex-col items-center justify-between gap-3 text-center`}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-xs font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.25)]">
                                                    {index + 1}
                                                </span>
                                                <ScoreChip score={ringValue} />
                                            </div>

                                            <div
                                                className="relative grid h-28 w-28 place-items-center rounded-full"
                                                style={{
                                                    background: `conic-gradient(${ringColor} ${ringValue * 3.6}deg, #e2e8f0 0deg)`,
                                                }}
                                            >
                                                <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900" />
                                                <div className="relative grid place-items-center gap-1">
                                                    <Avatar
                                                        name={student.nameEn}
                                                        size={54}
                                                        src={student.photo}
                                                    />
                                                    <strong className="text-lg font-black leading-none text-slate-900 dark:text-slate-50">{student.score}</strong>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{student.nameKh}</KH>
                                                <span className="block truncate text-[11px] font-extrabold text-slate-400">{student.nameEn}</span>
                                                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                                                    {student.className && <Badge type="blue">{student.className}</Badge>}
                                                    <Badge type="green">{student.period}</Badge>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {visibleTopScores.length > 0 && (
                                <div className="grid grid-cols-5 gap-2 rounded-[18px] border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/70 max-md:grid-cols-1">
                                    {visibleTopScores.map((student) => (
                                        <div key={`legend-${student.id}`} className="min-w-0">
                                            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase text-slate-400">
                                                <span className="truncate">{student.nameEn}</span>
                                                <span>{student.score}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-blue-600"
                                                    style={{ width: `${Math.max(0, Math.min(100, Math.round(student.score)))}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Classes"
                            subtitle="Today and active rooms"
                            action={
                            <Link className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300" href="/admin/classes">
                                View all <ArrowRight size={14} />
                            </Link>
                        }
                    >
                        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                            {visibleClasses.map((classItem) => (
                                <article
                                    key={classItem.id}
                                    className={rowCardClass}
                                >
                                    <div>
                                        <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-black text-slate-400">
                                            <School size={15} />
                                            {classItem.room}
                                        </span>
                                        <strong className="block text-base font-black text-slate-900 dark:text-slate-50">{classItem.name}</strong>
                                        <p className="mt-1 text-[11px] font-extrabold text-slate-400">{classItem.teacher}</p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black text-slate-500 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock size={13} />
                                            {classItem.time}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserRound size={13} />
                                            {classItem.count}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </SectionCard>

                    {/*
                    Recent payments is hidden by request.
                    */}
                </div>
            </div>
        </AdminShell>
    );
}
