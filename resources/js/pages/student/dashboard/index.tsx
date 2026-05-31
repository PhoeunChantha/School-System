import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import {
    attendance,
    classSchedule,
    exams,
    fees,
    grades,
    homework,
    notifications,
} from '@/routes/student';
import { Link } from '@inertiajs/react';
import {
    Award,
    BarChart2,
    Bell,
    BookOpen,
    CalendarCheck,
    CalendarDays,
    CreditCard,
    FileText,
    Star,
    TrendingUp,
} from 'lucide-react';

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

interface Fee {
    month: string;
    amount: number;
    paid: number;
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
    profile: StudentProfile;
    stats: Stats;
    recentGrades: Grade[];
    recentHomework: Homework[];
    recentFees: Fee[];
    upcomingExams: Exam[];
}

const QUICK_LINKS = [
    {
        id: 'attendance',
        label: 'Attendance',
        icon: CalendarCheck,
        href: attendance(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
    {
        id: 'grades',
        label: 'Grades',
        icon: BarChart2,
        href: grades(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
    {
        id: 'homework',
        label: 'Homework',
        icon: BookOpen,
        href: homework(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
    {
        id: 'exams',
        label: 'Exams',
        icon: FileText,
        href: exams(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
    {
        id: 'notif',
        label: 'Alerts',
        icon: Bell,
        href: notifications(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
    {
        id: 'schedule',
        label: 'Schedule',
        icon: CalendarDays,
        href: classSchedule(),
        bg: '#ecfdf8',
        color: '#009c7f',
    },
];

function gradeColor(avg: number) {
    if (avg >= 80) return '#059669';
    if (avg >= 60) return '#2563eb';
    if (avg >= 40) return '#d97706';
    return '#e11d48';
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        submitted: 's-badge-blue',
        graded: 's-badge-green',
        late: 's-badge-orange',
        missing: 's-badge-red',
    };
    return map[status] ?? 's-badge-gray';
}

function feeStatusBadge(status: string) {
    if (status === 'paid') return 's-badge-green';
    if (status === 'partial') return 's-badge-amber';
    return 's-badge-red';
}

function formatCurrency(n: number) {
    return '$' + n.toFixed(2);
}

function formatDate(d: string) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(d: string) {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `${diff}d`;
}

export default function StudentDashboard({
    profile,
    stats,
    recentGrades,
    recentHomework,
    recentFees,
    upcomingExams,
}: Props) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
              ? 'Good afternoon'
              : 'Good evening';
    const classSummary = [profile.level, profile.className]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(' · ');

    return (
        <StudentShell profile={profile} activePage="dashboard" title="Home">
            {/* ── Hero ── */}
            <div className="s-hero s-fade-up">
                <div className="s-hero-greeting">{greeting}</div>
                <div className="s-hero-name">Study overview</div>
                <div className="s-hero-meta">
                    <span>{classSummary || 'Your latest school progress'}</span>
                </div>

                {profile.photo ? (
                    <img src={profile.photo} alt="" className="s-hero-photo" />
                ) : (
                    <div className="s-hero-initials">
                        {profile.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 1)
                            .join('')
                            .toUpperCase() || '?'}
                    </div>
                )}
            </div>

            {/* ── Stats ── */}
            <div className="s-stat-grid s-fade-up s-delay-1">
                {/* Attendance */}
                <div className="s-stat-card">
                    <CalendarCheck
                        size={28}
                        className="s-stat-icon"
                        color="#009c7f"
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            opacity: 0.18,
                        }}
                    />
                    <div className="s-stat-value" style={{ color: '#071827' }}>
                        {stats.attendanceRate}%
                    </div>
                    <div className="s-stat-label">Attendance</div>
                </div>

                {/* Average Grade */}
                <div className="s-stat-card">
                    <Star
                        size={28}
                        color="#009c7f"
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            opacity: 0.18,
                        }}
                    />
                    <div className="s-stat-value" style={{ color: '#071827' }}>
                        {stats.latestAverage}
                    </div>
                    <div className="s-stat-label">Average</div>
                </div>

                {/* Homework */}
                <div className="s-stat-card">
                    <BookOpen
                        size={28}
                        color="#009c7f"
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            opacity: 0.18,
                        }}
                    />
                    <div className="s-stat-value" style={{ color: '#071827' }}>
                        {stats.homeworkSubmitted}
                    </div>
                    <div className="s-stat-label">Homework</div>
                </div>

                {/* Certificates */}
                <div className="s-stat-card">
                    <Award
                        size={28}
                        color="#009c7f"
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            opacity: 0.18,
                        }}
                    />
                    <div
                        className="s-stat-value"
                        style={{
                            color: '#071827',
                        }}
                    >
                        {stats.certificatesIssued}
                    </div>
                    <div className="s-stat-label">Certificates</div>
                </div>
            </div>

            {/* ── Quick Access ── */}
            <div className="s-section-header s-fade-up s-delay-2">
                Quick Access
            </div>
            <div className="s-quick-grid s-fade-up s-delay-2">
                {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.id}
                            href={link.href}
                            className="s-quick-item"
                        >
                            <div
                                className="s-quick-icon"
                                style={{ background: link.bg }}
                            >
                                <Icon size={20} color={link.color} />
                            </div>
                            <span className="s-quick-label">{link.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* ── Recent Grades ── */}
            {recentGrades.length > 0 && (
                <>
                    <div className="s-section-header s-fade-up s-delay-3">
                        Recent Grades
                        <Link href={grades()} className="s-section-link">
                            See all
                        </Link>
                    </div>
                    <div className="s-card s-fade-up s-delay-3">
                        {recentGrades.map((grade, i) => {
                            const avg = grade.average;
                            const color = gradeColor(avg);
                            return (
                                <div key={i} className="s-list-item">
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 14,
                                            background: color + '1a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <TrendingUp size={18} color={color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#1a1a2e',
                                                marginBottom: 6,
                                            }}
                                        >
                                            {grade.period}
                                        </div>
                                        <div
                                            style={{ display: 'flex', gap: 12 }}
                                        >
                                            {[
                                                {
                                                    label: 'Speaking',
                                                    val: grade.speaking,
                                                },
                                                {
                                                    label: 'Listening',
                                                    val: grade.listening,
                                                },
                                                {
                                                    label: 'Reading',
                                                    val: grade.reading,
                                                },
                                                {
                                                    label: 'Writing',
                                                    val: grade.writing,
                                                },
                                            ].map((skill) => (
                                                <div
                                                    key={skill.label}
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#9ca3af',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {skill.label[0]}
                                                    <span
                                                        style={{
                                                            color: '#1a1a2e',
                                                        }}
                                                    >
                                                        {' '}
                                                        {skill.val}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 20,
                                            fontFamily:
                                                'DM Serif Display, serif',
                                            color,
                                            fontWeight: 400,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {avg}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── Recent Homework ── */}
            {recentHomework.length > 0 && (
                <>
                    <div className="s-section-header s-fade-up s-delay-4">
                        Recent Homework
                        <Link href={homework()} className="s-section-link">
                            See all
                        </Link>
                    </div>
                    <div className="s-card s-fade-up s-delay-4">
                        {recentHomework.map((hw, i) => (
                            <div key={i} className="s-list-item">
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 14,
                                        background: '#fef3c7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <BookOpen size={18} color="#d97706" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {hw.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#9ca3af',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Due {formatDate(hw.due)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: 4,
                                    }}
                                >
                                    <span
                                        className={`s-badge ${statusBadge(hw.status)}`}
                                    >
                                        {hw.status}
                                    </span>
                                    {hw.score !== null && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#6b7280',
                                            }}
                                        >
                                            {hw.score}/{hw.points}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Upcoming Exams ── */}
            {recentFees.length > 0 && (
                <>
                    <div className="s-section-header s-fade-up s-delay-5">
                        Fee Status
                        <Link href={fees()} className="s-section-link">
                            See all
                        </Link>
                    </div>
                    <div className="s-card s-fade-up s-delay-5">
                        {recentFees.map((fee, i) => (
                            <div
                                key={`${fee.month}-${i}`}
                                className="s-list-item"
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 14,
                                        background:
                                            fee.status === 'paid'
                                                ? '#dcfce7'
                                                : '#fee2e2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <CreditCard
                                        size={18}
                                        color={
                                            fee.status === 'paid'
                                                ? '#059669'
                                                : '#e11d48'
                                        }
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                        }}
                                    >
                                        {fee.month}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#9ca3af',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Paid {formatCurrency(fee.paid)} of{' '}
                                        {formatCurrency(fee.amount)}
                                    </div>
                                </div>
                                <span
                                    className={`s-badge ${feeStatusBadge(fee.status)}`}
                                >
                                    {fee.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {upcomingExams.length > 0 && (
                <>
                    <div className="s-section-header s-fade-up s-delay-5">
                        Upcoming Exams
                        <Link href={exams()} className="s-section-link">
                            See all
                        </Link>
                    </div>
                    <div className="s-card s-fade-up s-delay-5">
                        {upcomingExams.map((exam, i) => (
                            <div key={i} className="s-list-item">
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 14,
                                        background: '#ede9fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <FileText size={18} color="#7c3aed" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                        }}
                                    >
                                        {exam.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#9ca3af',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {exam.subject && `${exam.subject} · `}
                                        {exam.duration}min
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#7c3aed',
                                        flexShrink: 0,
                                        textAlign: 'right',
                                    }}
                                >
                                    {daysUntil(exam.date)}
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: '#9ca3af',
                                            fontWeight: 500,
                                            marginTop: 2,
                                        }}
                                    >
                                        {formatDate(exam.date)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty state when no data */}
            {recentGrades.length === 0 &&
                recentHomework.length === 0 &&
                recentFees.length === 0 &&
                upcomingExams.length === 0 && (
                    <div
                        className="s-card s-fade-up s-delay-3"
                        style={{ marginTop: 16 }}
                    >
                        <div className="s-empty">
                            <span className="s-empty-icon">📚</span>
                            <div className="s-empty-text">
                                Your school data will appear here
                            </div>
                        </div>
                    </div>
                )}
        </StudentShell>
    );
}
