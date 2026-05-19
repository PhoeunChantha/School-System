import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { Link } from '@inertiajs/react';
import {
    BarChart2,
    Bell,
    BookOpen,
    CalendarCheck,
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
    unpaidFees: number;
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
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, href: '/student/attendance', bg: '#dcfce7', color: '#059669' },
    { id: 'grades',     label: 'Grades',     icon: BarChart2,     href: '/student/grades',     bg: '#dbeafe', color: '#2563eb' },
    { id: 'homework',   label: 'Homework',   icon: BookOpen,      href: '/student/homework',   bg: '#fef3c7', color: '#d97706' },
    { id: 'fees',       label: 'Fees',       icon: CreditCard,    href: '/student/fees',       bg: '#fee2e2', color: '#e11d48' },
    { id: 'exams',      label: 'Exams',      icon: FileText,      href: '/student/exams',      bg: '#ede9fe', color: '#7c3aed' },
    { id: 'notif',      label: 'Alerts',     icon: Bell,          href: '/student/notifications', bg: '#ffedd5', color: '#ea580c' },
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

export default function StudentDashboard({ profile, stats, recentGrades, recentHomework, upcomingExams }: Props) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <StudentShell profile={profile} activePage="dashboard" title="Home">
            {/* ── Hero ── */}
            <div className="s-hero s-fade-up">
                <div className="s-hero-greeting">{greeting}</div>
                <div className="s-hero-name">{profile.name || 'Student'}</div>
                <div className="s-hero-meta">
                    {profile.level && <span>{profile.level}</span>}
                    {profile.level && profile.className && <span className="s-hero-dot" />}
                    {profile.className && <span>{profile.className}</span>}
                    {!profile.level && !profile.className && <span>Welcome back</span>}
                </div>

                {profile.photo ? (
                    <img src={profile.photo} alt="" className="s-hero-photo" />
                ) : (
                    <div className="s-hero-initials">
                        {profile.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
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
                        color="#059669"
                        style={{ position: 'absolute', top: 14, right: 14, opacity: 0.18 }}
                    />
                    <div className="s-stat-value" style={{ color: '#059669' }}>
                        {stats.attendanceRate}%
                    </div>
                    <div className="s-stat-label">Attendance</div>
                </div>

                {/* Average Grade */}
                <div className="s-stat-card">
                    <Star
                        size={28}
                        color="#2563eb"
                        style={{ position: 'absolute', top: 14, right: 14, opacity: 0.18 }}
                    />
                    <div className="s-stat-value" style={{ color: '#2563eb' }}>
                        {stats.latestAverage}
                    </div>
                    <div className="s-stat-label">Avg Grade</div>
                </div>

                {/* Homework */}
                <div className="s-stat-card">
                    <BookOpen
                        size={28}
                        color="#d97706"
                        style={{ position: 'absolute', top: 14, right: 14, opacity: 0.18 }}
                    />
                    <div className="s-stat-value" style={{ color: '#d97706' }}>
                        {stats.homeworkSubmitted}
                    </div>
                    <div className="s-stat-label">HW Done</div>
                </div>

                {/* Unpaid Fees */}
                <div className="s-stat-card">
                    <CreditCard
                        size={28}
                        color={stats.unpaidFees > 0 ? '#e11d48' : '#059669'}
                        style={{ position: 'absolute', top: 14, right: 14, opacity: 0.18 }}
                    />
                    <div
                        className="s-stat-value"
                        style={{ color: stats.unpaidFees > 0 ? '#e11d48' : '#059669' }}
                    >
                        {stats.unpaidFees}
                    </div>
                    <div className="s-stat-label">Unpaid Fees</div>
                </div>
            </div>

            {/* ── Quick Access ── */}
            <div className="s-section-header s-fade-up s-delay-2">Quick Access</div>
            <div className="s-quick-grid s-fade-up s-delay-2">
                {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link key={link.id} href={link.href} className="s-quick-item">
                            <div className="s-quick-icon" style={{ background: link.bg }}>
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
                        <Link href="/student/grades" className="s-section-link">
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
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {[
                                                { label: 'Speaking', val: grade.speaking },
                                                { label: 'Listening', val: grade.listening },
                                                { label: 'Reading', val: grade.reading },
                                                { label: 'Writing', val: grade.writing },
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
                                                    <span style={{ color: '#1a1a2e' }}>
                                                        {' '}{skill.val}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'DM Serif Display, serif',
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
                        <Link href="/student/homework" className="s-section-link">
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span className={`s-badge ${statusBadge(hw.status)}`}>{hw.status}</span>
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
            {upcomingExams.length > 0 && (
                <>
                    <div className="s-section-header s-fade-up s-delay-5">
                        Upcoming Exams
                        <Link href="/student/exams" className="s-section-link">
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
            {recentGrades.length === 0 && recentHomework.length === 0 && upcomingExams.length === 0 && (
                <div className="s-card s-fade-up s-delay-3" style={{ marginTop: 16 }}>
                    <div className="s-empty">
                        <span className="s-empty-icon">📚</span>
                        <div className="s-empty-text">Your school data will appear here</div>
                    </div>
                </div>
            )}
        </StudentShell>
    );
}
