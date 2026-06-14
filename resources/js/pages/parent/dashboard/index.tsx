import { SchoolAppInstallBanner } from '@/components/school-app-install-banner';
import { useParentDomTranslations } from '@/hooks/use-parent-dom-translations';
import { useParentTranslation } from '@/hooks/use-parent-translation';
import { attendance, dashboard, grades, homework } from '@/routes/parent';
import { manifest, serviceWorker } from '@/routes/school-app';
import type { SharedData } from '@/types';
import { Head, Link, usePage, type InertiaLinkProps } from '@inertiajs/react';
import {
    BarChart3,
    BookOpenCheck,
    CalendarCheck2,
    ChevronRight,
    GraduationCap,
    ShieldCheck,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';

interface ParentProfile {
    studentId?: number | null;
    name: string;
    nameKh: string;
    code: string;
    photo: string | null;
    className: string;
    level: string;
    gender: string;
    childrenCount?: number;
}

interface Grade {
    period: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    date: string;
}

interface Homework {
    title: string;
    due: string;
    score: number | null;
    points: number;
    status: string;
}

interface Exam {
    title: string;
    subject: string;
    date: string;
    duration: number;
    status: string;
}

interface Stats {
    attendanceRate: number;
    latestAverage: number;
    homeworkSubmitted: number;
    certificatesIssued: number;
}

interface Props {
    profile: ParentProfile;
    stats: Stats;
    recentGrades: Grade[];
    recentHomework: Homework[];
    upcomingExams: Exam[];
}

const statusClasses: Record<string, string> = {
    submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    graded: 'bg-teal-50 text-teal-700 ring-teal-100',
    late: 'bg-amber-50 text-amber-700 ring-amber-100',
    pending: 'bg-slate-100 text-slate-600 ring-slate-200',
    missing: 'bg-rose-50 text-rose-700 ring-rose-100',
};

function initials(name: string): string {
    return (
        name
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'S'
    );
}

function formatDate(value: string): string {
    if (!value) {
        return 'No date';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function daysUntil(value: string): string {
    if (!value) {
        return 'Pending';
    }

    const diff = Math.ceil(
        (new Date(value).setHours(0, 0, 0, 0) -
            new Date().setHours(0, 0, 0, 0)) /
            86400000,
    );

    if (diff === 0) {
        return 'Today';
    }

    if (diff === 1) {
        return 'Tomorrow';
    }

    if (diff < 0) {
        return `${Math.abs(diff)}d late`;
    }

    return `${diff}d left`;
}

function gradeTone(value: number): string {
    if (value >= 85) {
        return 'text-emerald-600';
    }

    if (value >= 70) {
        return 'text-blue-600';
    }

    if (value >= 55) {
        return 'text-amber-600';
    }

    return 'text-rose-600';
}

function latestPendingHomework(
    homeworkItems: Homework[],
): Homework | undefined {
    return homeworkItems.find(
        (item) => !['submitted', 'graded'].includes(item.status),
    );
}

function childContext(profile: ParentProfile): string {
    return [profile.level, profile.className]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(' / ');
}

function registerParentServiceWorker(): void {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (
        !window.isSecureContext &&
        !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
        return;
    }

    navigator.serviceWorker
        .register(serviceWorker.url(), { scope: '/' })
        .catch(() => {});
}

export default function ParentDashboard({
    profile,
    stats,
    recentGrades,
    recentHomework,
    upcomingExams,
}: Props) {
    const { school } = usePage<SharedData>().props;
    const { lang, setLang } = useParentTranslation();
    const pendingHomework = latestPendingHomework(recentHomework);
    const upcomingExam = upcomingExams[0];
    const latestGrade = recentGrades[0];
    const childMeta = childContext(profile);
    const parentDashboardHref = dashboard();
    const parentAttendanceHref = attendance();
    const parentGradesHref = grades();
    const parentHomeworkHref = homework();
    const urgentItems = [
        pendingHomework
            ? {
                  label: 'Homework',
                  value: pendingHomework.title,
                  meta: `${daysUntil(pendingHomework.due)} / ${pendingHomework.points} pts`,
                  href: parentHomeworkHref,
                  tone: 'from-amber-50 to-orange-50 text-amber-700',
              }
            : null,
        upcomingExam
            ? {
                  label: 'Exam',
                  value: upcomingExam.title,
                  meta: `${formatDate(upcomingExam.date)} / ${upcomingExam.duration} min`,
                  href: parentDashboardHref,
                  tone: 'from-sky-50 to-cyan-50 text-sky-700',
              }
            : null,
    ].filter(Boolean) as Array<{
        label: string;
        value: string;
        meta: string;
        href: NonNullable<InertiaLinkProps['href']>;
        tone: string;
    }>;

    useEffect(registerParentServiceWorker, []);
    useParentDomTranslations();

    return (
        <>
            <Head title="Parent Portal">
                <link rel="manifest" href={manifest.url()} />
                <meta name="theme-color" content="#0f2f2a" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-title"
                    content="Parent Portal"
                />
            </Head>

            <main className="parent-wrap min-h-dvh bg-[#dfe3dc] text-[#10201c]">
                <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f8faf5] shadow-[0_26px_70px_rgba(16,32,28,0.22)]">
                    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 px-5 pt-4 pb-3 backdrop-blur-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef5f0] ring-1 ring-[#dbe7df]">
                                    {school.logo ? (
                                        <img
                                            src={school.logo}
                                            alt={school.nameEn}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ShieldCheck size={21} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black tracking-[0.18em] text-[#7b8c86] uppercase">
                                        Parent Portal
                                    </p>
                                    <h1 className="truncate text-lg font-black text-[#10201c]">
                                        {profile.name}
                                    </h1>
                                </div>
                            </div>
                            <div
                                className="flex shrink-0 rounded-full border border-[#e1e9e4] bg-white p-1 text-[11px] font-black text-[#64736e] shadow-[0_10px_24px_rgba(16,32,28,0.08)]"
                                aria-label="Switch language"
                            >
                                {(['kh', 'en'] as const).map((language) => (
                                    <button
                                        key={language}
                                        type="button"
                                        onClick={() => setLang(language)}
                                        className={`min-h-8 rounded-full px-3 transition ${
                                            lang === language
                                                ? 'bg-[#10201c] text-white shadow-[0_8px_16px_rgba(16,32,28,0.18)]'
                                                : 'text-[#64736e]'
                                        }`}
                                    >
                                        {language === 'kh' ? 'ខ្មែរ' : 'EN'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </header>

                    <section className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
                        <div className="relative overflow-hidden rounded-[32px] bg-[#10201c] p-5 text-white shadow-[0_24px_54px_rgba(16,32,28,0.28)]">
                            <div className="absolute top-[-70px] right-[-56px] h-44 w-44 rounded-full bg-[#40d6b0]/25" />
                            <div className="absolute right-10 bottom-[-64px] h-32 w-32 rounded-full bg-[#f7c75f]/25" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-[#baf7e8] ring-1 ring-white/10">
                                        <Sparkles size={13} />
                                        Today snapshot
                                    </div>
                                    <h2 className="text-[32px] leading-[0.95] font-black tracking-normal">
                                        {stats.attendanceRate}% present
                                    </h2>
                                    <p className="mt-3 max-w-[230px] text-sm font-semibold text-white/70">
                                        {childMeta ||
                                            'Class details will appear here.'}
                                    </p>
                                </div>

                                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[26px] bg-white/12 ring-1 ring-white/15">
                                    {profile.photo ? (
                                        <img
                                            src={profile.photo}
                                            alt={profile.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-black">
                                            {initials(profile.name)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="relative mt-5 grid grid-cols-3 gap-2">
                                <MetricPill
                                    label="Average"
                                    value={stats.latestAverage.toString()}
                                />
                                <MetricPill
                                    label="Homework"
                                    value={stats.homeworkSubmitted.toString()}
                                />
                                <MetricPill
                                    label="Awards"
                                    value={stats.certificatesIssued.toString()}
                                />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <QuickAction
                                href={parentAttendanceHref}
                                icon={CalendarCheck2}
                                label="Attendance"
                            />
                            <QuickAction
                                href={parentGradesHref}
                                icon={BarChart3}
                                label="Grades"
                            />
                            <QuickAction
                                href={parentHomeworkHref}
                                icon={BookOpenCheck}
                                label="Homework"
                            />
                        </div>

                        <SectionTitle
                            title="Needs Attention"
                            action={
                                urgentItems.length
                                    ? `${urgentItems.length} open`
                                    : 'Clear'
                            }
                        />
                        {urgentItems.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {urgentItems.map((item) => (
                                    <Link
                                        key={`${item.label}-${item.value}`}
                                        href={item.href}
                                        className={`group flex items-center justify-between gap-3 rounded-[24px] bg-gradient-to-br ${item.tone} p-4 ring-1 ring-black/5 transition active:scale-[0.98]`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black tracking-[0.12em] uppercase opacity-70">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 truncate text-sm font-black">
                                                {item.value}
                                            </p>
                                            <p className="mt-1 text-xs font-bold opacity-70">
                                                {item.meta}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={18}
                                            className="shrink-0 transition group-active:translate-x-0.5"
                                        />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[24px] bg-white p-4 text-sm font-bold text-[#64736e] ring-1 ring-[#e4ebe6]">
                                No urgent homework or exam items.
                            </div>
                        )}

                        <SectionTitle
                            title="Learning"
                            action={
                                latestGrade
                                    ? `${latestGrade.average} avg`
                                    : 'No grades'
                            }
                        />
                        <div className="rounded-[28px] bg-white p-4 shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]">
                            {latestGrade ? (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-base font-black">
                                                {latestGrade.period}
                                            </p>
                                            <p className="text-xs font-bold text-[#7b8c86]">
                                                Last grade record
                                            </p>
                                        </div>
                                        <div
                                            className={`text-3xl font-black ${gradeTone(latestGrade.average)}`}
                                        >
                                            {latestGrade.average}
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-3">
                                        <SkillBar
                                            label="Speaking"
                                            value={latestGrade.speaking}
                                        />
                                        <SkillBar
                                            label="Listening"
                                            value={latestGrade.listening}
                                        />
                                        <SkillBar
                                            label="Reading"
                                            value={latestGrade.reading}
                                        />
                                        <SkillBar
                                            label="Writing"
                                            value={latestGrade.writing}
                                        />
                                    </div>
                                </>
                            ) : (
                                <EmptyLine
                                    icon={GraduationCap}
                                    text="Grades will show after teacher records scores."
                                />
                            )}
                        </div>

                        <SectionTitle
                            title="Recent Homework"
                            action={`${recentHomework.length} items`}
                        />
                        <div className="rounded-[28px] bg-white shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]">
                            {recentHomework.length > 0 ? (
                                recentHomework
                                    .slice(0, 4)
                                    .map((item, index) => (
                                        <HomeworkRow
                                            key={`${item.title}-${index}`}
                                            item={item}
                                            isLast={
                                                index ===
                                                Math.min(
                                                    recentHomework.length,
                                                    4,
                                                ) -
                                                    1
                                            }
                                        />
                                    ))
                            ) : (
                                <EmptyLine
                                    icon={BookOpenCheck}
                                    text="No homework has been assigned yet."
                                />
                            )}
                        </div>
                    </section>
                </div>
            </main>
            <SchoolAppInstallBanner />
        </>
    );
}

function MetricPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
            <p className="text-lg font-black">{value}</p>
            <p className="text-[10px] font-black tracking-[0.08em] text-white/55 uppercase">
                {label}
            </p>
        </div>
    );
}

function QuickAction({
    href,
    icon: Icon,
    label,
}: {
    href: NonNullable<InertiaLinkProps['href']>;
    icon: LucideIcon;
    label: string;
}) {
    return (
        <Link
            href={href}
            className="flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-[26px] bg-white text-center text-xs font-black text-[#203631] shadow-[0_14px_34px_rgba(16,32,28,0.06)] ring-1 ring-[#e4ebe6] transition active:scale-[0.97]"
        >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eaf8f2] text-[#0e9f7c]">
                <Icon size={20} />
            </span>
            <span>{label}</span>
        </Link>
    );
}

function SectionTitle({ title, action }: { title: string; action: string }) {
    return (
        <div className="mt-7 mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[#10201c]">{title}</h2>
            <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-[11px] font-black text-[#64736e]">
                {action}
            </span>
        </div>
    );
}

function SkillBar({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-black">
                <span className="text-[#64736e]">{label}</span>
                <span className={gradeTone(value)}>{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e9efeb]">
                <div
                    className="h-full rounded-full bg-[#0e9f7c]"
                    style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
                />
            </div>
        </div>
    );
}

function HomeworkRow({ item, isLast }: { item: Homework; isLast: boolean }) {
    const statusClass = statusClasses[item.status] ?? statusClasses.pending;

    return (
        <div
            className={`flex items-center gap-3 p-4 ${isLast ? '' : 'border-b border-[#edf2ee]'}`}
        >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff5df] text-[#c27a00]">
                <BookOpenCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#10201c]">
                    {item.title}
                </p>
                <p className="mt-1 text-xs font-bold text-[#7b8c86]">
                    Due {formatDate(item.due)}
                    {item.score !== null
                        ? ` / ${item.score}/${item.points}`
                        : ''}
                </p>
            </div>
            <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ${statusClass}`}
            >
                {item.status}
            </span>
        </div>
    );
}

function EmptyLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex items-center gap-3 p-4 text-sm font-bold text-[#64736e]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef5f0] text-[#6a7b75]">
                <Icon size={19} />
            </span>
            <span>{text}</span>
        </div>
    );
}
