import {
    update,
    uploadImage,
} from '@/actions/App/Http/Controllers/Backends/SchoolSettingController';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import AppearanceToggleTab from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AdminShell from '@/pages/admin/shell';
import { KH } from '@/pages/admin/ui';
import { disable, enable } from '@/routes/two-factor';
import { send } from '@/routes/verification';
import type { SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    CreditCard,
    KeyRound,
    Palette,
    PanelLeft,
    Save,
    School,
    ShieldBan,
    ShieldCheck,
    Upload,
    User,
    X,
} from 'lucide-react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type SettingsTab =
    | 'school'
    | 'fees'
    | 'classes'
    | 'notifications'
    | 'sidebar'
    | 'appearance'
    | 'profile'
    | 'password'
    | 'two-factor';

interface SchoolSettings {
    nameKh: string;
    nameEn: string;
    address: string;
    phone: string;
    email: string;
    telegram: string;
    principal: string;
    founded: string;
    logo: string | null;
    favicon: string | null;
    loginBg: string | null;
}

interface LevelFeeSetting {
    level: string;
    fee: number;
}

interface FeeSettings {
    levelFees: LevelFeeSetting[];
    lateFee: string;
    dueDay: string;
}

interface ScheduleSetting {
    label: string;
    time: string;
    room: string;
    days: string;
}

interface ClassSettings {
    schedule: ScheduleSetting[];
}

interface NotificationSettings {
    attendanceAlert: boolean;
    lowAttendanceThreshold: string;
    feeReminder: boolean;
    feeReminderDays: string;
    homeworkDue: boolean;
    systemUpdates: boolean;
}

interface SettingsPageProps {
    settings: {
        school: SchoolSettings;
        fees: FeeSettings;
        classes: ClassSettings;
        notifications: NotificationSettings;
    };
    mustVerifyEmail?: boolean;
    profileStatus?: string;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
}

const tabs: { id: SettingsTab; label: string; icon: ElementType }[] = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'fees', label: 'Fee Settings', icon: CreditCard },
    { id: 'classes', label: 'Class Schedule', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sidebar', label: 'Sidebar', icon: PanelLeft },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: KeyRound },
    { id: 'two-factor', label: 'Two-Factor Auth', icon: ShieldCheck },
];

const SIDEBAR_ITEMS: {
    group: string;
    items: { id: string; label: string; sub: string }[];
}[] = [
    {
        group: 'ទំព័រដើម / Main',
        items: [
            { id: 'dashboard', label: 'ទំព័រដើម', sub: 'Dashboard' },
            { id: 'students', label: 'សិស្ស', sub: 'Students' },
            { id: 'teachers', label: 'គ្រូ', sub: 'Teachers' },
            { id: 'classes', label: 'ថ្នាក់', sub: 'Classes' },
            { id: 'levels', label: 'កម្រិត', sub: 'Levels' },
        ],
    },
    {
        group: 'ការបង្រៀន / Teaching',
        items: [
            { id: 'attendance', label: 'វត្តមាន', sub: 'Attendance' },
            { id: 'grades', label: 'ពិន្ទុ', sub: 'Grades' },
            { id: 'homework', label: 'កិច្ចការ', sub: 'Homework' },
            { id: 'lesson-plans', label: 'Lesson Plans', sub: 'Lesson Plans' },
            {
                id: 'homework-submissions',
                label: 'Submissions',
                sub: 'Homework Submissions',
            },
        ],
    },
    {
        group: 'ហិរញ្ញ / Finance',
        items: [{ id: 'fee', label: 'ការទូទាត់', sub: 'Fees' }],
    },
    {
        group: 'ការប្រឡង / Exam',
        items: [
            { id: 'exam', label: 'ប្រឡង', sub: 'Exams' },
            { id: 'exam-results', label: 'លទ្ធផល', sub: 'Exam Results' },
        ],
    },
    {
        group: 'រាយការណ៍ / Reports',
        items: [
            { id: 'reports', label: 'រាយការណ៍', sub: 'Reports' },
            { id: 'certs', label: 'វិញ្ញាបនបត្រ', sub: 'Certificates' },
            { id: 'honor-roll', label: 'តារាងកិត្តិយស', sub: 'Honor Roll' },
        ],
    },
    {
        group: 'ផ្សេងៗ / Other',
        items: [
            { id: 'notifications', label: 'ការជូនដំណឹង', sub: 'Notifications' },
            { id: 'activity-logs', label: 'កត់ត្រា', sub: 'Activity Logs' },
            { id: 'users', label: 'Users', sub: 'User Accounts' },
            {
                id: 'roles-permissions',
                label: 'Roles',
                sub: 'Roles & Permissions',
            },
        ],
    },
];

