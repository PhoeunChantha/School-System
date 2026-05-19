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
import { useAdminDomTranslations } from '@/hooks/use-admin-dom-translations';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import { cn } from '@/lib/utils';
import '@/pages/admin/admin.css';
import { Avatar, KH } from '@/pages/admin/ui';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Award,
    Bell,
    BookOpen,
    Building2,
    ChartNoAxesColumn,
    ClipboardCheck,
    CreditCard,
    FileText,
    GraduationCap,
    History,
    Home,
    Layers3,
    LogOut,
    Medal,
    Menu,
    Moon,
    NotebookPen,
    PanelLeftClose,
    Receipt,
    PanelLeftOpen,
    School,
    ScrollText,
    Send,
    Settings,
    ShieldCheck,
    Star,
    Sun,
    UserCog,
    Users,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

interface NavGroup {
    groupKey: string;
}
interface NavItem {
    id: string;
    icon: LucideIcon;
    labelKey: string;
    href: string;
}
type NavEntry = NavGroup | NavItem;
const isItem = (e: NavEntry): e is NavItem => 'id' in e;

const NAV_PERMISSIONS: Record<string, string[]> = {
    dashboard: ['dashboard.view'],
    students: ['students.view'],
    teachers: ['teachers.view'],
    classes: ['classes.view'],
    levels: ['levels.view'],
    attendance: ['attendance.view'],
    grades: ['grades.view'],
    homework: ['homework.view'],
    'lesson-plans': ['lesson-plans.view'],
    'homework-submissions': ['homework-submissions.view'],
    fee: ['fee.view'],
    expenses: ['expenses.view'],
    exam: ['exam.view'],
    'exam-results': ['exam-results.view'],
    reports: ['reports.view'],
    certs: ['certificates.view'],
    'honor-roll': ['honor-roll.view'],
    notifications: ['notifications.view'],
    'activity-logs': ['activity-logs.view'],
    users: ['users.view'],
    'roles-permissions': ['roles.view', 'permissions.view'],
    settings: ['settings.view'],
};

const LOCKED_NAV_ITEMS = new Set(['dashboard']);

const NAV: NavEntry[] = [
    { groupKey: 'main' },
    {
        id: 'dashboard',
        icon: Home,
        labelKey: 'dashboard',
        href: '/admin/dashboard',
    },
    {
        id: 'students',
        icon: Users,
        labelKey: 'students',
        href: '/admin/students',
    },
    {
        id: 'teachers',
        icon: GraduationCap,
        labelKey: 'teachers',
        href: '/admin/teachers',
    },
    {
        id: 'classes',
        icon: School,
        labelKey: 'classes',
        href: '/admin/classes',
    },
    {
        id: 'levels',
        icon: Layers3,
        labelKey: 'levels',
        href: '/admin/levels',
    },
    { groupKey: 'teaching' },
    {
        id: 'attendance',
        icon: ClipboardCheck,
        labelKey: 'attendance',
        href: '/admin/attendance',
    },
    {
        id: 'grades',
        icon: Star,
        labelKey: 'grades',
        href: '/admin/grades',
    },
    {
        id: 'homework',
        icon: NotebookPen,
        labelKey: 'homework',
        href: '/admin/homework',
    },
    {
        id: 'lesson-plans',
        icon: BookOpen,
        labelKey: 'lesson-plans',
        href: '/admin/lesson-plans',
    },
    {
        id: 'homework-submissions',
        icon: Send,
        labelKey: 'homework-submissions',
        href: '/admin/homework-submissions',
    },
    { groupKey: 'finance' },
    {
        id: 'fee',
        icon: CreditCard,
        labelKey: 'fee',
        href: '/admin/fee',
    },
    {
        id: 'expenses',
        icon: Receipt,
        labelKey: 'expenses',
        href: '/admin/expenses',
    },
    { groupKey: 'exam' },
    {
        id: 'exam',
        icon: FileText,
        labelKey: 'exam',
        href: '/admin/exam',
    },
    {
        id: 'exam-results',
        icon: ScrollText,
        labelKey: 'exam-results',
        href: '/admin/exam-results',
    },
    { groupKey: 'reports' },
    {
        id: 'reports',
        icon: ChartNoAxesColumn,
        labelKey: 'reports',
        href: '/admin/reports',
    },
    {
        id: 'certs',
        icon: Award,
        labelKey: 'certs',
        href: '/admin/certs',
    },
    {
        id: 'honor-roll',
        icon: Medal,
        labelKey: 'honor-roll',
        href: '/admin/honor-roll',
    },
    { groupKey: 'other' },
    {
        id: 'notifications',
        icon: Bell,
        labelKey: 'notifications',
        href: '/admin/notifications',
    },
    {
        id: 'activity-logs',
        icon: History,
        labelKey: 'activity-logs',
        href: '/admin/activity-logs',
    },
    {
        id: 'users',
        icon: UserCog,
        labelKey: 'users',
        href: '/admin/users',
    },
    {
        id: 'roles-permissions',
        icon: ShieldCheck,
        labelKey: 'roles-permissions',
        href: '/admin/roles-permissions',
    },
    {
        id: 'settings',
        icon: Settings,
        labelKey: 'settings',
        href: '/admin/settings',
    },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
    dashboard: 'dashboard',
    students: 'students',
    teachers: 'teachers',
    classes: 'classes',
    levels: 'levels',
    attendance: 'attendance',
    grades: 'grades',
    homework: 'homework',
    'lesson-plans': 'lesson-plans',
    'homework-submissions': 'homework-submissions',
    fee: 'fee',
    expenses: 'expenses',
    exam: 'exam',
    'exam-results': 'exam-results',
    reports: 'reports',
    certs: 'certs',
    'honor-roll': 'honor-roll',
    notifications: 'notifications',
    'activity-logs': 'activity-logs',
    users: 'users',
    'roles-permissions': 'roles-permissions',
    settings: 'settings',
};

