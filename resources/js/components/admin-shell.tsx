import '@/pages/admin/admin.css';
import { useEffect, useState, type ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { KH, Avatar } from '@/pages/admin/ui';
import { AdminFooter } from '@/components/admin-footer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import { LogOut, Settings } from 'lucide-react';

interface NavGroup { group: string; }
interface NavItem  { id: string; icon: string; label: string; sub: string; href: string; }
type NavEntry = NavGroup | NavItem;
const isItem = (e: NavEntry): e is NavItem => 'id' in e;

const NAV: NavEntry[] = [
    { group: 'ទំព័រដើម / Main' },
    { id: 'dashboard',  icon: '🏠',  label: 'ទំព័រដើម',  sub: 'Dashboard',  href: '/admin/dashboard' },
    { id: 'students',   icon: '👥',  label: 'សិស្ស',      sub: 'Students',   href: '/admin/students' },
    { id: 'teachers',   icon: '👩‍🏫', label: 'គ្រូ',        sub: 'Teachers',   href: '/admin/teachers' },
    { id: 'classes',    icon: '🏫',  label: 'ថ្នាក់',      sub: 'Classes',    href: '/admin/classes' },
    { id: 'levels',     icon: '🎓',  label: 'កម្រិត',      sub: 'Levels',     href: '/admin/levels' },
    { group: 'ការបង្រៀន / Teaching' },
    { id: 'attendance', icon: '📋',  label: 'វត្តមាន',    sub: 'Attendance', href: '/admin/attendance' },
    { id: 'grades',     icon: '⭐',  label: 'ពិន្ទុ',      sub: 'Grades',     href: '/admin/grades' },
    { id: 'homework',   icon: '📝',  label: 'កិច្ចការ',    sub: 'Homework',   href: '/admin/homework' },
    { id: 'homework-submissions', icon: 'S', label: 'Submissions', sub: 'Homework Submissions', href: '/admin/homework-submissions' },
    { group: 'ហិរញ្ញ / Finance' },
    { id: 'fee',        icon: '💳',  label: 'ការទូទាត់',  sub: 'Fees',       href: '/admin/fee' },
    { group: 'ការប្រឡង / Exam' },
    { id: 'exam',          icon: '📄',  label: 'ប្រឡង',         sub: 'Exams',          href: '/admin/exam' },
    { id: 'exam-results',  icon: '🧾',  label: 'លទ្ធផល',       sub: 'Exam Results',   href: '/admin/exam-results' },
    { group: 'រាយការណ៍ / Reports' },
    { id: 'reports',       icon: '📊',  label: 'រាយការណ៍',       sub: 'Reports',        href: '/admin/reports' },
    { id: 'certs',         icon: '🏆',  label: 'វិញ្ញាបនបត្រ',   sub: 'Certificates',   href: '/admin/certs' },
    { id: 'honor-roll',    icon: '🥇',  label: 'តារាងកិត្តិយស',  sub: 'Honor Roll',     href: '/admin/honor-roll' },
    { group: 'ផ្សេងៗ / Other' },
    { id: 'notifications', icon: '🔔',  label: 'ការជូនដំណឹង',   sub: 'Notifications',  href: '/admin/notifications' },
    { id: 'activity-logs', icon: '📜',  label: 'កត់ត្រា',       sub: 'Activity Logs',  href: '/admin/activity-logs' },
    { id: 'settings',      icon: '⚙️',  label: 'កំណត់',           sub: 'Settings',       href: '/admin/settings' },
];

const MOBILE_NAV = [
    { id: 'dashboard',  icon: '🏠', lk: 'ទំព័រ',  href: '/admin/dashboard' },
    { id: 'students',   icon: '👥', lk: 'សិស្ស',   href: '/admin/students' },
    { id: 'attendance', icon: '📋', lk: 'វត្តមាន', href: '/admin/attendance' },
    { id: 'fee',        icon: '💳', lk: 'ថ្លៃ',    href: '/admin/fee' },
    { id: 'exam',       icon: '📄', lk: 'ប្រឡង',  href: '/admin/exam' },
];

const PAGE_TITLES: Record<string, { kh: string; en: string }> = {
    dashboard:  { kh: 'ទំព័រដើម',    en: 'Dashboard' },
    students:   { kh: 'សិស្ស',        en: 'Students' },
    teachers:   { kh: 'គ្រូបង្រៀន',   en: 'Teachers' },
    classes:    { kh: 'ថ្នាក់',        en: 'Classes' },
    levels:     { kh: 'កម្រិត',       en: 'Levels' },
    attendance: { kh: 'វត្តមាន',      en: 'Attendance' },
    grades:     { kh: 'ពិន្ទុ',        en: 'Grades' },
    homework:   { kh: 'កិច្ចការ',      en: 'Homework' },
    'homework-submissions': { kh: 'Homework Submissions', en: 'Homework Submissions' },
    fee:           { kh: 'ការទូទាត់',    en: 'Fees' },
    exam:          { kh: 'ប្រឡង',        en: 'Exams' },
    'exam-results': { kh: 'លទ្ធផលប្រឡង', en: 'Exam Results' },
    reports:       { kh: 'រាយការណ៍',    en: 'Reports' },
    certs:         { kh: 'វិញ្ញាបនបត្រ', en: 'Certificates' },
    'honor-roll':  { kh: 'តារាងកិត្តិយស', en: 'Honor Roll' },
    notifications: { kh: 'ការជូនដំណឹង', en: 'Notifications' },
    'activity-logs': { kh: 'កត់ត្រាសកម្មភាព', en: 'Activity Logs' },
    settings:      { kh: 'កំណត់',        en: 'Settings' },
};

interface AdminShellProps { children: ReactNode; }

export default function AdminShell({ children }: AdminShellProps) {
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [lang, setLang] = useState<'kh' | 'en'>('kh');
    const [dark, setDark] = useState(false);

    useEffect(() => {
        document.querySelector('.admin-wrap')?.classList.toggle('dark', dark);
    }, [dark]);

    const segments = url.split('/').filter(Boolean);
    const active = segments[1] ?? 'dashboard';
    const title = PAGE_TITLES[active] ?? PAGE_TITLES['dashboard'];

    return (
        <div className="admin-wrap" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Head title={title.en} />

            {mobileOpen && (
                <div className="sidebar-overlay" style={{ display: 'block' }} onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <div style={{ position: mobileOpen ? 'fixed' : 'relative', inset: mobileOpen ? '0 auto 0 0' : undefined, zIndex: mobileOpen ? 40 : 1 }}>
                <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
                    <div className="sidebar-logo">
                        <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏫</div>
                        {!collapsed && (
                            <div>
                                <div style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: "'Noto Sans Khmer',sans-serif", lineHeight: 1.2 }}>Frania</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>School System</div>
                            </div>
                        )}
                        <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, padding: '4px', flexShrink: 0 }}>
                            {collapsed ? '→' : '←'}
                        </button>
                    </div>

                    <div className="sidebar-nav">
                        {NAV.map((entry, i) =>
                            isItem(entry) ? (
                                <Link key={entry.id} href={entry.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`nav-item${active === entry.id ? ' active' : ''}`}
                                    title={collapsed ? entry.sub : ''}>
                                    <span className="nav-icon">{entry.icon}</span>
                                    {!collapsed && (
                                        <div>
                                            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Khmer',sans-serif" }}>{entry.label}</div>
                                            <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{entry.sub}</div>
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                !collapsed ? <div key={i} className="nav-group-title">{entry.group}</div> : null
                            )
                        )}
                    </div>

                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={user?.name ?? 'Admin'} size={32} />
                        {!collapsed && (
                            <div style={{ minWidth: 0 }}>
                                <div style={{ color: 'white', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Khmer',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'Admin'}</div>
                                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? 'Administrator'}</div>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <div className="topbar">
                    <button className="mobile-only" onClick={() => setMobileOpen(o => !o)}
                        style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', padding: '4px', flexShrink: 0 }}>☰</button>

                    <div style={{ flex: 1 }}>
                        <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block', lineHeight: 1.2 }}>{title.kh}</KH>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{title.en}</div>
                    </div>

                    {/* Lang toggle */}
                    <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 2, flexShrink: 0 }}>
                        {(['kh', 'en'] as const).map(l => (
                            <button key={l} onClick={() => setLang(l)}
                                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s', background: lang === l ? 'white' : 'transparent', color: lang === l ? '#2563eb' : '#94a3b8', boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                                {l === 'kh' ? 'ខ្មែរ' : 'EN'}
                            </button>
                        ))}
                    </div>

                    {/* Dark mode toggle */}
                    <button onClick={() => setDark(d => !d)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', fontSize: 18, flexShrink: 0 }}
                        title="Toggle dark mode">
                        {dark ? '☀️' : '🌙'}
                    </button>

                    <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                        <span style={{ fontSize: 20 }}>🔔</span>
                        <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 10, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Avatar name={user?.name ?? 'Admin'} size={34} />
                                <div className="desktop-only" style={{ minWidth: 0, textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{user?.name ?? 'Admin'}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{user?.email ?? 'Administrator'}</div>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-2 py-2">
                                    <Avatar name={user?.name ?? 'Admin'} size={32} />
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'Admin'}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? 'Administrator'}</div>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link href={editProfile()} prefetch className="flex w-full cursor-pointer items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={logout()} as="button" className="flex w-full cursor-pointer items-center !text-red-600 focus:!text-red-600"
                                    onClick={() => router.flushAll()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <main className="main-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {children}
                </main>
                <AdminFooter />
            </div>

            {/* Mobile bottom nav */}
            <div className="mobile-bottom-nav">
                {MOBILE_NAV.map(item => (
                    <Link key={item.id} href={item.href} className={`mob-nav-btn${active === item.id ? ' active' : ''}`}>
                        <span className="mni" style={{ opacity: active === item.id ? 1 : 0.45 }}>{item.icon}</span>
                        <KH className="mnl" style={{ color: active === item.id ? '#2563eb' : '#94a3b8' }}>{item.lk}</KH>
                    </Link>
                ))}
            </div>
        </div>
    );
}
