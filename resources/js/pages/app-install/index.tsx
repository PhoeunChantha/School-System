import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { serviceWorker } from '@/routes/school-app';
import { Head } from '@inertiajs/react';
import { Check, Download, LockKeyhole, Share, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
interface Props {
    school: { nameEn: string; logo: string | null };
    recipient: string;
    audience: 'student' | 'parent';
    expiresAt: string;
    manifestUrl: string;
    trackUrl: string;
    launchUrl: string;
}

export default function AppInstallPage({
    school,
    recipient,
    audience,
    expiresAt,
    manifestUrl,
    trackUrl,
    launchUrl,
}: Props) {
    const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
    const [guideOpen, setGuideOpen] = useState(false);
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const postEvent = useCallback(
        (event: string) =>
            fetch(trackUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? '',
                },
                body: JSON.stringify({ event }),
            }).catch(() => undefined),
        [trackUrl],
    );

    useEffect(() => {
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            Boolean(
                (navigator as Navigator & { standalone?: boolean }).standalone,
            );
        if (standalone) {
            void postEvent('app_opened').finally(() =>
                window.location.replace(launchUrl),
            );
            return;
        }
        const listener = (event: Event) => {
            event.preventDefault();
            setPrompt(event as InstallPromptEvent);
        };
        const installed = () => void postEvent('appinstalled');
        window.addEventListener('beforeinstallprompt', listener);
        window.addEventListener('appinstalled', installed);
        if ('serviceWorker' in navigator)
            navigator.serviceWorker
                .register(serviceWorker.url(), { scope: '/' })
                .catch(() => undefined);
        return () => {
            window.removeEventListener('beforeinstallprompt', listener);
            window.removeEventListener('appinstalled', installed);
        };
    }, [launchUrl, postEvent]);

    const install = async () => {
        await postEvent('install_started');
        if (prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            return;
        }
        if (isIos) {
            setGuideOpen(true);
            return;
        }
        setGuideOpen(true);
    };

    return (
        <main className="min-h-dvh bg-slate-100 px-4 py-8 text-slate-950">
            <Head title={`Install ${school.nameEn}`}>
                <link rel="manifest" href={manifestUrl} />
                <meta name="theme-color" content="#0f2f2a" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </Head>
            <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        {school.logo ? (
                            <img
                                src={school.logo}
                                alt=""
                                className="h-14 w-14 rounded-lg object-cover"
                            />
                        ) : (
                            <span className="grid h-14 w-14 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                                <Smartphone />
                            </span>
                        )}
                        <div>
                            <p className="text-xs font-black tracking-wide text-emerald-700 uppercase">
                                School App
                            </p>
                            <h1 className="text-xl font-black">
                                {school.nameEn}
                            </h1>
                        </div>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-3xl leading-tight font-black">
                            Install once.
                            <br />
                            Open school easily.
                        </h2>
                        <p className="mt-3 leading-7 font-semibold text-slate-500">
                            Prepared for{' '}
                            <strong className="text-slate-800">
                                {recipient}
                            </strong>{' '}
                            ·{' '}
                            {audience === 'parent'
                                ? 'Parent access'
                                : 'Student access'}
                        </p>
                    </div>
                    <div className="mt-7 grid gap-3">
                        {[
                            [
                                'Home screen access',
                                'No need to search for the website.',
                            ],
                            [
                                'One common login',
                                'The app opens the regular secure login screen.',
                            ],
                            [
                                'Private installation link',
                                `Valid until ${new Date(expiresAt).toLocaleDateString()}.`,
                            ],
                        ].map(([title, text]) => (
                            <div
                                key={title}
                                className="flex gap-3 rounded-lg bg-slate-50 p-3"
                            >
                                <Check
                                    className="mt-0.5 shrink-0 text-emerald-600"
                                    size={18}
                                />
                                <div>
                                    <strong className="text-sm">{title}</strong>
                                    <p className="mt-0.5 text-xs leading-5 font-semibold text-slate-500">
                                        {text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100 p-6">
                    <button
                        onClick={() => void install()}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/20"
                    >
                        <Download size={20} /> Install School App
                    </button>
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-slate-400">
                        <LockKeyhole size={14} /> Do not forward this private
                        link.
                    </p>
                    <p className="mt-3 text-center text-xs font-bold text-slate-500">
                        ដំឡើងកម្មវិធីសាលា ដើម្បីបើកប្រើបានងាយស្រួល
                    </p>
                </div>
            </section>
            <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent className="max-w-sm rounded-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {isIos
                                ? 'Install on iPhone / iPad'
                                : 'Install from your browser'}
                        </DialogTitle>
                        <DialogDescription>
                            {isIos
                                ? 'អនុវត្តតាម ៣ ជំហានខាងក្រោម'
                                : 'Use your browser menu to install this app.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ol className="grid gap-3 text-sm font-bold">
                        {isIos ? (
                            <>
                                <li className="flex gap-3 rounded-lg bg-slate-50 p-3">
                                    <Share className="text-blue-600" />
                                    1. Tap Share in Safari.
                                </li>
                                <li className="flex gap-3 rounded-lg bg-slate-50 p-3">
                                    <Download className="text-blue-600" />
                                    2. Tap Add to Home Screen.
                                </li>
                                <li className="flex gap-3 rounded-lg bg-slate-50 p-3">
                                    <Smartphone className="text-blue-600" />
                                    3. Tap Add.
                                </li>
                            </>
                        ) : (
                            <li className="rounded-lg bg-slate-50 p-3">
                                Open the browser menu and choose Install app or
                                Add to Home screen.
                            </li>
                        )}
                    </ol>
                </DialogContent>
            </Dialog>
        </main>
    );
}