function normalizeAdminPath(path: string): string {
    const cleanPath = path.split(/[?#]/)[0]?.replace(/\/+$/, '');

    return cleanPath || '/';
}

function isNavItemActive(currentPath: string, item: NavItem): boolean {
    const itemPath = normalizeAdminPath(item.href);

    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

interface AdminShellProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user;
    const school = props.school;
    const { lang, setLang, t } = useAdminTranslation();
    useAdminDomTranslations();
    const [hiddenNavItems, setHiddenNavItems] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = window.localStorage.getItem('admin-sidebar-hidden');
            return new Set(
                (stored ? JSON.parse(stored) : []).filter(
                    (id: string) => !LOCKED_NAV_ITEMS.has(id),
                ),
            );
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        const handler = () => {
            try {
                const stored = window.localStorage.getItem(
                    'admin-sidebar-hidden',
                );
                setHiddenNavItems(
                    new Set(
                        (stored ? JSON.parse(stored) : []).filter(
                            (id: string) => !LOCKED_NAV_ITEMS.has(id),
                        ),
                    ),
                );
            } catch {
                setHiddenNavItems(new Set());
            }
        };
        window.addEventListener('sidebar-hidden-change', handler);
        return () =>
            window.removeEventListener('sidebar-hidden-change', handler);
    }, []);
    const permissionSet = useMemo(
        () => new Set(props.auth?.permissions ?? []),
        [props.auth?.permissions],
    );
    const canAccess = useCallback(
        (id: string) => {
            if (LOCKED_NAV_ITEMS.has(id)) {
                return true;
            }

            return (NAV_PERMISSIONS[id] ?? []).every((permission) =>
                permissionSet.has(permission),
            );
        },
        [permissionSet],
    );
    const visibleNav = NAV.reduce<{
        entries: NavEntry[];
        pendingGroup: NavGroup | null;
    }>(
        (state, entry) => {
            if (!isItem(entry)) {
                return { ...state, pendingGroup: entry };
            }

            if (
                !canAccess(entry.id) ||
                (!LOCKED_NAV_ITEMS.has(entry.id) &&
                    hiddenNavItems.has(entry.id))
            ) {
                return state;
            }

            return {
                entries: [
                    ...state.entries,
                    ...(state.pendingGroup ? [state.pendingGroup] : []),
                    entry,
                ],
                pendingGroup: null,
            };
        },
        { entries: [], pendingGroup: null },
    ).entries;
    const visibleMobileNav = visibleNav.filter(isItem);
    const currentPath = normalizeAdminPath(url);
    const activeItem =
        visibleMobileNav.find((item) => isNavItemActive(currentPath, item)) ??
        visibleMobileNav.find((item) => item.id === 'dashboard');
    const active = activeItem?.id ?? 'dashboard';
    const activeMobileNavRef = useRef<HTMLAnchorElement | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const stored = window.localStorage.getItem('admin-theme');

        if (stored) {
            return stored === 'dark';
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        document.querySelector('.admin-wrap')?.classList.toggle('dark', dark);
        document.documentElement.classList.toggle('dark', dark);
        window.localStorage.setItem('admin-theme', dark ? 'dark' : 'light');
    }, [dark]);

    useEffect(() => {
        const activeMobileNav = activeMobileNavRef.current;

        if (!activeMobileNav || typeof window === 'undefined') {
            return;
        }

        if (!window.matchMedia('(max-width: 768px)').matches) {
            return;
        }

        window.requestAnimationFrame(() => {
            activeMobileNav.scrollIntoView({
                block: 'nearest',
                inline: 'center',
            });
        });
    }, [active, visibleMobileNav.length]);

    const titleKey = PAGE_TITLE_KEYS[active] ?? PAGE_TITLE_KEYS.dashboard;

    return (
        <div
            className="admin-wrap"
            style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
        >
            <Head title={t(`nav_items.${titleKey}`)}>
                {school?.favicon && <link rel="icon" href={school.favicon} />}
            </Head>

            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    style={{ display: 'block' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                style={{
                    position: mobileOpen ? 'fixed' : 'relative',
                    inset: mobileOpen ? '0 auto 0 0' : undefined,
                    zIndex: mobileOpen ? 40 : 1,
                }}
            >
                <nav
                    className={cn(
                        'sidebar',
                        collapsed && 'collapsed',
                        mobileOpen && 'mobile-open',
                    )}
                >
                    <div className="sidebar-logo">
                        {school?.logo ? (
                            <img
                                src={school.logo}
                                alt="School logo"
                                style={{
                                    height: 34,
                                    maxWidth: 120,
                                    objectFit: 'contain',
                                    borderRadius: 4,
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    background:
                                        'linear-gradient(135deg,#3b82f6,#6366f1)',
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Building2
                                    size={18}
                                    color="white"
                                    strokeWidth={2.4}
                                />
                            </div>
                        )}
                        {!collapsed && (
                            <div>
                                <div
                                    style={{
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: 15,
                                        fontFamily:
                                            "'Noto Sans Khmer',sans-serif",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {school?.nameEn ?? 'Frania'}
                                </div>
                                <div
                                    style={{
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: 10,
                                    }}
                                >
                                    {t('ui.school_system')}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setCollapsed((c) => !c)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                padding: '4px',
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            aria-label={
                                collapsed
                                    ? t('ui.expand_sidebar')
                                    : t('ui.collapse_sidebar')
                            }
                        >
                            {collapsed ? (
                                <PanelLeftOpen size={17} />
                            ) : (
                                <PanelLeftClose size={17} />
                            )}
                        </button>
                    </div>

                    <div className="sidebar-nav">
                        {visibleNav.map((entry, i) => {
                            if (isItem(entry)) {
                                const Icon = entry.icon;

                                return (
                                    <Link
                                        key={entry.id}
                                        href={entry.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            'nav-item',
                                            active === entry.id && 'active',
                                        )}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            width: '100%',
                                            minHeight: 40,
                                        }}
                                        title={
                                            collapsed
                                                ? t(
                                                      `nav_items.${entry.labelKey}`,
                                                  )
                                                : ''
                                        }
                                    >
                                        <span
                                            className="nav-icon"
                                            style={{
                                                flexShrink: 0,
                                                width: 20,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon size={18} strokeWidth={2.2} />
                                        </span>
                                        {!collapsed && (
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily:
                                                            "'Noto Sans Khmer',sans-serif",
                                                    }}
                                                >
                                                    {t(
                                                        `nav_items.${entry.labelKey}`,
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            }

                            return !collapsed ? (
                                <div key={i} className="nav-group-title">
                                    {t(`nav_groups.${entry.groupKey}`)}
                                </div>
                            ) : null;
                        })}
                    </div>

                    <div
                        style={{
                            padding: '12px 16px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Avatar name={user?.name ?? 'Admin'} size={32} />
                        {!collapsed && (
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily:
                                            "'Noto Sans Khmer',sans-serif",
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {user?.name ?? 'Admin'}
                                </div>
                                <div
                                    style={{
                                        color: 'rgba(255,255,255,0.35)',
                                        fontSize: 10,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {user?.email ?? 'Administrator'}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* Main area */}
            <div
                className="admin-body"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minWidth: 0,
                }}
            >
                <div className="topbar">
                    <button
                        className="mobile-only"
                        onClick={() => setMobileOpen((o) => !o)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px',
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label={t('ui.toggle_navigation')}
                    >
                        <Menu size={22} />
                    </button>

                    <div style={{ flex: 1 }}>
                        <KH
                            style={{
                                fontWeight: 800,
                                fontSize: 18,
                                color: '#1e293b',
                                display: 'block',
                                lineHeight: 1.2,
                            }}
                        >
                            {t(`nav_items.${titleKey}`)}
                        </KH>
                    </div>

                    {/* Lang toggle */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 2,
                            background: '#f1f5f9',
                            borderRadius: 8,
                            padding: 2,
                            flexShrink: 0,
                        }}
                    >
                        {(['kh', 'en'] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    background:
                                        lang === l ? 'white' : 'transparent',
                                    color: lang === l ? '#2563eb' : '#94a3b8',
                                    boxShadow:
                                        lang === l
                                            ? '0 1px 3px rgba(0,0,0,0.08)'
                                            : 'none',
                                }}
                            >
                                {l === 'kh' ? 'ខ្មែរ' : 'EN'}
                            </button>
                        ))}
                    </div>

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDark((d) => !d)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                        }}
                        title={t('ui.toggle_dark_mode')}
                    >
                        {dark ? <Sun size={19} /> : <Moon size={19} />}
                    </button>

                    <button
                        style={{
                            position: 'relative',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label={t('ui.notifications')}
                    >
                        <Bell size={20} />
                        <span
                            style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                width: 16,
                                height: 16,
                                background: '#ef4444',
                                borderRadius: '50%',
                                color: 'white',
                                fontSize: 9,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            3
                        </span>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px 8px',
                                    borderRadius: 10,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        '#f1f5f9')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'none')
                                }
                            >
                                <Avatar
                                    name={user?.name ?? 'Admin'}
                                    size={34}
                                />
                                <div
                                    className="desktop-only"
                                    style={{ minWidth: 0, textAlign: 'left' }}
                                >
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 140,
                                        }}
                                    >
                                        {user?.name ?? 'Admin'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 140,
                                        }}
                                    >
                                        {user?.email ?? 'Administrator'}
                                    </div>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-2 py-2">
                                    <Avatar
                                        name={user?.name ?? 'Admin'}
                                        size={32}
                                    />
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {user?.name ?? 'Admin'}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#94a3b8',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {user?.email ?? 'Administrator'}
                                        </div>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={editProfile()}
                                        prefetch
                                        className="flex w-full cursor-pointer items-center"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        {t('ui.settings')}
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={logout()}
                                    as="button"
                                    className="flex w-full cursor-pointer items-center !text-red-600 focus:!text-red-600"
                                    onClick={() => router.flushAll()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t('ui.logout')}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <main
                    className="main-content"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}
                >
                    {children}
                </main>
                <AdminFooter
                    labels={{
                        schoolName: t('footer.school_name'),
                        schoolSystem: t('footer.school_system'),
                        copyright: t('footer.copyright', {
                            year: new Date().getFullYear(),
                        }),
                        help: t('footer.help'),
                        privacy: t('footer.privacy'),
                        version: t('footer.version'),
                    }}
                />
            </div>

            {/* Mobile bottom nav */}
            <div className="mobile-bottom-nav">
                {visibleMobileNav.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            ref={
                                active === item.id
                                    ? activeMobileNavRef
                                    : undefined
                            }
                            className={cn(
                                'mob-nav-btn',
                                active === item.id && 'active',
                            )}
                        >
                            <span
                                className="mni"
                                style={{
                                    opacity: active === item.id ? 1 : 0.45,
                                }}
                            >
                                <Icon size={22} strokeWidth={2.2} />
                            </span>
                            <KH
                                className="mnl"
                                style={{
                                    color:
                                        active === item.id
                                            ? '#eaf2ff'
                                            : '#b8c2d8',
                                }}
                            >
                                {t(`nav_items.${item.labelKey}`)}
                            </KH>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
