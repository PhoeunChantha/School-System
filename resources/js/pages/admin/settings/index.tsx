import {
    update,
    uploadImage,
    uploadSearchConsoleFile,
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
    Database,
    FileCheck2,
    Globe2,
    KeyRound,
    Mail,
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
    | 'seo'
    | 'fees'
    | 'classes'
    | 'notifications'
    | 'login'
    | 'mail'
    | 'database'
    | 'search-console'
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

interface SeoSettings {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    robots: string;
    seoImage: string | null;
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
    lessonPlanAlert: boolean;
    homeworkSubmissionAlert: boolean;
    systemUpdates: boolean;
    notificationSound: string | null;
}

interface LoginSecuritySettings {
    maxAttempts: string;
    decaySeconds: string;
    alertEnabled: boolean;
    alertEmail: string;
    parentAccessEnabled: boolean;
    parentAccessExpiresMinutes: string;
    parentSmsProvider: string;
    plasgateEndpoint: string;
    plasgateSecret: string;
    plasgatePrivate: string;
    plasgateSender: string;
    parentSmsTemplate: string;
}

interface MailSettings {
    mailHost: string;
    mailPort: string;
    mailScheme: string;
    mailUsername: string;
    mailPassword: string;
    mailFromAddress: string;
}

interface DatabaseSettings {
    databaseName: string;
}

interface SearchConsoleSettings {
    verificationFile: string | null;
    verificationUrl: string | null;
}

interface SettingsPageProps {
    settings: {
        school: SchoolSettings;
        seo: SeoSettings;
        fees: FeeSettings;
        classes: ClassSettings;
        notifications: NotificationSettings;
        login: LoginSecuritySettings;
        mail: MailSettings;
        database: DatabaseSettings;
        searchConsole: SearchConsoleSettings;
    };
    mustVerifyEmail?: boolean;
    profileStatus?: string;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
}

const tabs: { id: SettingsTab; label: string; icon: ElementType }[] = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'seo', label: 'SEO', icon: Globe2 },
    { id: 'fees', label: 'Fee Settings', icon: CreditCard },
    { id: 'classes', label: 'Class Schedule', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'login', label: 'Login', icon: ShieldBan },
    { id: 'mail', label: 'Mail', icon: Mail },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'search-console', label: 'Search Console', icon: FileCheck2 },
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
        items: [
            { id: 'fee', label: 'ការទូទាត់', sub: 'Fees' },
            { id: 'expenses', label: 'ចំណាយ', sub: 'Expenses' },
        ],
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
const inputClass =
    'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
