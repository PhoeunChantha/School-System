import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AdminShell from '@/pages/admin/shell';
import {
    qr,
    regenerate,
    revoke,
    store,
} from '@/routes/admin/app-installations';
import { router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    Link2,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Share2,
    Smartphone,
    TimerOff,
    Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Status =
    | 'generated'
    | 'opened'
    | 'installation_started'
    | 'app_opened'
    | 'confirmed'
    | 'expired'
    | 'revoked';

interface InstallationLink {
    routeKey: string;
    recipient: string;
    studentCode: string | null;
    className: string | null;
    audience: 'student' | 'parent';
    status: Status;
    shareUrl: string;
    generatedAt: string;
    expiresAt: string;
    lastOpenedAt: string | null;
    platform: string | null;
    browser: string | null;
    createdBy: string | null;
}

interface Props {
    links: InstallationLink[];
    students: {
        id: number;
        name: string;
        code: string;
        classId: number | null;
    }[];
    classes: { id: number; name: string; studentCount: number }[];
    summary: {
        generated: number;
        opened: number;
        confirmed: number;
        expired: number;
    };
}

const statusTone: Record<Status, string> = {
    generated: 'bg-slate-100 text-slate-700',
    opened: 'bg-blue-50 text-blue-700',
    installation_started: 'bg-cyan-50 text-cyan-700',
    app_opened: 'bg-violet-50 text-violet-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-amber-50 text-amber-700',
    revoked: 'bg-red-50 text-red-700',
};

const formatStatus = (status: Status) => status.replaceAll('_', ' ');
const formatDate = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(value))
        : 'Not opened';