const LOCKED_SIDEBAR_ITEMS = new Set(['dashboard']);

export default function SettingsPage({
    settings,
    mustVerifyEmail = false,
    profileStatus,
    twoFactorEnabled = false,
    requiresConfirmation = false,
}: SettingsPageProps) {
    const { props } = usePage<SharedData>();
    const auth = props.auth;
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors: tfaErrors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);
    const permissionSet = useMemo(
        () => new Set(props.auth?.permissions ?? []),
        [props.auth?.permissions],
    );
    const visibleTabs = useMemo(
        () =>
            tabs.filter(
                (t) =>
                    t.id !== 'sidebar' ||
                    permissionSet.has('sidebar.view') ||
                    permissionSet.has('settings.view'),
            ),
        [permissionSet],
    );
    const [tab, setTab] = useState<SettingsTab>('school');
    const [school, setSchool] = useState<SchoolSettings>(settings.school);
    const [fees, setFees] = useState<FeeSettings>(settings.fees);
    const [classes, setClasses] = useState<ClassSettings>(settings.classes);
    const [notifications, setNotifications] = useState<NotificationSettings>(
        settings.notifications,
    );
    const [savingGroup, setSavingGroup] = useState<SettingsTab | null>(null);
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(() => {
        try {
            const stored = window.localStorage.getItem('admin-sidebar-hidden');
            return new Set(stored ? JSON.parse(stored) : []);
        } catch {
            return new Set();
        }
    });

    const toggleSidebarItem = (id: string) => {
        if (LOCKED_SIDEBAR_ITEMS.has(id)) {
            toast.info('Dashboard must stay visible.');

            return;
        }

        setHiddenItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            window.localStorage.setItem(
                'admin-sidebar-hidden',
                JSON.stringify([...next]),
            );
            window.dispatchEvent(new CustomEvent('sidebar-hidden-change'));
            return next;
        });
        toast.success('Sidebar updated.');
    };
    const toUrl = (path: string | null | undefined): string | null => {
        if (!path) return null;
        return path.startsWith('http') || path.startsWith('/')
            ? path
            : `/${path}`;
    };
    const [logoPreview, setLogoPreview] = useState<string | null>(
        toUrl(settings.school.logo),
    );
    const [faviconPreview, setFaviconPreview] = useState<string | null>(
        toUrl(settings.school.favicon),
    );
    const [loginBgPreview, setLoginBgPreview] = useState<string | null>(
        toUrl(settings.school.loginBg),
    );
    const [uploadingType, setUploadingType] = useState<
        'logo' | 'favicon' | 'loginBg' | null
    >(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const loginBgInputRef = useRef<HTMLInputElement>(null);

    const saveGroup = (group: SettingsTab, value: object) => {
        setSavingGroup(group);
        router.put(
            update.url(group),
            { value: value as unknown as string },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Settings saved.'),
                onFinish: () => setSavingGroup(null),
            },
        );
    };

    const handleImageUpload = (
        type: 'logo' | 'favicon' | 'loginBg',
        file: File,
    ) => {
        const previewUrl = URL.createObjectURL(file);
        if (type === 'logo') setLogoPreview(previewUrl);
        else if (type === 'favicon') setFaviconPreview(previewUrl);
        else setLoginBgPreview(previewUrl);

        setUploadingType(type);
        router.post(
            uploadImage.url(),
            { type, image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Login background'} uploaded successfully.`,
                    ),
                onError: () => {
                    if (type === 'logo')
                        setLogoPreview(toUrl(settings.school.logo));
                    else if (type === 'favicon')
                        setFaviconPreview(toUrl(settings.school.favicon));
                    else setLoginBgPreview(toUrl(settings.school.loginBg));
                    toast.error('Upload failed. Please try again.');
                },
                onFinish: () => setUploadingType(null),
            },
        );
    };

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                }}
            >
                <div>
                    <div
                        style={{
                            fontWeight: 800,
                            fontSize: 18,
                            color: '#1e293b',
                        }}
                    >
                        Settings
                    </div>
                    <KH
                        style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            display: 'block',
                        }}
                    >
                        áž€áŸ†ážŽážáŸ‹ Â· System configuration
                    </KH>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 20,
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                    }}
                >
                    <div style={{ width: 210, flexShrink: 0 }}>
                        <div className="card" style={{ padding: 8 }}>
                            {visibleTabs.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setTab(item.id)}
                                        style={tabButton(tab === item.id)}
                                    >
                                        <Icon size={17} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {tab === 'school' && (
                            <SettingsPanel
                                title="School Information"
                                onSave={() => saveGroup('school', school)}
                                saving={savingGroup === 'school'}
                            >
                                <div style={formGrid}>
                                    <Field label="Khmer Name">
                                        <input
                                            style={inputStyle}
                                            value={school.nameKh}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    nameKh: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="English Name">
                                        <input
                                            style={inputStyle}
                                            value={school.nameEn}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    nameEn: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Address" wide>
                                        <input
                                            style={inputStyle}
                                            value={school.address}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    address: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Phone">
                                        <input
                                            style={inputStyle}
                                            type="tel"
                                            value={school.phone}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    phone: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Email">
                                        <input
                                            style={inputStyle}
                                            type="email"
                                            value={school.email}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    email: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Telegram">
                                        <input
                                            style={inputStyle}
                                            value={school.telegram}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    telegram:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Principal">
                                        <input
                                            style={inputStyle}
                                            value={school.principal}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    principal:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Year Founded">
                                        <input
                                            style={inputStyle}
                                            value={school.founded}
                                            onChange={(event) =>
                                                setSchool((current) => ({
                                                    ...current,
                                                    founded: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                </div>

                                {/* Logo & Favicon upload */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 20,
                                        marginBottom: 24,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* Logo */}
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label
                                            style={{
                                                display: 'block',
                                                fontSize: 12,
                                                fontWeight: 800,
                                                color: '#64748b',
                                                marginBottom: 8,
                                            }}
                                        >
                                            School Logo
                                        </label>
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f)
                                                    handleImageUpload(
                                                        'logo',
                                                        f,
                                                    );
                                                e.target.value = '';
                                            }}
                                        />
                                        <div
                                            onClick={() =>
                                                logoInputRef.current?.click()
                                            }
                                            style={{
                                                position: 'relative',
                                                width: '100%',
                                                height: 80,
                                                background: '#f8fafc',
                                                border: '2px dashed #e2e8f0',
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                transition:
                                                    'border-color 0.15s',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    '#3b82f6')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    '#e2e8f0')
                                            }
                                        >
                                            {logoPreview ? (
                                                <>
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        style={{
                                                            maxHeight: 70,
                                                            maxWidth: '90%',
                                                            objectFit:
                                                                'contain',
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLogoPreview(
                                                                null,
                                                            );
                                                        }}
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            background:
                                                                '#ef4444',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                        }}
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    <Upload
                                                        size={20}
                                                        style={{
                                                            margin: '0 auto 4px',
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {uploadingType ===
                                                        'logo'
                                                            ? 'Uploading…'
                                                            : 'Click to upload logo'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                marginTop: 4,
                                            }}
                                        >
                                            Recommended: 300×80 px · PNG/SVG
                                        </div>
                                    </div>

                                    {/* Favicon */}
                                    <div style={{ flex: '0 0 120px' }}>
                                        <label
                                            style={{
                                                display: 'block',
                                                fontSize: 12,
                                                fontWeight: 800,
                                                color: '#64748b',
                                                marginBottom: 8,
                                            }}
                                        >
                                            Favicon
                                        </label>
                                        <input
                                            ref={faviconInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f)
                                                    handleImageUpload(
                                                        'favicon',
                                                        f,
                                                    );
                                                e.target.value = '';
                                            }}
                                        />
                                        <div
                                            onClick={() =>
                                                faviconInputRef.current?.click()
                                            }
                                            style={{
                                                width: 80,
                                                height: 80,
                                                background: '#f8fafc',
                                                border: '2px dashed #e2e8f0',
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                transition:
                                                    'border-color 0.15s',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    '#3b82f6')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    '#e2e8f0')
                                            }
                                        >
                                            {faviconPreview ? (
                                                <img
                                                    src={faviconPreview}
                                                    alt="Favicon preview"
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    <Upload
                                                        size={16}
                                                        style={{
                                                            margin: '0 auto 2px',
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {uploadingType ===
                                                        'favicon'
                                                            ? '…'
                                                            : '.ico'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                marginTop: 4,
                                            }}
                                        >
                                            32×32 px
                                        </div>
                                    </div>
                                </div>

                                {/* Login Background */}
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: '#64748b',
                                            marginBottom: 8,
                                        }}
                                    >
                                        Login Page Background
                                    </label>
                                    <input
                                        ref={loginBgInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f)
                                                handleImageUpload('loginBg', f);
                                            e.target.value = '';
                                        }}
                                    />
                                    <div
                                        onClick={() =>
                                            loginBgInputRef.current?.click()
                                        }
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: 120,
                                            background: '#f8fafc',
                                            border: '2px dashed #e2e8f0',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.borderColor =
                                                '#3b82f6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.borderColor =
                                                '#e2e8f0')
                                        }
                                    >
                                        {loginBgPreview ? (
                                            <>
                                                <img
                                                    src={loginBgPreview}
                                                    alt="Login background preview"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLoginBgPreview(null);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        width: 22,
                                                        height: 22,
                                                        borderRadius: '50%',
                                                        background: '#ef4444',
                                                        border: 'none',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                <Upload
                                                    size={22}
                                                    style={{
                                                        margin: '0 auto 6px',
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {uploadingType === 'loginBg'
                                                        ? 'Uploading…'
                                                        : 'Click to upload background image'}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    Shown behind the login card
                                                    · JPG/PNG/WebP
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'fees' && (
                            <SettingsPanel
                                title="Fee Settings"
                                onSave={() => saveGroup('fees', fees)}
                                saving={savingGroup === 'fees'}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                        marginBottom: 18,
                                    }}
                                >
                                    {fees.levelFees.map((levelFee, index) => (
                                        <div
                                            key={`${levelFee.level}-${index}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 14,
                                                padding: '12px 16px',
                                                background: '#f8fafc',
                                                borderRadius: 10,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 1,
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {levelFee.level}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 800,
                                                    color: '#64748b',
                                                }}
                                            >
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={levelFee.fee}
                                                onChange={(event) =>
                                                    setFees((current) => ({
                                                        ...current,
                                                        levelFees:
                                                            current.levelFees.map(
                                                                (
                                                                    item,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...item,
                                                                              fee: Number(
                                                                                  event
                                                                                      .target
                                                                                      .value,
                                                                              ),
                                                                          }
                                                                        : item,
                                                            ),
                                                    }))
                                                }
                                                style={{
                                                    ...inputStyle,
                                                    width: 86,
                                                    textAlign: 'center',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                / month
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div style={formGrid}>
                                    <Field label="Late Fee">
                                        <input
                                            style={inputStyle}
                                            type="number"
                                            value={fees.lateFee}
                                            onChange={(event) =>
                                                setFees((current) => ({
                                                    ...current,
                                                    lateFee: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Fee Due Day">
                                        <input
                                            style={inputStyle}
                                            type="number"
                                            min="1"
                                            max="28"
                                            value={fees.dueDay}
                                            onChange={(event) =>
                                                setFees((current) => ({
                                                    ...current,
                                                    dueDay: event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'classes' && (
                            <SettingsPanel
                                title="Class Schedule"
                                onSave={() => saveGroup('classes', classes)}
                                saving={savingGroup === 'classes'}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                    }}
                                >
                                    {classes.schedule.map((item, index) => (
                                        <div
                                            key={`${item.label}-${index}`}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                    'minmax(120px,1fr) minmax(120px,1fr) 90px minmax(130px,1fr)',
                                                gap: 12,
                                                alignItems: 'center',
                                                padding: '12px 16px',
                                                background: '#f8fafc',
                                                borderRadius: 10,
                                            }}
                                        >
                                            <input
                                                style={inputStyle}
                                                value={item.label}
                                                onChange={(event) =>
                                                    setClasses((current) =>
                                                        updateSchedule(
                                                            current,
                                                            index,
                                                            'label',
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            <input
                                                style={inputStyle}
                                                value={item.time}
                                                onChange={(event) =>
                                                    setClasses((current) =>
                                                        updateSchedule(
                                                            current,
                                                            index,
                                                            'time',
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            <input
                                                style={inputStyle}
                                                value={item.room}
                                                onChange={(event) =>
                                                    setClasses((current) =>
                                                        updateSchedule(
                                                            current,
                                                            index,
                                                            'room',
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            <input
                                                style={inputStyle}
                                                value={item.days}
                                                onChange={(event) =>
                                                    setClasses((current) =>
                                                        updateSchedule(
                                                            current,
                                                            index,
                                                            'days',
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'sidebar' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Sidebar Visibility
                                </div>
                                <KH
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        display: 'block',
                                        marginBottom: 20,
                                    }}
                                >
                                    Choose which items appear in the navigation
                                    sidebar.
                                </KH>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 24,
                                    }}
                                >
                                    {SIDEBAR_ITEMS.map((group) => (
                                        <div key={group.group}>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    color: '#94a3b8',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                    marginBottom: 8,
                                                }}
                                            >
                                                {group.group}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                }}
                                            >
                                                {group.items.map((item) => {
                                                    const isLocked =
                                                        LOCKED_SIDEBAR_ITEMS.has(
                                                            item.id,
                                                        );

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'space-between',
                                                                padding:
                                                                    '12px 16px',
                                                                background:
                                                                    '#f8fafc',
                                                                borderRadius: 12,
                                                                gap: 12,
                                                            }}
                                                        >
                                                            <div>
                                                                <KH
                                                                    style={{
                                                                        fontWeight: 800,
                                                                        fontSize: 13,
                                                                        display:
                                                                            'block',
                                                                    }}
                                                                >
                                                                    {item.label}
                                                                </KH>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: '#64748b',
                                                                    }}
                                                                >
                                                                    {item.sub}
                                                                    {isLocked
                                                                        ? ' · Always visible'
                                                                        : ''}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isLocked
                                                                }
                                                                onClick={() =>
                                                                    toggleSidebarItem(
                                                                        item.id,
                                                                    )
                                                                }
                                                                style={toggleStyle(
                                                                    isLocked ||
                                                                        !hiddenItems.has(
                                                                            item.id,
                                                                        ),
                                                                    isLocked,
                                                                )}
                                                            >
                                                                <span
                                                                    style={toggleKnobStyle(
                                                                        isLocked ||
                                                                            !hiddenItems.has(
                                                                                item.id,
                                                                            ),
                                                                    )}
                                                                />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{
                                        marginTop: 20,
                                        padding: '10px 14px',
                                        background: '#eff6ff',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        color: '#2563eb',
                                        fontWeight: 600,
                                    }}
                                >
                                    Changes take effect after page reload. Saved
                                    to this browser only.
                                </div>
                            </div>
                        )}

                        {tab === 'appearance' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Appearance
                                </div>
                                <KH
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        display: 'block',
                                        marginBottom: 24,
                                    }}
                                >
                                    Choose your preferred theme for the admin
                                    panel.
                                </KH>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: '#64748b',
                                            marginBottom: 12,
                                        }}
                                    >
                                        Theme
                                    </div>
                                    <AppearanceToggleTab />
                                </div>
                            </div>
                        )}

                        {tab === 'profile' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Profile Information
                                </div>
                                <KH
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        display: 'block',
                                        marginBottom: 24,
                                    }}
                                >
                                    Update your name and email address.
                                </KH>
                                <Form
                                    {...ProfileController.update.form()}
                                    options={{ preserveScroll: true }}
                                    className="space-y-5"
                                >
                                    {({
                                        processing,
                                        recentlySuccessful,
                                        errors,
                                    }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">
                                                    Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    defaultValue={
                                                        auth?.user?.name
                                                    }
                                                    required
                                                    autoComplete="name"
                                                    placeholder="Full name"
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    Email address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    defaultValue={
                                                        auth?.user?.email
                                                    }
                                                    required
                                                    autoComplete="username"
                                                    placeholder="Email address"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>
                                            {mustVerifyEmail &&
                                                auth?.user
                                                    ?.email_verified_at ===
                                                    null && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Your email address
                                                            is unverified.{' '}
                                                            <Link
                                                                href={send()}
                                                                as="button"
                                                                className="text-foreground underline underline-offset-4"
                                                            >
                                                                Resend
                                                                verification
                                                                email.
                                                            </Link>
                                                        </p>
                                                        {profileStatus ===
                                                            'verification-link-sent' && (
                                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                                A new
                                                                verification
                                                                link has been
                                                                sent.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            <div className="flex items-center gap-4">
                                                <Button disabled={processing}>
                                                    Save
                                                </Button>
                                                <Transition
                                                    show={recentlySuccessful}
                                                    enter="transition ease-in-out"
                                                    enterFrom="opacity-0"
                                                    leave="transition ease-in-out"
                                                    leaveTo="opacity-0"
                                                >
                                                    <p className="text-sm text-neutral-600">
                                                        Saved
                                                    </p>
                                                </Transition>
                                            </div>
                                        </>
                                    )}
                                </Form>
                                <div
                                    style={{
                                        marginTop: 28,
                                        paddingTop: 20,
                                        borderTop: '1px solid #f1f5f9',
                                    }}
                                >
                                    <DeleteUser />
                                </div>
                            </div>
                        )}

                        {tab === 'password' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Update Password
                                </div>
                                <KH
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        display: 'block',
                                        marginBottom: 24,
                                    }}
                                >
                                    Ensure your account uses a long, random
                                    password.
                                </KH>
                                <Form
                                    {...PasswordController.update.form()}
                                    options={{ preserveScroll: true }}
                                    resetOnError={[
                                        'password',
                                        'password_confirmation',
                                        'current_password',
                                    ]}
                                    resetOnSuccess
                                    className="space-y-5"
                                >
                                    {({
                                        errors,
                                        processing,
                                        recentlySuccessful,
                                    }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="current_password">
                                                    Current password
                                                </Label>
                                                <Input
                                                    id="current_password"
                                                    name="current_password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="Current password"
                                                />
                                                <InputError
                                                    message={
                                                        errors.current_password
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="new_password">
                                                    New password
                                                </Label>
                                                <Input
                                                    id="new_password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder="New password"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="password_confirmation">
                                                    Confirm password
                                                </Label>
                                                <Input
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder="Confirm password"
                                                />
                                                <InputError
                                                    message={
                                                        errors.password_confirmation
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Button disabled={processing}>
                                                    Save password
                                                </Button>
                                                <Transition
                                                    show={recentlySuccessful}
                                                    enter="transition ease-in-out"
                                                    enterFrom="opacity-0"
                                                    leave="transition ease-in-out"
                                                    leaveTo="opacity-0"
                                                >
                                                    <p className="text-sm text-neutral-600">
                                                        Saved
                                                    </p>
                                                </Transition>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </div>
                        )}

                        {tab === 'two-factor' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Two-Factor Authentication
                                </div>
                                <KH
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        display: 'block',
                                        marginBottom: 24,
                                    }}
                                >
                                    Manage your two-factor authentication
                                    settings.
                                </KH>
                                {twoFactorEnabled ? (
                                    <div className="flex flex-col items-start space-y-4">
                                        <Badge variant="default">Enabled</Badge>
                                        <p className="text-sm text-muted-foreground">
                                            With two-factor authentication
                                            enabled, you will be prompted for a
                                            secure pin during login.
                                        </p>
                                        <TwoFactorRecoveryCodes
                                            recoveryCodesList={
                                                recoveryCodesList
                                            }
                                            fetchRecoveryCodes={
                                                fetchRecoveryCodes
                                            }
                                            errors={tfaErrors}
                                        />
                                        <Form {...disable.form()}>
                                            {({ processing }) => (
                                                <Button
                                                    variant="destructive"
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    <ShieldBan className="mr-2 h-4 w-4" />{' '}
                                                    Disable 2FA
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start space-y-4">
                                        <Badge variant="destructive">
                                            Disabled
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            When enabled, you will be prompted
                                            for a secure pin during login.
                                        </p>
                                        <div>
                                            {hasSetupData ? (
                                                <Button
                                                    onClick={() =>
                                                        setShowSetupModal(true)
                                                    }
                                                >
                                                    <ShieldCheck className="mr-2 h-4 w-4" />{' '}
                                                    Continue Setup
                                                </Button>
                                            ) : (
                                                <Form
                                                    {...enable.form()}
                                                    onSuccess={() =>
                                                        setShowSetupModal(true)
                                                    }
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <ShieldCheck className="mr-2 h-4 w-4" />{' '}
                                                            Enable 2FA
                                                        </Button>
                                                    )}
                                                </Form>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <TwoFactorSetupModal
                                    isOpen={showSetupModal}
                                    onClose={() => setShowSetupModal(false)}
                                    requiresConfirmation={requiresConfirmation}
                                    twoFactorEnabled={twoFactorEnabled}
                                    qrCodeSvg={qrCodeSvg}
                                    manualSetupKey={manualSetupKey}
                                    clearSetupData={clearSetupData}
                                    fetchSetupData={fetchSetupData}
                                    errors={tfaErrors}
                                />
                            </div>
                        )}

                        {tab === 'notifications' && (
                            <SettingsPanel
                                title="Notification Settings"
                                onSave={() =>
                                    saveGroup('notifications', notifications)
                                }
                                saving={savingGroup === 'notifications'}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 14,
                                    }}
                                >
                                    {[
                                        {
                                            key: 'attendanceAlert' as const,
                                            labelKh:
                                                'áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„ážœážáŸ’ážáž˜áž¶áž“',
                                            label: 'Low Attendance Alerts',
                                        },
                                        {
                                            key: 'feeReminder' as const,
                                            labelKh:
                                                'ážšáŸ†áž›áž¹áž€áž€áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹',
                                            label: 'Fee Payment Reminders',
                                        },
                                        {
                                            key: 'homeworkDue' as const,
                                            labelKh:
                                                'áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„áž€áž·áž…áŸ’áž…áž€áž¶ážš',
                                            label: 'Homework Due Alerts',
                                        },
                                        {
                                            key: 'systemUpdates' as const,
                                            labelKh:
                                                'áž€áž¶ážšáž’áŸ’ážœáž¾áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áž—áž¶áž–',
                                            label: 'System Updates',
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '14px 16px',
                                                background: '#f8fafc',
                                                borderRadius: 12,
                                                gap: 12,
                                            }}
                                        >
                                            <div>
                                                <KH
                                                    style={{
                                                        fontWeight: 800,
                                                        fontSize: 13,
                                                        display: 'block',
                                                    }}
                                                >
                                                    {item.labelKh}
                                                </KH>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#64748b',
                                                    }}
                                                >
                                                    {item.label}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setNotifications(
                                                        (current) => ({
                                                            ...current,
                                                            [item.key]:
                                                                !current[
                                                                    item.key
                                                                ],
                                                        }),
                                                    )
                                                }
                                                style={toggleStyle(
                                                    notifications[item.key],
                                                )}
                                            >
                                                <span
                                                    style={toggleKnobStyle(
                                                        notifications[item.key],
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    ))}

                                    {notifications.attendanceAlert && (
                                        <Field label="Low Attendance Threshold">
                                            <input
                                                style={{
                                                    ...inputStyle,
                                                    maxWidth: 140,
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={
                                                    notifications.lowAttendanceThreshold
                                                }
                                                onChange={(event) =>
                                                    setNotifications(
                                                        (current) => ({
                                                            ...current,
                                                            lowAttendanceThreshold:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </Field>
                                    )}
                                    {notifications.feeReminder && (
                                        <Field label="Reminder Days Before Due">
                                            <input
                                                style={{
                                                    ...inputStyle,
                                                    maxWidth: 140,
                                                }}
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={
                                                    notifications.feeReminderDays
                                                }
                                                onChange={(event) =>
                                                    setNotifications(
                                                        (current) => ({
                                                            ...current,
                                                            feeReminderDays:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </Field>
                                    )}
                                </div>
                            </SettingsPanel>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}

function SettingsPanel({
    title,
    children,
    onSave,
    saving,
}: {
    title: string;
    children: ReactNode;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <div className="card" style={{ padding: 28 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 20,
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{ fontWeight: 900, fontSize: 15, color: '#1e293b' }}
                >
                    {title}
                </div>
                <button
                    disabled={saving}
                    onClick={onSave}
                    style={{
                        background: saving ? '#93c5fd' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 18px',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: saving ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Save size={15} />
                    {saving ? 'Saving' : 'Save'}
                </button>
            </div>
            {children}
        </div>
    );
}

function Field({
    label,
    children,
    wide = false,
}: {
    label: string;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
            <label
                style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#64748b',
                    marginBottom: 6,
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}

function updateSchedule(
    settings: ClassSettings,
    index: number,
    key: keyof ScheduleSetting,
    value: string,
): ClassSettings {
    return {
        schedule: settings.schedule.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [key]: value } : item,
        ),
    };
}

function tabButton(active: boolean): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 13,
        textAlign: 'left',
        background: active ? '#eff6ff' : 'transparent',
        color: active ? '#2563eb' : '#64748b',
        marginBottom: 2,
    };
}

function toggleStyle(active: boolean, disabled = false): CSSProperties {
    return {
        width: 44,
        height: 24,
        borderRadius: 99,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? '#2563eb' : '#e2e8f0',
        position: 'relative',
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
    };
}

function toggleKnobStyle(active: boolean): CSSProperties {
    return {
        position: 'absolute',
        top: 3,
        left: active ? 23 : 3,
        width: 18,
        height: 18,
        background: 'white',
        borderRadius: '50%',
        display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    };
}

const formGrid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 16,
};

const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 40,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};
