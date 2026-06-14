import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function AppLauncher({
    trackUrl,
    targetUrl,
}: {
    trackUrl: string | null;
    targetUrl: string;
}) {
    useEffect(() => {
        const csrf =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        const tracking = trackUrl
            ? fetch(trackUrl, {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: {
                      'Content-Type': 'application/json',
                      'X-CSRF-TOKEN': csrf,
                  },
                  body: JSON.stringify({ event: 'app_opened' }),
              }).catch(() => undefined)
            : Promise.resolve();
        void tracking.finally(() => window.location.replace(targetUrl));
    }, [targetUrl, trackUrl]);
    return (
        <main className="grid min-h-dvh place-items-center bg-slate-50">
            <Head title="Opening School App" />
            <div className="text-center">
                <LoaderCircle
                    className="mx-auto animate-spin text-blue-600"
                    size={32}
                />
                <p className="mt-3 text-sm font-bold text-slate-500">
                    Opening School App…
                </p>
            </div>
        </main>
    );
}