export default function AppInstallationsPage({
    links,
    students,
    classes,
    summary,
}: Props) {
    const [generateOpen, setGenerateOpen] = useState(false);
    const [qrLink, setQrLink] = useState<InstallationLink | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [audience, setAudience] = useState('all');
    const [classId, setClassId] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const form = useForm({
        mode: 'individual',
        audience: 'student',
        student_id: '',
        class_id: '',
        expires_days: 30,
    });
    const summaryCards = [
        {
            icon: Link2,
            label: 'Generated',
            value: summary.generated,
            tone: 'text-blue-600',
        },
        {
            icon: ExternalLink,
            label: 'Opened',
            value: summary.opened,
            tone: 'text-cyan-600',
        },
        {
            icon: CheckCircle2,
            label: 'Confirmed',
            value: summary.confirmed,
            tone: 'text-emerald-600',
        },
        {
            icon: TimerOff,
            label: 'Expired',
            value: summary.expired,
            tone: 'text-amber-600',
        },
    ];

    const filtered = useMemo(
        () =>
            links.filter((link) => {
                const query = search.trim().toLowerCase();
                return (
                    (status === 'all' || link.status === status) &&
                    (audience === 'all' || link.audience === audience) &&
                    (!dateFrom ||
                        new Date(link.generatedAt) >=
                            new Date(`${dateFrom}T00:00:00`)) &&
                    (!dateTo ||
                        new Date(link.generatedAt) <=
                            new Date(`${dateTo}T23:59:59`)) &&
                    (classId === 'all' ||
                        link.className ===
                            classes.find((item) => String(item.id) === classId)
                                ?.name) &&
                    (!query ||
                        [
                            link.recipient,
                            link.studentCode ?? '',
                            link.className ?? '',
                        ].some((value) => value.toLowerCase().includes(query)))
                );
            }),
        [audience, classId, classes, dateFrom, dateTo, links, search, status],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setGenerateOpen(false);
                form.reset();
                toast.success('Installation links generated.');
            },
        });
    };

    const copy = async (link: InstallationLink) => {
        await navigator.clipboard.writeText(link.shareUrl);
        toast.success('Link copied.');
    };

    const share = async (link: InstallationLink) => {
        if (navigator.share) {
            await navigator.share({
                title: 'Install School App',
                text: `Install the School App for ${link.recipient}`,
                url: link.shareUrl,
            });
            return;
        }
        await copy(link);
    };

    return (
        <AdminShell>
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-4 md:p-6">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                    <div>
                        <span className="flex items-center gap-2 text-xs font-black text-blue-600">
                            <Smartphone size={16} /> School App distribution
                        </span>
                        <h1 className="mt-2 text-2xl font-black">
                            App Installations
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Create secure links and track app access for
                            students and parents.
                        </p>
                    </div>
                    <Button
                        onClick={() => setGenerateOpen(true)}
                        className="h-11 rounded-lg bg-blue-600 px-5 font-black"
                    >
                        <Plus /> Generate Links
                    </Button>
                </header>

                <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {summaryCards.map(({ icon: Icon, label, value, tone }) => (
                        <article
                            key={label}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <Icon className={tone} size={20} />
                            <strong className="mt-3 block text-2xl font-black">
                                {value}
                            </strong>
                            <span className="text-xs font-bold text-slate-500">
                                {label}
                            </span>
                        </article>
                    ))}
                </section>

                <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-2 xl:grid-cols-[1fr_165px_145px_170px_150px_150px] dark:border-slate-800 dark:bg-slate-900">
                    <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-slate-700">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search recipient, code, or class"
                            className="w-full bg-transparent text-sm font-semibold outline-none"
                        />
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-bold"
                    >
                        <option value="all">All statuses</option>
                        {Object.keys(statusTone).map((item) => (
                            <option key={item} value={item}>
                                {formatStatus(item as Status)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-bold"
                    >
                        <option value="all">All audiences</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                    </select>
                    <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-bold"
                    >
                        <option value="all">All classes</option>
                        {classes.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        aria-label="Generated from"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-bold"
                    />
                    <input
                        type="date"
                        aria-label="Generated through"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-bold"
                    />
                </section>

                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="hidden grid-cols-[1.4fr_.7fr_.8fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 uppercase lg:grid">
                        <span>Recipient</span>
                        <span>Audience</span>
                        <span>Status</span>
                        <span>Expiry</span>
                        <span>Device</span>
                        <span>Actions</span>
                    </div>
                    {filtered.map((link) => (
                        <article
                            key={link.routeKey}
                            className="grid gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1.4fr_.7fr_.8fr_1fr_1fr_auto] lg:items-center"
                        >
                            <div>
                                <strong className="block">
                                    {link.recipient}
                                </strong>
                                <span className="text-xs font-semibold text-slate-500">
                                    {link.studentCode} ·{' '}
                                    {link.className ?? 'No class'}
                                </span>
                            </div>
                            <span className="text-sm font-bold capitalize">
                                {link.audience}
                            </span>
                            <span
                                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${statusTone[link.status]}`}
                            >
                                {formatStatus(link.status)}
                            </span>
                            <div className="text-xs font-semibold text-slate-500">
                                <span className="block">
                                    {formatDate(link.expiresAt)}
                                </span>
                                <span>
                                    Last: {formatDate(link.lastOpenedAt)}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                                {link.platform
                                    ? `${link.platform} · ${link.browser ?? 'Unknown'}`
                                    : 'Not detected'}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="Copy link"
                                    onClick={() => void copy(link)}
                                >
                                    <Copy />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="Share"
                                    onClick={() => void share(link)}
                                >
                                    <Share2 />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="Show QR"
                                    onClick={() => setQrLink(link)}
                                >
                                    <QrCode />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="Regenerate"
                                    onClick={() =>
                                        router.post(
                                            regenerate.url(link.routeKey),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <RefreshCw />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    title="Revoke"
                                    disabled={link.status === 'revoked'}
                                    onClick={() =>
                                        router.put(
                                            revoke.url(link.routeKey),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Trash2 className="text-red-600" />
                                </Button>
                            </div>
                        </article>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-10 text-center text-sm font-bold text-slate-500">
                            No installation links match these filters.
                        </div>
                    )}
                </section>
            </div>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="max-w-lg rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Generate installation links</DialogTitle>
                        <DialogDescription>
                            Each recipient receives a unique secure link valid
                            for the selected period.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-2">
                            {['individual', 'class'].map((mode) => (
                                <button
                                    type="button"
                                    key={mode}
                                    onClick={() => form.setData('mode', mode)}
                                    className={`h-11 rounded-lg border text-sm font-black cursor-pointer capitalize ${form.data.mode === mode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <label className="grid gap-1.5 text-xs font-black text-slate-600">
                            Audience
                            <select
                                value={form.data.audience}
                                onChange={(e) =>
                                    form.setData('audience', e.target.value)
                                }
                                className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="student">Student</option>
                                <option value="parent">Parent</option>
                                <option value="both">Both</option>
                            </select>
                        </label>
                        {form.data.mode === 'individual' ? (
                            <label className="grid gap-1.5 text-xs font-black text-slate-600">
                                Student
                                <select
                                    value={form.data.student_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'student_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                                >
                                    <option value="">Select student</option>
                                    {students.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} · {item.code}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : (
                            <label className="grid gap-1.5 text-xs font-black text-slate-600">
                                Class
                                <select
                                    value={form.data.class_id}
                                    onChange={(e) =>
                                        form.setData('class_id', e.target.value)
                                    }
                                    required
                                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} · {item.studentCount}{' '}
                                            students
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="grid gap-1.5 text-xs font-black text-slate-600">
                            Expires after
                            <input
                                type="number"
                                min={1}
                                max={90}
                                value={form.data.expires_days}
                                onChange={(e) =>
                                    form.setData(
                                        'expires_days',
                                        Number(e.target.value),
                                    )
                                }
                                className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            />
                            <span className="font-semibold text-slate-400">
                                Days, default 30
                            </span>
                        </label>
                        <Button
                            disabled={form.processing}
                            className="h-11 rounded-lg bg-blue-600 font-black cursor-pointer"
                            type="submit"
                        >
                            {form.processing ? 'Generating…' : 'Generate Links'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={qrLink !== null}
                onOpenChange={(open) => !open && setQrLink(null)}
            >
                <DialogContent className="max-w-sm rounded-lg text-center">
                    <DialogHeader>
                        <DialogTitle>Scan to install</DialogTitle>
                        <DialogDescription>
                            {qrLink?.recipient} · {qrLink?.audience}
                        </DialogDescription>
                    </DialogHeader>
                    {qrLink && (
                        <>
                            <img
                                src={qr.url(qrLink.routeKey)}
                                alt="Installation QR code"
                                className="mx-auto aspect-square w-full max-w-72"
                            />
                            <a
                                href={qr.url(qrLink.routeKey, {
                                    query: { download: 1 },
                                })}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white"
                            >
                                <Download size={17} /> Download QR
                            </a>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AdminShell>
    );
}
