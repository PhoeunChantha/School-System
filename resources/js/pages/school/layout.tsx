import type { Dispatch, SetStateAction } from 'react';
import type { Role, Screen, Lang } from './data';
import { KH, Avatar } from './ui';

// ── Nav definitions ──
interface NavGroup { group: string; }
interface NavItem  { id: Screen; icon: string; label: string; sub: string; }
type NavEntry = NavGroup | NavItem;
const isItem = (e: NavEntry): e is NavItem => 'id' in e;

const navByRole: Record<Role, NavEntry[]> = {
    admin: [
        { group: 'ទំព័រដើម / Main' },
        { id: 'dashboard',  icon: '🏠',   label: 'ទំព័រដើម',   sub: 'Dashboard' },
        { id: 'students',   icon: '👥',   label: 'សិស្ស',      sub: 'Students' },
        { id: 'teachers',   icon: '👩‍🏫',  label: 'គ្រូ',        sub: 'Teachers' },
        { id: 'classes',    icon: '🏫',   label: 'ថ្នាក់',      sub: 'Classes' },
        { group: 'ការបង្រៀន / Teaching' },
        { id: 'attendance', icon: '📋',   label: 'វត្តមាន',    sub: 'Attendance' },
        { id: 'grades',     icon: '⭐',   label: 'ពិន្ទុ',      sub: 'Grades' },
        { id: 'homework',   icon: '📝',   label: 'កិច្ចការ',    sub: 'Homework' },
        { group: 'ហិរញ្ញ / Finance' },
        { id: 'fees',       icon: '💳',   label: 'ការទូទាត់',  sub: 'Fees' },
    ],
    teacher: [
        { group: 'ទំព័រដើម' },
        { id: 'dashboard',  icon: '🏠', label: 'ទំព័រដើម', sub: 'Dashboard' },
        { id: 'attendance', icon: '📋', label: 'វត្តមាន',  sub: 'Attendance' },
        { id: 'students',   icon: '👥', label: 'សិស្ស',    sub: 'Students' },
        { group: 'ការបង្រៀន' },
        { id: 'grades',     icon: '⭐', label: 'ពិន្ទុ',    sub: 'Grades' },
        { id: 'homework',   icon: '📝', label: 'កិច្ចការ',  sub: 'Homework' },
    ],
    student: [
        { group: 'ទំព័រដើម' },
        { id: 'dashboard', icon: '🏠', label: 'ទំព័រដើម',  sub: 'Dashboard' },
        { id: 'grades',    icon: '⭐', label: 'ពិន្ទុ',     sub: 'My Grades' },
        { id: 'homework',  icon: '📝', label: 'កិច្ចការ',   sub: 'Homework' },
        { id: 'fees',      icon: '💳', label: 'ការទូទាត់', sub: 'Fees' },
    ],
    parent: [
        { group: 'ទំព័រដើម' },
        { id: 'dashboard', icon: '🏠', label: 'ទំព័រដើម',  sub: 'Dashboard' },
        { id: 'grades',    icon: '⭐', label: 'ពិន្ទុ',     sub: 'Grades' },
        { id: 'fees',      icon: '💳', label: 'ការទូទាត់', sub: 'Fees' },
    ],
};

