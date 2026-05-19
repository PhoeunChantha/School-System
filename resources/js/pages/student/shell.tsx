import { Head, Link } from '@inertiajs/react';
import { BarChart2, Bell, BookOpen, CreditCard, Home, CalendarCheck } from 'lucide-react';
import { type ReactNode } from 'react';
import '@/pages/student/student.css';

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
    { id: 'dashboard',  label: 'Home',    icon: Home,         href: '/student/dashboard',  color: '#4f46e5' },
    { id: 'attendance', label: 'Attend.',  icon: CalendarCheck,href: '/student/attendance', color: '#059669' },
    { id: 'grades',     label: 'Grades',  icon: BarChart2,    href: '/student/grades',     color: '#2563eb' },
    { id: 'homework',   label: 'Homework',icon: BookOpen,     href: '/student/homework',   color: '#d97706' },
    { id: 'fees',       label: 'Fees',    icon: CreditCard,   href: '/student/fees',       color: '#e11d48' },
] as const;

function SAvatar({ photo, name, size }: { photo: string | null; name: string; size: number }) {
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

export default function StudentShell({ profile, activePage, title, children }: Props) {
    return (
        <div className="student-wrap">
            <Head title={title} />

            {/* ── Header ── */}
            <header className="student-header">
                <Link
                    href="/student/dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                >
                    <SAvatar photo={profile.photo} name={profile.name} size={36} />
                    <div>
                        <div className="student-header-name">{profile.name || 'Student'}</div>
                        <div className="student-header-class">
                            {profile.className || profile.level || 'Student Portal'}
                        </div>
                    </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link
                        href="/student/notifications"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                                activePage === 'notifications'
                                    ? '#ea580c'
                                    : 'rgba(26,26,46,0.08)',
                            color: activePage === 'notifications' ? 'white' : '#6b7280',
                            textDecoration: 'none',
                            transition: 'background 0.18s',
                        }}
                    >
                        <Bell size={16} />
                    </Link>
                    <Link href="/student/profile" style={{ textDecoration: 'none' }}>
                        <SAvatar photo={profile.photo} name={profile.name} size={36} />
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
                            className={`student-nav-btn${active ? ' active' : ''}`}
                        >
                            <div
                                className="snb-icon"
                                style={
                                    active
                                        ? { background: item.color + '26' }
                                        : undefined
                                }
                            >
                                <Icon
                                    size={18}
                                    color={active ? item.color : 'rgba(255,255,255,0.3)'}
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
