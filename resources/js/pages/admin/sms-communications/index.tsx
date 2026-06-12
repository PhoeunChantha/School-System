import { retry } from '@/actions/App/Http/Controllers/Backends/SmsCommunicationController';
import AdminShell from '@/pages/admin/shell';
import { router } from '@inertiajs/react';
import { MessageSquareText, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface SmsMessage {
    id: number;
    routeKey: string;
    studentName: string;
    studentCode: string;
    phone: string;
    provider: string;
    sender: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    attemptCount: number;
    providerStatus: number | null;
    providerResponse: string;
    failureReason: string;
    canRetry: boolean;
    lastAttemptedAt: string | null;
    sentAt: string | null;
    createdAt: string | null;
}

interface Props {
    messages: SmsMessage[];
    summary: { total: number; sent: number; failed: number; attempts: number };
}

const statusStyles = {
    sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export default function SmsCommunicationsPage({ messages, summary }: Props) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [retryingId, setRetryingId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return messages.filter((message) => {
            const matchesStatus = status === 'all' || message.status === status;
            const matchesSearch = !query || [message.studentName, message.studentCode, message.phone, message.message]
                .some((value) => value.toLowerCase().includes(query));

            return matchesStatus && matchesSearch;
        });
    }, [messages, search, status]);

    const retryMessage = (message: SmsMessage) => {
        setRetryingId(message.id);
        router.post(retry.url(message.routeKey as never), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('SMS sent successfully.'),
            onError: (errors) => toast.error(errors.sms ?? 'Unable to retry SMS.'),
            onFinish: () => setRetryingId(null),
        });
    };

    return (
        <AdminShell>
            <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
                <section className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                    <div>
                        <span className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400"><MessageSquareText size={16} /> Parent communication</span>
                        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">SMS Communications</h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">Track PlasGate parent-link delivery and retry eligible failures.</p>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        ['Messages', summary.total, 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'],
                        ['Sent', summary.sent, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'],
                        ['Failed', summary.failed, 'text-red-600 bg-red-50 dark:bg-red-500/10'],
                        ['Attempts', summary.attempts, 'text-violet-600 bg-violet-50 dark:bg-violet-500/10'],
                    ].map(([label, value, tone]) => (
                        <div key={String(label)} className={`rounded-lg border border-current/10 p-4 ${tone}`}>
                            <strong className="block text-2xl font-black">{value}</strong>
                            <span className="text-xs font-black opacity-70">{label}</span>
                        </div>
                    ))}
                </section>

                <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[180px_1fr]">
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                        <option value="all">All statuses</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="pending">Pending</option>
                    </select>
                    <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-slate-700">
                        <Search size={16} className="text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, phone, or message" className="w-full bg-transparent text-sm font-semibold outline-none" />
                    </label>
                </section>

                <section className="grid gap-3">
                    {filtered.map((message) => (
                        <article key={message.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-black text-slate-950 dark:text-white">{message.studentName}</h2>
                                        {message.studentCode && <span className="text-xs font-bold text-slate-400">{message.studentCode}</span>}
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${statusStyles[message.status]}`}>{message.status}</span>
                                    </div>
                                    <p className="mt-1 text-sm font-bold text-slate-500">{message.phone} · {message.provider} · {message.sender}</p>
                                </div>
                                {message.canRetry && (
                                    <button onClick={() => retryMessage(message)} disabled={retryingId === message.id} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-60">
                                        <RefreshCw size={14} className={retryingId === message.id ? 'animate-spin' : ''} /> Retry
                                    </button>
                                )}
                            </div>
                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{message.message}</p>
                            {message.failureReason && <div className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300"><TriangleAlert size={16} className="shrink-0" />{message.failureReason}</div>}
                            {message.providerResponse && (
                                <details className="mt-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
                                    <summary className="cursor-pointer font-black text-slate-600 dark:text-slate-300">Provider response</summary>
                                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-slate-500">{message.providerResponse}</pre>
                                </details>
                            )}
                            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-4">
                                <span>Attempts: {message.attemptCount}</span><span>HTTP: {message.providerStatus ?? '-'}</span><span>Last attempt: {message.lastAttemptedAt ?? '-'}</span><span>Sent: {message.sentAt ?? '-'}</span>
                            </div>
                        </article>
                    ))}
                    {filtered.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-500">No SMS communications found.</div>}
                </section>
            </div>
        </AdminShell>
    );
}