// ── Sidebar ──
interface SidebarProps {
    role: Role;
    screen: Screen;
    setScreen: (s: Screen) => void;
    collapsed: boolean;
    setCollapsed: Dispatch<SetStateAction<boolean>>;
}
export function Sidebar({ role, screen, setScreen, collapsed, setCollapsed }: SidebarProps) {
    const items = navByRole[role];
    const names: Record<Role, string> = { admin: 'Admin User', teacher: 'Mr. Vuthy', student: 'Sokh Dara', parent: 'Parent' };
    const labels: Record<Role, string> = { admin: 'Admin', teacher: 'គ្រូ វុទ្ធី', student: 'សុខ ដារា', parent: 'មាតាបិតា' };

    return (
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
                {items.map((item, i) =>
                    isItem(item) ? (
                        <button key={item.id} onClick={() => setScreen(item.id)}
                            className={`nav-item${screen === item.id ? ' active' : ''}`}
                            title={collapsed ? item.sub : ''}>
                            <span className="nav-icon">{item.icon}</span>
                            {!collapsed && (
                                <div>
                                    <div style={{ fontSize: 12, fontFamily: "'Noto Sans Khmer',sans-serif" }}>{item.label}</div>
                                    <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.sub}</div>
                                </div>
                            )}
                        </button>
                    ) : (
                        !collapsed ? <div key={i} className="nav-group-title">{item.group}</div> : null
                    )
                )}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={names[role]} size={32} />
                {!collapsed && (
                    <div>
                        <div style={{ color: 'white', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Khmer',sans-serif" }}>{labels[role]}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'capitalize' }}>{role}</div>
                    </div>
                )}
            </div>
        </nav>
    );
}

// ── Top bar ──
interface TopBarProps {
    screen: Screen;
    role: Role;
    setRole: (r: Role) => void;
    lang: Lang;
    setLang: Dispatch<SetStateAction<Lang>>;
    setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
}
export function TopBar({ screen, role, setRole, lang, setLang, setMobileNavOpen }: TopBarProps) {
    const titles: Record<Screen, { kh: string; en: string }> = {
        dashboard:  { kh: 'ទំព័រដើម',      en: 'Dashboard' },
        students:   { kh: 'សិស្ស',          en: 'Students' },
        teachers:   { kh: 'គ្រូបង្រៀន',     en: 'Teachers' },
        classes:    { kh: 'ថ្នាក់',          en: 'Classes' },
        attendance: { kh: 'វត្តមាន',        en: 'Attendance' },
        grades:     { kh: 'ពិន្ទុ',          en: 'Grades' },
        homework:   { kh: 'កិច្ចការ',        en: 'Homework' },
        fees:       { kh: 'ការទូទាត់',       en: 'Fees' },
        addStudent: { kh: 'បន្ថែមសិស្ស',    en: 'Add Student' },
    };
    const t = titles[screen];

    return (
        <div className="topbar">
            <button className="mobile-only" onClick={() => setMobileNavOpen(o => !o)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', padding: '4px', flexShrink: 0 }}>☰</button>

            <div style={{ flex: 1 }}>
                <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block', lineHeight: 1.2 }}>{t.kh}</KH>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.en}</div>
            </div>

            {/* Role switcher */}
            <div className="desktop-only" style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
                {(['admin', 'teacher', 'student', 'parent'] as Role[]).map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.15s', background: role === r ? 'white' : 'transparent', color: role === r ? '#2563eb' : '#94a3b8', boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{r}</button>
                ))}
            </div>

            {/* Lang toggle */}
            <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
                {(['kh', 'en'] as Lang[]).map(l => (
                    <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s', background: lang === l ? 'white' : 'transparent', color: lang === l ? '#2563eb' : '#94a3b8' }}>
                        {l === 'kh' ? 'ខ្មែរ' : 'EN'}
                    </button>
                ))}
            </div>

            {/* Notification */}
            <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </button>
        </div>
    );
}

// ── Mobile bottom nav ──
interface MobileNavProps { role: Role; screen: Screen; setScreen: (s: Screen) => void; }
export function MobileNav({ role, screen, setScreen }: MobileNavProps) {
    const navMap: Record<Role, { id: Screen; icon: string; lk: string }[]> = {
        admin:   [{ id: 'dashboard', icon: '🏠', lk: 'ទំព័រ' }, { id: 'students',   icon: '👥', lk: 'សិស្ស' }, { id: 'attendance', icon: '📋', lk: 'វត្តមាន' }, { id: 'fees', icon: '💳', lk: 'ថ្លៃ' }],
        teacher: [{ id: 'dashboard', icon: '🏠', lk: 'ទំព័រ' }, { id: 'attendance', icon: '📋', lk: 'វត្តមាន' }, { id: 'students',   icon: '👥', lk: 'សិស្ស' }, { id: 'homework', icon: '📝', lk: 'ការងារ' }],
        student: [{ id: 'dashboard', icon: '🏠', lk: 'ទំព័រ' }, { id: 'grades',     icon: '⭐', lk: 'ពិន្ទុ'   }, { id: 'homework',   icon: '📝', lk: 'ការងារ' }, { id: 'fees', icon: '💳', lk: 'ថ្លៃ' }],
        parent:  [{ id: 'dashboard', icon: '🏠', lk: 'ទំព័រ' }, { id: 'grades',     icon: '⭐', lk: 'ពិន្ទុ'   }, { id: 'fees',       icon: '💳', lk: 'ថ្លៃ' }],
    };
    return (
        <div className="mobile-bottom-nav">
            {navMap[role].map(item => (
                <button key={item.id} onClick={() => setScreen(item.id)} className={`mob-nav-btn${screen === item.id ? ' active' : ''}`}>
                    <span className="mni" style={{ opacity: screen === item.id ? 1 : 0.45 }}>{item.icon}</span>
                    <KH className="mnl" style={{ color: screen === item.id ? '#2563eb' : '#94a3b8' }}>{item.lk}</KH>
                </button>
            ))}
        </div>
    );
}