type SettingsErrors = Record<string, string>;

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
    const [seo, setSeo] = useState<SeoSettings>(settings.seo);
    const [fees, setFees] = useState<FeeSettings>(settings.fees);
    const [classes, setClasses] = useState<ClassSettings>(settings.classes);
    const [notifications, setNotifications] = useState<NotificationSettings>(
        settings.notifications,
    );
    const [loginSecurity, setLoginSecurity] = useState<LoginSecuritySettings>(
        settings.login,
    );
    const [mailSettings, setMailSettings] = useState<MailSettings>(
        settings.mail,
    );
    const [database, setDatabase] = useState<DatabaseSettings>(
        settings.database,
    );
    const [searchConsoleFile, setSearchConsoleFile] = useState<string | null>(
        settings.searchConsole.verificationFile,
    );
    const [searchConsoleUrl, setSearchConsoleUrl] = useState<string | null>(
        settings.searchConsole.verificationUrl,
    );
    const [savingGroup, setSavingGroup] = useState<SettingsTab | null>(null);
    const [settingsErrors, setSettingsErrors] = useState<SettingsErrors>({});
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
    const [seoImagePreview, setSeoImagePreview] = useState<string | null>(
        toUrl(settings.seo.seoImage),
    );
    const [notificationSoundPreview, setNotificationSoundPreview] = useState<
        string | null
    >(toUrl(settings.notifications.notificationSound));
    const [uploadingType, setUploadingType] = useState<
        | 'logo'
        | 'favicon'
        | 'loginBg'
        | 'seoImage'
        | 'notificationSound'
        | 'searchConsole'
        | null
    >(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const loginBgInputRef = useRef<HTMLInputElement>(null);
    const seoImageInputRef = useRef<HTMLInputElement>(null);
    const notificationSoundInputRef = useRef<HTMLInputElement>(null);
    const searchConsoleInputRef = useRef<HTMLInputElement>(null);

    const saveGroup = (group: SettingsTab, value: object) => {
        setSavingGroup(group);
        setSettingsErrors({});
        router.put(
            update.url(group),
            { value: value as unknown as string },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSettingsErrors({});
                    toast.success('Settings saved.');
                },
                onError: (errors) => {
                    setSettingsErrors(errors);
                    toast.error(
                        Object.values(errors)[0] ??
                            'Unable to save settings. Please check the fields.',
                    );
                },
                onFinish: () => setSavingGroup(null),
            },
        );
    };
    const handleImageUpload = (
        type: 'logo' | 'favicon' | 'loginBg' | 'seoImage' | 'notificationSound',
        file: File,
    ) => {
        const previewUrl = URL.createObjectURL(file);
        if (type === 'logo') setLogoPreview(previewUrl);
        else if (type === 'favicon') setFaviconPreview(previewUrl);
        else if (type === 'loginBg') setLoginBgPreview(previewUrl);
        else if (type === 'notificationSound')
            setNotificationSoundPreview(previewUrl);
        else setSeoImagePreview(previewUrl);

        setUploadingType(type);
        router.post(
            uploadImage.url(),
            { type, image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    if (type === 'notificationSound') {
                        const uploadedSound = (
                            page.props as unknown as SettingsPageProps
                        ).settings.notifications.notificationSound;

                        setNotifications((current) => ({
                            ...current,
                            notificationSound: uploadedSound,
                        }));
                        setNotificationSoundPreview(toUrl(uploadedSound));
                    }

                    toast.success(
                        `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : type === 'loginBg' ? 'Login background' : type === 'notificationSound' ? 'Notification sound' : 'SEO image'} uploaded successfully.`,
                    );
                },
                onError: () => {
                    if (type === 'logo')
                        setLogoPreview(toUrl(settings.school.logo));
                    else if (type === 'favicon')
                        setFaviconPreview(toUrl(settings.school.favicon));
                    else if (type === 'loginBg')
                        setLoginBgPreview(toUrl(settings.school.loginBg));
                    else if (type === 'notificationSound')
                        setNotificationSoundPreview(
                            toUrl(settings.notifications.notificationSound),
                        );
                    else setSeoImagePreview(toUrl(settings.seo.seoImage));
                    toast.error('Upload failed. Please try again.');
                },
                onFinish: () => setUploadingType(null),
            },
        );
    };

    const handleSearchConsoleUpload = async (file: File) => {
        const contents = await file.text();
        const verificationFilename = contents
            .match(/google-site-verification:\s*(google[a-z0-9]+\.html)/i)?.[1]
            ?.toLowerCase();

        if (!verificationFilename) {
            toast.error(
                'Upload the HTML verification file downloaded from Google Search Console.',
            );

            return;
        }

        setUploadingType('searchConsole');
        router.post(
            uploadSearchConsoleFile.url(),
            { verification_file: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSearchConsoleFile(verificationFilename);
                    setSearchConsoleUrl(
                        `${window.location.origin}/${verificationFilename}`,
                    );
                    toast.success('Google verification file uploaded.');
                },
                onError: (errors) =>
                    toast.error(
                        errors.verification_file ??
                            'Upload failed. Use the HTML file downloaded from Google Search Console.',
                    ),
                onFinish: () => setUploadingType(null),
            },
        );
    };

    return (
        <AdminShell>
            <div className="flex flex-col gap-3 bg-slate-50 p-4 fade-in max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:bg-slate-950 dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90">
                    <p className="text-xs font-black text-blue-500">
                        System configuration
                    </p>
                    <h1 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">
                        Settings
                    </h1>
                    <KH className="mt-1 block truncate text-xs font-bold text-slate-400">
                        កំណត់ - Manage school preferences
                    </KH>
                </section>

                <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                        <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-1">
                            {visibleTabs.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setTab(item.id)}
                                        className={`flex min-h-11 min-w-0 items-center gap-2 rounded-2xl px-3 text-left text-xs font-black transition ${tab === item.id ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-950'}`}
                                    >
                                        <Icon size={16} className="shrink-0" />
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="min-w-0">
                        {tab === 'school' && (
                            <SettingsPanel
                                title="School Information"
                                onSave={() => saveGroup('school', school)}
                                saving={savingGroup === 'school'}
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label="Khmer Name">
                                        <input
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
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

                        {tab === 'seo' && (
                            <SettingsPanel
                                title="SEO Settings"
                                onSave={() => saveGroup('seo', seo)}
                                saving={savingGroup === 'seo'}
                            >
                                <div style={formGrid}>
                                    <Field label="Meta Title" wide>
                                        <input
                                            style={inputStyle}
                                            value={seo.title}
                                            onChange={(event) =>
                                                setSeo((current) => ({
                                                    ...current,
                                                    title: event.target.value,
                                                }))
                                            }
                                            maxLength={70}
                                        />
                                    </Field>
                                    <Field label="Meta Description" wide>
                                        <textarea
                                            style={{
                                                ...inputStyle,
                                                minHeight: 96,
                                                resize: 'vertical',
                                            }}
                                            value={seo.description}
                                            onChange={(event) =>
                                                setSeo((current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            maxLength={180}
                                        />
                                    </Field>
                                    <Field label="Keywords" wide>
                                        <input
                                            style={inputStyle}
                                            value={seo.keywords}
                                            onChange={(event) =>
                                                setSeo((current) => ({
                                                    ...current,
                                                    keywords:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="school, English, Cambodia"
                                        />
                                    </Field>
                                    <Field label="Canonical URL">
                                        <input
                                            style={inputStyle}
                                            type="url"
                                            value={seo.canonicalUrl}
                                            onChange={(event) =>
                                                setSeo((current) => ({
                                                    ...current,
                                                    canonicalUrl:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="https://example.com"
                                        />
                                    </Field>
                                    <Field label="Robots">
                                        <select
                                            style={inputStyle}
                                            value={seo.robots}
                                            onChange={(event) =>
                                                setSeo((current) => ({
                                                    ...current,
                                                    robots: event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="index,follow">
                                                index,follow
                                            </option>
                                            <option value="noindex,nofollow">
                                                noindex,nofollow
                                            </option>
                                            <option value="index,nofollow">
                                                index,nofollow
                                            </option>
                                            <option value="noindex,follow">
                                                noindex,follow
                                            </option>
                                        </select>
                                    </Field>
                                </div>

                                <div style={{ marginTop: 22 }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: '#64748b',
                                            marginBottom: 8,
                                        }}
                                    >
                                        Social Share Image
                                    </label>
                                    <input
                                        ref={seoImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(event) => {
                                            const file =
                                                event.target.files?.[0];
                                            if (file)
                                                handleImageUpload(
                                                    'seoImage',
                                                    file,
                                                );
                                            event.target.value = '';
                                        }}
                                    />
                                    <div
                                        onClick={() =>
                                            seoImageInputRef.current?.click()
                                        }
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            minHeight: 160,
                                            background: '#f8fafc',
                                            border: '2px dashed #e2e8f0',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {seoImagePreview ? (
                                            <img
                                                src={seoImagePreview}
                                                alt="SEO social preview"
                                                style={{
                                                    width: '100%',
                                                    height: 180,
                                                    objectFit: 'cover',
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
                                                    size={22}
                                                    style={{
                                                        margin: '0 auto 6px',
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {uploadingType ===
                                                    'seoImage'
                                                        ? 'Uploading...'
                                                        : 'Click to upload social image'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                            marginTop: 6,
                                        }}
                                    >
                                        Recommended: 1200x630 px JPG/PNG/WebP
                                    </div>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'search-console' && (
                            <div className="card" style={{ padding: 28 }}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        fontSize: 15,
                                        color: '#1e293b',
                                        marginBottom: 4,
                                    }}
                                >
                                    Google Search Console
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginBottom: 22,
                                    }}
                                >
                                    Upload the HTML verification file from
                                    Google. It will be placed at the website
                                    root for ownership verification.
                                </div>

                                <input
                                    ref={searchConsoleInputRef}
                                    type="file"
                                    accept=".html,text/html"
                                    style={{ display: 'none' }}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                            handleSearchConsoleUpload(file);
                                        }
                                        event.target.value = '';
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        searchConsoleInputRef.current?.click()
                                    }
                                    style={{
                                        width: '100%',
                                        minHeight: 132,
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: 14,
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: 8,
                                        color: '#64748b',
                                    }}
                                >
                                    <Upload size={24} />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: '#1e293b',
                                        }}
                                    >
                                        {uploadingType === 'searchConsole'
                                            ? 'Uploading...'
                                            : 'Upload google....html file'}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                        }}
                                    >
                                        Example: googleb060d26401f59404.html
                                    </span>
                                </button>

                                <div
                                    style={{
                                        marginTop: 18,
                                        padding: '14px 16px',
                                        background: searchConsoleFile
                                            ? '#f0fdf4'
                                            : '#fff7ed',
                                        border: `1px solid ${
                                            searchConsoleFile
                                                ? '#bbf7d0'
                                                : '#fed7aa'
                                        }`,
                                        borderRadius: 12,
                                        color: searchConsoleFile
                                            ? '#166534'
                                            : '#9a3412',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {searchConsoleFile ? (
                                        <>
                                            Current file:{' '}
                                            {searchConsoleUrl ? (
                                                <a
                                                    href={searchConsoleUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        color: '#166534',
                                                        textDecoration:
                                                            'underline',
                                                    }}
                                                >
                                                    {searchConsoleFile}
                                                </a>
                                            ) : (
                                                searchConsoleFile
                                            )}
                                            <br />
                                            Keep this file online after Google
                                            verification succeeds.
                                        </>
                                    ) : (
                                        <>
                                            No Google verification file found.
                                            Download the HTML file from Search
                                            Console and upload it here.
                                        </>
                                    )}
                                </div>
                            </div>
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

                                <ClassScheduleCalendar
                                    schedule={classes.schedule}
                                />
                            </SettingsPanel>
                        )}

                        {tab === 'database' && (
                            <SettingsPanel
                                title="Database"
                                onSave={() => saveGroup('database', database)}
                                saving={savingGroup === 'database'}
                            >
                                <div style={formGrid}>
                                    <Field label="Database Name" wide>
                                        <input
                                            style={inputStyle}
                                            value={database.databaseName}
                                            placeholder="system-school"
                                            onChange={(event) =>
                                                setDatabase((current) => ({
                                                    ...current,
                                                    databaseName:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                </div>

                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: '14px 16px',
                                        borderRadius: 12,
                                        background: '#fff7ed',
                                        border: '1px solid #fed7aa',
                                        color: '#9a3412',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    This updates the real .env value
                                    DB_DATABASE. The target database must
                                    already exist and should have the same
                                    tables before switching.
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
                                    action={ProfileController.update()}
                                    options={{ preserveScroll: true }}
                                    className="space-y-5"
                                    onSuccess={() =>
                                        toast.success('Profile updated.')
                                    }
                                >
                                    {({
                                        processing,
                                        recentlySuccessful,
                                        errors,
                                    }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="redirect_to"
                                                value="admin_settings"
                                            />
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
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
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
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
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
                                    <div
                                        style={{
                                            padding: '14px 16px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                                flexWrap: 'wrap',
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
                                                    សំឡេងជូនដំណឹង
                                                </KH>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#64748b',
                                                    }}
                                                >
                                                    Reverb alert sound while the
                                                    student portal is open
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    notificationSoundInputRef.current?.click()
                                                }
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    minHeight: 38,
                                                    border: 'none',
                                                    borderRadius: 12,
                                                    background: '#2563eb',
                                                    color: '#ffffff',
                                                    padding: '8px 14px',
                                                    fontSize: 12,
                                                    fontWeight: 900,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <Upload size={14} />
                                                {uploadingType ===
                                                'notificationSound'
                                                    ? 'Uploading'
                                                    : 'Upload Sound'}
                                            </button>
                                        </div>
                                        <input
                                            ref={notificationSoundInputRef}
                                            type="file"
                                            accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                                            style={{ display: 'none' }}
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0];

                                                if (file) {
                                                    handleImageUpload(
                                                        'notificationSound',
                                                        file,
                                                    );
                                                }

                                                event.target.value = '';
                                            }}
                                        />
                                        {notificationSoundPreview ? (
                                            <audio
                                                controls
                                                src={notificationSoundPreview}
                                                style={{
                                                    width: '100%',
                                                    marginTop: 12,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    marginTop: 10,
                                                    color: '#94a3b8',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                No custom sound uploaded
                                            </div>
                                        )}
                                    </div>

                                    {[
                                        {
                                            key: 'attendanceAlert' as const,
                                            labelKh: 'ការជូនដំណឹងវត្តមាន',
                                            label: 'Low Attendance Alerts',
                                        },
                                        {
                                            key: 'feeReminder' as const,
                                            labelKh: 'រំលឹកការទូទាត់',
                                            label: 'Fee Payment Reminders',
                                        },
                                        {
                                            key: 'homeworkDue' as const,
                                            labelKh: 'ការជូនដំណឹងកិច្ចការ',
                                            label: 'Homework Due Alerts',
                                        },
                                        {
                                            key: 'lessonPlanAlert' as const,
                                            labelKh: 'ការជូនដំណឹងផែនការមេរៀន',
                                            label: 'Lesson Plan Student Alerts',
                                        },
                                        {
                                            key: 'homeworkSubmissionAlert' as const,
                                            labelKh:
                                                'ការជូនដំណឹងពេលសិស្សបញ្ជូនកិច្ចការ',
                                            label: 'Homework Submit Alerts',
                                        },
                                        {
                                            key: 'systemUpdates' as const,
                                            labelKh: 'ការធ្វើបច្ចុប្បន្នភាព',
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

                        {tab === 'login' && (
                            <SettingsPanel
                                title="Login Security"
                                onSave={() => saveGroup('login', loginSecurity)}
                                saving={savingGroup === 'login'}
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Failed Attempts Before Lockout"
                                        error={settingsErrors['value.maxAttempts']}
                                    >
                                        <input
                                            className={inputClass}
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={loginSecurity.maxAttempts}
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    maxAttempts:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Lockout Seconds"
                                        error={settingsErrors['value.decaySeconds']}
                                    >
                                        <input
                                            className={inputClass}
                                            type="number"
                                            min="1"
                                            max="3600"
                                            value={loginSecurity.decaySeconds}
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    decaySeconds:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Alert Email"
                                        wide
                                        error={settingsErrors['value.alertEmail']}
                                    >
                                        <input
                                            className={inputClass}
                                            type="email"
                                            value={loginSecurity.alertEmail}
                                            placeholder="security@example.com"
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    alertEmail:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-50">
                                                    Send Email On Login Lockout
                                                </div>
                                                <div className="text-xs font-bold text-slate-400">
                                                    Sends one email per locked
                                                    identifier and IP window.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setLoginSecurity(
                                                        (current) => ({
                                                            ...current,
                                                            alertEnabled:
                                                                !current.alertEnabled,
                                                        }),
                                                    )
                                                }
                                                style={toggleStyle(
                                                    loginSecurity.alertEnabled,
                                                )}
                                            >
                                                <span
                                                    style={toggleKnobStyle(
                                                        loginSecurity.alertEnabled,
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-50">
                                                    Parent Portal SMS Access
                                                </div>
                                                <div className="text-xs font-bold text-slate-400">
                                                    Shows the parent button on
                                                    login and sends PlasGate SMS
                                                    access links.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setLoginSecurity(
                                                        (current) => ({
                                                            ...current,
                                                            parentAccessEnabled:
                                                                !current.parentAccessEnabled,
                                                        }),
                                                    )
                                                }
                                                style={toggleStyle(
                                                    loginSecurity.parentAccessEnabled,
                                                )}
                                            >
                                                <span
                                                    style={toggleKnobStyle(
                                                        loginSecurity.parentAccessEnabled,
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                    <Field
                                        label="Access Link Expiry Minutes"
                                        error={
                                            settingsErrors[
                                                'value.parentAccessExpiresMinutes'
                                            ]
                                        }
                                    >
                                        <input
                                            className={inputClass}
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={
                                                loginSecurity.parentAccessExpiresMinutes
                                            }
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    parentAccessExpiresMinutes:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="SMS Provider"
                                        error={
                                            settingsErrors[
                                                'value.parentSmsProvider'
                                            ]
                                        }
                                    >
                                        <select
                                            className={inputClass}
                                            value={
                                                loginSecurity.parentSmsProvider
                                            }
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    parentSmsProvider:
                                                        event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="plasgate">
                                                PlasGate
                                            </option>
                                        </select>
                                    </Field>
                                    <Field
                                        label="PlasGate Endpoint"
                                        wide
                                        error={
                                            settingsErrors[
                                                'value.plasgateEndpoint'
                                            ]
                                        }
                                    >
                                        <input
                                            className={inputClass}
                                            value={
                                                loginSecurity.plasgateEndpoint
                                            }
                                            placeholder="https://cloudapi.plasgate.com/rest/send"
                                            autoComplete="off"
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    plasgateEndpoint:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="PlasGate Secret"
                                        error={
                                            settingsErrors[
                                                'value.plasgateSecret'
                                            ]
                                        }
                                    >
                                        <input
                                            className={inputClass}
                                            autoComplete="new-password"
                                            data-1p-ignore="true"
                                            data-lpignore="true"
                                            value={loginSecurity.plasgateSecret}
                                            placeholder="Secret key"
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    plasgateSecret:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="PlasGate Private"
                                        error={
                                            settingsErrors[
                                                'value.plasgatePrivate'
                                            ]
                                        }
                                    >
                                        <input
                                            className={inputClass}
                                            type="password"
                                            autoComplete="new-password"
                                            data-1p-ignore="true"
                                            data-lpignore="true"
                                            value={loginSecurity.plasgatePrivate}
                                            placeholder="Private key"
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    plasgatePrivate:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="PlasGate Sender"
                                        error={
                                            settingsErrors[
                                                'value.plasgateSender'
                                            ]
                                        }
                                    >
                                        <input
                                            className={inputClass}
                                            value={loginSecurity.plasgateSender}
                                            placeholder="SMS Info"
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    plasgateSender:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="SMS Text Template"
                                        wide
                                        error={
                                            settingsErrors[
                                                'value.parentSmsTemplate'
                                            ]
                                        }
                                    >
                                        <textarea
                                            className={inputClass}
                                            rows={3}
                                            value={
                                                loginSecurity.parentSmsTemplate
                                            }
                                            onChange={(event) =>
                                                setLoginSecurity((current) => ({
                                                    ...current,
                                                    parentSmsTemplate:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                        <p className="mt-2 text-xs font-bold text-slate-400">
                                            Use {'{link}'} and {'{minutes}'} in
                                            the SMS text.
                                        </p>
                                    </Field>
                                </div>
                            </SettingsPanel>
                        )}

                        {tab === 'mail' && (
                            <SettingsPanel
                                title="Mail Settings"
                                onSave={() => saveGroup('mail', mailSettings)}
                                saving={savingGroup === 'mail'}
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label="Mail Host">
                                        <input
                                            className={inputClass}
                                            value={mailSettings.mailHost}
                                            placeholder="smtp.gmail.com"
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailHost:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Mail Port">
                                        <input
                                            className={inputClass}
                                            type="number"
                                            min="1"
                                            max="65535"
                                            value={mailSettings.mailPort}
                                            placeholder="587"
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailPort:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Mail Scheme">
                                        <select
                                            className={inputClass}
                                            value={mailSettings.mailScheme}
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailScheme:
                                                        event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="smtp">smtp</option>
                                            <option value="smtps">smtps</option>
                                            <option value="">none</option>
                                        </select>
                                    </Field>
                                    <Field label="Mail Username">
                                        <input
                                            className={inputClass}
                                            type="email"
                                            value={mailSettings.mailUsername}
                                            placeholder="your@gmail.com"
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailUsername:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Google App Password">
                                        <input
                                            className={inputClass}
                                            type="password"
                                            value={mailSettings.mailPassword}
                                            placeholder="Leave blank to keep current .env password"
                                            autoComplete="new-password"
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailPassword:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Mail From Address">
                                        <input
                                            className={inputClass}
                                            type="email"
                                            value={mailSettings.mailFromAddress}
                                            placeholder="your@gmail.com"
                                            onChange={(event) =>
                                                setMailSettings((current) => ({
                                                    ...current,
                                                    mailFromAddress:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
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
        <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-base font-black text-slate-900 dark:text-slate-50">
                    {title}
                </div>
                <button
                    disabled={saving}
                    onClick={onSave}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300"
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
    error,
}: {
    label: string;
    children: ReactNode;
    wide?: boolean;
    error?: string;
}) {
    return (
        <div className={wide ? 'md:col-span-2' : undefined}>
            <label className="mb-1.5 block text-[11px] font-black tracking-wide text-slate-400 uppercase">
                {label}
            </label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}

const scheduleDays = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
] as const;

function ClassScheduleCalendar({ schedule }: { schedule: ScheduleSetting[] }) {
    const normalized = schedule.map((item) => ({
        ...item,
        dayKeys: item.days
            .toLowerCase()
            .split(/[\s,]+/)
            .filter(Boolean),
    }));

    return (
        <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/70">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-black text-slate-900 dark:text-slate-50">
                        Weekly Calendar
                    </div>
                    <div className="text-[11px] font-bold text-slate-400">
                        Generated from active class schedule data
                    </div>
                </div>
                <CalendarDays size={18} className="text-blue-500" />
            </div>
            <div className="grid gap-2 md:grid-cols-7">
                {scheduleDays.map((day) => {
                    const dayClasses = normalized.filter((item) =>
                        item.dayKeys.includes(day.key),
                    );

                    return (
                        <div
                            key={day.key}
                            className="min-h-32 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="mb-2 text-[11px] font-black tracking-wide text-slate-400 uppercase">
                                {day.label}
                            </div>
                            <div className="grid gap-1.5">
                                {dayClasses.length > 0 ? (
                                    dayClasses.map((item, index) => (
                                        <div
                                            key={`${day.key}-${item.label}-${index}`}
                                            className="rounded-xl bg-blue-50 p-2 text-blue-950 dark:bg-blue-500/15 dark:text-blue-100"
                                        >
                                            <div className="truncate text-[12px] font-black">
                                                {item.label}
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-bold text-blue-500 dark:text-blue-300">
                                                {item.time || 'No time'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400">
                                                {item.room || 'No room'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 px-2 py-4 text-center text-[11px] font-bold text-slate-400 dark:border-slate-700">
                                        No class
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
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
        minWidth: 0,
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 13,
        textAlign: 'left',
        whiteSpace: 'nowrap',
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
