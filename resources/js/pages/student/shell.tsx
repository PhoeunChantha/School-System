import { SchoolAppInstallBanner } from '@/components/school-app-install-banner';
import { useStudentDomTranslations } from '@/hooks/use-student-dom-translations';
import { useStudentTranslation } from '@/hooks/use-student-translation';
import '@/pages/student/student.css';
import { logout } from '@/routes';
import { manifest, serviceWorker } from '@/routes/school-app';
import {
    attendance,
    attendanceCalendar,
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
import { publicKey as pushPublicKey } from '@/routes/student/push-notifications/index';
import { store as storePushSubscription } from '@/routes/student/push-notifications/subscriptions/index';
import type { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    Award,
    BarChart2,
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
import {
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
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

interface PushPublicKeyResponse {
    configured: boolean;
    publicKey: string | null;
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
    showOnline = false,
}: {
    photo: string | null;
    name: string;
    size: number;
    showOnline?: boolean;
}) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const avatar = photo ? (
        <img
            src={photo}
            alt={name}
            className="s-avatar"
            style={{ width: size, height: size, fontSize: size * 0.36 }}
        />
    ) : (
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

    if (!showOnline) {
        return avatar;
    }

    return (
        <span className="s-avatar-wrap" style={{ width: size, height: size }}>
            {avatar}
            <span
                className="s-avatar-online-dot"
                aria-label="Student portal is open"
            />
        </span>
    );
}

export { SAvatar };

function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

function urlBase64ToUint8Array(value: string) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

async function registerStudentPushSubscription() {
    if (
        !window.isSecureContext ||
        !('Notification' in window) ||
        !('PushManager' in window)
    ) {
        return;
    }

    const keyResponse = await fetch(pushPublicKey.url(), {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });

    if (!keyResponse.ok) {
        return;
    }

    const { configured, publicKey } =
        (await keyResponse.json()) as PushPublicKeyResponse;

    if (!configured || !publicKey || Notification.permission === 'denied') {
        return;
    }

    const permission =
        Notification.permission === 'granted'
            ? 'granted'
            : await Notification.requestPermission();

    if (permission !== 'granted') {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription =
        await registration.pushManager.getSubscription();
    const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

    await fetch(storePushSubscription.url(), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(subscription.toJSON()),
    });
}

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

    const { notificationSound, school } = usePage<SharedData>().props;
    const { lang, setLang, t } = useStudentTranslation();
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
    const [unreadNotifications, setUnreadNotifications] = useState(
        profile.unreadNotifications ?? 0,
    );
    const [moreOpen, setMoreOpen] = useState(false);
    const [moreMounted, setMoreMounted] = useState(false);
    const moreCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const openMore = useCallback(() => {
        if (moreCloseTimerRef.current) {
            clearTimeout(moreCloseTimerRef.current);
        }

        setMoreMounted(true);
        requestAnimationFrame(() => setMoreOpen(true));
    }, []);

    const closeMore = useCallback(() => {
        setMoreOpen(false);
        moreCloseTimerRef.current = setTimeout(
            () => setMoreMounted(false),
            280,
        );
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        navigator.serviceWorker
            .register(serviceWorker.url(), { scope: '/' })
            .then(() => registerStudentPushSubscription())
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        setUnreadNotifications(profile.unreadNotifications ?? 0);
    }, [profile.unreadNotifications]);

    useEffect(() => {
        notificationSoundRef.current = notificationSound
            ? new Audio(notificationSound)
            : null;
    }, [notificationSound]);

    useEffect(() => {
        if (!moreMounted) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeMore();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [closeMore, moreMounted]);

    useEffect(
        () => () => {
            if (moreCloseTimerRef.current) {
                clearTimeout(moreCloseTimerRef.current);
            }
        },
        [],
    );

    const handleRealtimeNotification = useCallback(
        (event: StudentNotificationEvent) => {
            setUnreadNotifications(event.unreadNotifications);

            if (notificationSoundRef.current) {
                notificationSoundRef.current.currentTime = 0;
                notificationSoundRef.current.play().catch(() => undefined);
            }

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
            <Head title={title}>
                <link
                    head-key="student-pwa-manifest"
                    rel="manifest"
                    href={manifest.url()}
                />
                <meta
                    head-key="student-pwa-theme-color"
                    name="theme-color"
                    content="#009c7f"
                />
                <meta
                    head-key="student-pwa-mobile-web-app-capable"
                    name="mobile-web-app-capable"
                    content="yes"
                />
                <meta
                    head-key="student-pwa-apple-mobile-web-app-capable"
                    name="apple-mobile-web-app-capable"
                    content="yes"
                />
                <meta
                    head-key="student-pwa-apple-mobile-web-app-title"
                    name="apple-mobile-web-app-title"
                    content={`${school.nameEn} Student`}
                />
                <link
                    head-key="student-pwa-apple-touch-icon"
                    rel="apple-touch-icon"
                    href={
                        school.logo ?? school.favicon ?? '/apple-touch-icon.png'
                    }
                />
            </Head>
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
                        showOnline
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
                        className={`student-icon-btn${activePage === 'notifications' ? ' active' : ''}`}
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
                    onClick={openMore}
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
                                MORE_ITEMS.some(
                                    (item) => item.id === activePage,
                                )
                                    ? '#ffffff'
                                    : '#71809a'
                            }
                        />
                    </div>
                    <span className="snb-label">More</span>
                </button>
            </nav>

            {moreMounted && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="More student actions"
                    onClick={closeMore}
                    className={`student-more-backdrop${moreOpen ? 'open' : ''}`}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="student-more-sheet"
                    >
                        <div
                            className="student-more-handle"
                            aria-hidden="true"
                        />
                        <div className="student-more-header">
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
                                onClick={closeMore}
                                className="student-more-close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="student-more-list">
                            {MORE_ITEMS.map((item, index) => {
                                const Icon = item.icon;
                                const active = item.id === activePage;

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={closeMore}
                                        className={`student-more-item${active ? 'active' : ''}`}
                                        style={{
                                            animationDelay: `${90 + index * 42}ms`,
                                        }}
                                    >
                                        <span className="student-more-item-icon">
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
                                className="student-more-logout"
                                style={{
                                    animationDelay: `${90 + MORE_ITEMS.length * 42}ms`,
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
            <SchoolAppInstallBanner />
        </div>
    );
}
