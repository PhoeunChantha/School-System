import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { serviceWorker } from '@/routes/school-app';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'school-app-install-dismissed-at';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function SchoolAppInstallBanner() {
    const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

    useEffect(() => {
        if ('serviceWorker' in navigator)
            navigator.serviceWorker
                .register(serviceWorker.url(), { scope: '/' })
                .catch(() => undefined);
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            ('standalone' in navigator &&
                Boolean(
                    (navigator as Navigator & { standalone?: boolean })
                        .standalone,
                ));
        const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
        if (standalone || Date.now() - dismissedAt < SEVEN_DAYS) return;
        const listener = (event: Event) => {
            event.preventDefault();
            setPrompt(event as InstallPromptEvent);
            setVisible(true);
        };
        window.addEventListener('beforeinstallprompt', listener);
        if (isIos) setVisible(true);
        return () =>
            window.removeEventListener('beforeinstallprompt', listener);
    }, [isIos]);

    const install = async () => {
        if (prompt) {
            await prompt.prompt();
            if ((await prompt.userChoice).outcome === 'accepted')
                setVisible(false);
            return;
        }
        setGuideOpen(true);
    };

    const dismiss = () => {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            <aside className="fixed right-3 bottom-3 left-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Smartphone size={20} />
                </span>
                <div className="min-w-0 flex-1">
                    <strong className="block text-sm">
                        Install School App
                    </strong>
                    <span className="block text-xs font-semibold text-slate-500">
                        Open school access from your home screen.
                    </span>
                </div>
                <button
                    onClick={() => void install()}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-black text-white"
                >
                    <Download size={14} /> Install
                </button>
                <button
                    onClick={dismiss}
                    aria-label="Dismiss for seven days"
                    className="p-1 text-slate-400"
                >
                    <X size={17} />
                </button>
            </aside>
            <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent className="max-w-sm rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Install on iPhone or iPad</DialogTitle>
                        <DialogDescription>
                            Three simple steps
                        </DialogDescription>
                    </DialogHeader>
                    <ol className="grid gap-3 text-sm font-bold">
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
                    </ol>
                </DialogContent>
            </Dialog>
        </>
    );
}
