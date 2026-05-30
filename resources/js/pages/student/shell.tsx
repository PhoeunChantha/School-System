import '@/pages/student/student.css';
import { useStudentDomTranslations } from '@/hooks/use-student-dom-translations';
import { useStudentTranslation } from '@/hooks/use-student-translation';
import {
    attendanceCalendar,
    attendance,
    certificates,
    classSchedule,
    dashboard,
    examResults,
    grades,
    homework,
    homeworkCalendar,
    idCard,
    learningMaterials,
    notifications,
    profile as studentProfile,
} from '@/routes/student';
import { logout } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    BarChart2,
    Award,
    Bell,
    BookOpen,
    CalendarCheck,
    CalendarDays,
    FileBadge,
    FileText,
    Home,
    IdCard,
    Library,
    LogOut,
    MoreHorizontal,
    X,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface StudentProfile {
    studentId?: number | null;
    name: string;
    nameKh: string;
    code: string;
    photo: string | null;
    className: string;
    level: string;
    gender: string;
    unreadNotifications?: number;
}

export type ActivePage =
    | 'dashboard'
    | 'attendance'
    | 'grades'
    | 'homework'
    | 'fees'
    | 'exams'
    | 'exam-results'
    | 'class-schedule'
    | 'learning-materials'
    | 'attendance-calendar'
    | 'homework-calendar'
    | 'id-card'
    | 'certificates'
    | 'notifications'
    | 'profile';

interface Props {
    profile: StudentProfile;
    activePage: ActivePage;
    title: string;
    children: ReactNode;
}

interface StudentNotificationEvent {
    notification?: {
        title?: string;
        body?: string;
    };
    unreadNotifications: number;
}

const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Home',
        icon: Home,
        href: dashboard(),
    },
    {
        id: 'attendance',
        label: 'Attend.',
        icon: CalendarCheck,
        href: attendance(),
    },
    {
        id: 'grades',
        label: 'Grades',
        icon: BarChart2,
        href: grades(),
    },
    {
        id: 'homework',
        label: 'Homework',
        icon: BookOpen,
        href: homework(),
    },
] as const;

const MORE_ITEMS = [
    {
        id: 'certificates',
        label: 'Certificates',
        description: 'School awards',
        icon: Award,
        href: certificates(),
    },
    {
        id: 'exam-results',
        label: 'Exam Results',
        description: 'Scores and pass/fail',
        icon: FileText,
        href: examResults(),
    },
    {
        id: 'class-schedule',
        label: 'Class Schedule',
        description: 'Weekly timetable',
        icon: CalendarDays,
        href: classSchedule(),
    },
    {
        id: 'learning-materials',
        label: 'Learning Materials',
        description: 'Files and lesson notes',
        icon: Library,
        href: learningMaterials(),
    },
    {
        id: 'attendance-calendar',
        label: 'Attendance Calendar',
        description: 'Present and absent days',
        icon: CalendarCheck,
        href: attendanceCalendar(),
    },
    {
        id: 'homework-calendar',
        label: 'Homework Calendar',
        description: 'Due dates and status',
        icon: BookOpen,
        href: homeworkCalendar(),
    },
    {
        id: 'id-card',
        label: 'Student ID Card',
        description: 'Digital student identity',
        icon: IdCard,
        href: idCard(),
    },
    {
        id: 'notifications',
        label: 'Notifications',
        description: 'School messages',
        icon: Bell,
        href: notifications(),
    },
    {
        id: 'profile',
        label: 'Profile',
        description: 'Personal information',
        icon: FileBadge,
        href: studentProfile(),
    },
] as const;

function SAvatar({
    photo,
    name,
    size,
}: {
    photo: string | null;
    name: string;
    size: number;
}) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (photo) {
        return (
            <img
                src={photo}
                alt={name}
                className="s-avatar"
                style={{ width: size, height: size, fontSize: size * 0.36 }}
            />
        );
    }

    return (
        <div
            className="s-avatar"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.36,
                background: '#e8e5e0',
                color: '#6b7280',
            }}
        >
            {initials}
        </div>
    );
}

export { SAvatar };

function StudentRealtimeNotifications({
    activePage,
    onNotification,
    studentId,
}: {
    activePage: ActivePage;
    onNotification: (event: StudentNotificationEvent) => void;
    studentId: number;
}) {
    useEcho<StudentNotificationEvent>(
        `students.${studentId}`,
        '.student.notification.created',
        (event) => {
            onNotification(event);

            if (activePage === 'notifications') {
                router.reload({ only: ['profile', 'notifications'] });
            }
        },
        [activePage, onNotification],
    );

    return null;
}

