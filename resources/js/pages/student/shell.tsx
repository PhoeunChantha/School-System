import '@/pages/student/student.css';
import {
    attendance,
    dashboard,
    fees,
    grades,
    homework,
    notifications,
    profile as studentProfile,
} from '@/routes/student';
import { Head, Link } from '@inertiajs/react';
import {
    BarChart2,
    Bell,
    BookOpen,
    CalendarCheck,
    ChevronDown,
    CreditCard,
    GraduationCap,
    Home,
} from 'lucide-react';
import { type ReactNode } from 'react';

export interface StudentProfile {
    name: string;
    nameKh: string;
    code: string;
    photo: string | null;
    className: string;
    level: string;
    gender: string;
}

export type ActivePage =
    | 'dashboard'
    | 'attendance'
    | 'grades'
    | 'homework'
    | 'fees'
    | 'exams'
    | 'notifications'
    | 'profile';

interface Props {
    profile: StudentProfile;
    activePage: ActivePage;
    title: string;
    children: ReactNode;
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
    {
        id: 'fees',
        label: 'Fees',
        icon: CreditCard,
        href: fees(),
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

export default function StudentShell({
    profile,
    activePage,
    title,
    children,
}: Props) {
    return (
        <div className="student-wrap">
            <Head title={title} />

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
                        <div className="student-header-name">
                            {profile.name || 'Student'}
                        </div>
                    </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(profile.className || profile.level) && (
                        <Link
                            href={dashboard()}
                            className="student-context-pill"
                            aria-label="Current class"
                        >
                            <GraduationCap size={13} />
                            <span>{profile.className || profile.level}</span>
                            <ChevronDown size={13} />
                        </Link>
                    )}
                    <Link
                        href={notifications()}
                        aria-label="Open notifications"
                        className={`student-icon-btn${activePage === 'notifications' ? 'active' : ''}`}
                    >
                        <Bell size={16} />
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
            </nav>
        </div>
    );
}