export default function StudentShell({
    profile,
    activePage,
    title,
    children,
}: Props) {
    useStudentDomTranslations();

    const { lang, setLang, t } = useStudentTranslation();
    const [unreadNotifications, setUnreadNotifications] = useState(
        profile.unreadNotifications ?? 0,
    );
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        setUnreadNotifications(profile.unreadNotifications ?? 0);
    }, [profile.unreadNotifications]);

    const handleRealtimeNotification = useCallback(
        (event: StudentNotificationEvent) => {
            setUnreadNotifications(event.unreadNotifications);

            toast.info(
                event.notification?.title ?? t('content_text.New message'),
                {
                    description:
                        event.notification?.body ??
                        t('content_text.You have a new school notification.'),
                },
            );
        },
        [t],
    );

    return (
        <div className="student-wrap">
            <Head title={title} />
            {profile.studentId ? (
                <StudentRealtimeNotifications
                    activePage={activePage}
                    onNotification={handleRealtimeNotification}
                    studentId={profile.studentId}
                />
            ) : null}

            {/* ── Header ── */}
            <header className="student-header">
                <Link
                    href={studentProfile()}
                    className="student-header-profile"
                    aria-label="Open profile"
                >
                    <SAvatar
                        photo={profile.photo}
                        name={profile.name}
                        size={42}
                    />
                    <div>
                        <div className="student-header-eyebrow">
                            Welcome back
                        </div>
                        <div
                            className="student-header-name"
                            data-no-translate="true"
                        >
                            {profile.name || t('content_text.Student')}
                        </div>
                    </div>
                </Link>

                <div className="student-header-actions">
                    <div
                        className="student-language-toggle"
                        aria-label="Switch language"
                        data-no-translate="true"
                    >
                        {(['kh', 'en'] as const).map((language) => (
                            <button
                                key={language}
                                type="button"
                                className={lang === language ? 'active' : ''}
                                onClick={() => setLang(language)}
                            >
                                {language === 'kh' ? 'ខ្មែរ' : 'EN'}
                            </button>
                        ))}
                    </div>
                    <Link
                        href={notifications()}
                        aria-label="Open notifications"
                        className={`student-icon-btn${activePage === 'notifications' ? 'active' : ''}`}
                    >
                        <Bell size={16} />
                        {unreadNotifications > 0 && (
                            <span className="student-notification-dot">
                                {Math.min(unreadNotifications, 9)}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="student-main">{children}</main>

            {/* ── Bottom nav ── */}
            <nav className="student-bottom-nav">
                {NAV_ITEMS.map((item) => {
                    const active = item.id === activePage;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={
                                active
                                    ? 'student-nav-btn active'
                                    : 'student-nav-btn'
                            }
                        >
                            <div className="snb-icon">
                                <Icon
                                    size={18}
                                    color={active ? '#ffffff' : '#71809a'}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                            </div>
                            <span className="snb-label">{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    aria-label="Open more student menu"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen(true)}
                    className={
                        MORE_ITEMS.some((item) => item.id === activePage)
                            ? 'student-nav-btn active'
                            : 'student-nav-btn'
                    }
                >
                    <div className="snb-icon">
                        <MoreHorizontal
                            size={18}
                            color={
                                MORE_ITEMS.some((item) => item.id === activePage)
                                    ? '#ffffff'
                                    : '#71809a'
                            }
                        />
                    </div>
                    <span className="snb-label">More</span>
                </button>
            </nav>

            {moreOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="More student actions"
                    onClick={() => setMoreOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 90,
                        background: 'rgba(15, 23, 42, 0.34)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        padding: '18px 14px',
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: 'min(100%, 420px)',
                            maxHeight: 'min(78dvh, 720px)',
                            overflowY: 'auto',
                            borderRadius: 28,
                            background: '#ffffff',
                            boxShadow: '0 24px 60px rgba(15,23,42,0.26)',
                            padding: 16,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <SAvatar
                                    photo={profile.photo}
                                    name={profile.name}
                                    size={42}
                                />
                                <div>
                                    <div
                                        style={{
                                            color: '#0f172a',
                                            fontSize: 14,
                                            fontWeight: 900,
                                        }}
                                    >
                                        {profile.name || 'Student'}
                                    </div>
                                    <div
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: 11,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {profile.className || profile.level}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Close more menu"
                                onClick={() => setMoreOpen(false)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 999,
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gap: 8,
                            }}
                        >
                            {MORE_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = item.id === activePage;

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setMoreOpen(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 14px',
                                            borderRadius: 18,
                                            textDecoration: 'none',
                                            background: active
                                                ? '#eff6ff'
                                                : '#f8fafc',
                                            color: '#0f172a',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: 14,
                                                display: 'grid',
                                                placeItems: 'center',
                                                background: active
                                                    ? '#2563eb'
                                                    : '#e2e8f0',
                                                color: active
                                                    ? '#ffffff'
                                                    : '#64748b',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon size={17} />
                                        </span>
                                        <span style={{ minWidth: 0, flex: 1 }}>
                                            <span
                                                style={{
                                                    display: 'block',
                                                    fontSize: 13,
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {item.label}
                                            </span>
                                            <span
                                                style={{
                                                    display: 'block',
                                                    color: '#94a3b8',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {item.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}

                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                style={{
                                    width: '100%',
                                    marginTop: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 14px',
                                    borderRadius: 18,
                                    border: 'none',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    fontSize: 13,
                                    fontWeight: 900,
                                    textAlign: 'left',
                                }}
                            >
                                <span
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 14,
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: '#fecaca',
                                    }}
                                >
                                    <LogOut size={17} />
                                </span>
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
