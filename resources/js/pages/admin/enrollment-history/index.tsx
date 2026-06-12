import AdminShell from '@/pages/admin/shell';
import { ArrowRight, History, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface HistoryItem {
    id: number;
    studentName: string;
    studentCode: string;
    eventType: string;
    fromLevel: string;
    toLevel: string;
    fromClass: string;
    toClass: string;
    fromStatus: string;
    toStatus: string;
    effectiveOn: string;
    note: string;
    changedBy: string;
    createdAt: string;
}

interface Props {
    histories: HistoryItem[];
    summary: { total: number; enrolled: number; promotions: number; transfers: number; withdrawals: number };
}

const eventTone: Record<string, string> = {
    enrolled: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    promotion: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    transfer: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    withdrawal: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    reactivated: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    'status-change': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export default function EnrollmentHistoryPage({ histories, summary }: Props) {
    const [search, setSearch] = useState('');
    const [eventType, setEventType] = useState('all');

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return histories.filter((item) => (eventType === 'all' || item.eventType === eventType)
            && (!query || [item.studentName, item.studentCode, item.fromClass, item.toClass, item.fromLevel, item.toLevel].some((value) => value.toLowerCase().includes(query))));
    }, [histories, search, eventType]);

    return (
        <AdminShell>
            <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
                <section className="border-b border-slate-200 pb-5 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400"><History size={16} /> Student lifecycle</span>
                    <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Enrollment History</h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Audit enrollment, promotions, class transfers, withdrawals, and reactivations.</p>
                </section>
                <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {Object.entries({ All: summary.total, Enrolled: summary.enrolled, Promotions: summary.promotions, Transfers: summary.transfers, Withdrawals: summary.withdrawals }).map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-black text-slate-400">{label}</span></div>
                    ))}
                </section>
                <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[190px_1fr]">
                    <select value={eventType} onChange={(event) => setEventType(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                        <option value="all">All events</option><option value="enrolled">Enrolled</option><option value="promotion">Promotions</option><option value="transfer">Transfers</option><option value="withdrawal">Withdrawals</option><option value="reactivated">Reactivated</option>
                    </select>
                    <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-slate-700"><Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, class, or level" className="w-full bg-transparent text-sm font-semibold outline-none" /></label>
                </section>
                <section className="grid gap-3">
                    {filtered.map((item) => (
                        <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{item.studentName}</h2><span className="text-xs font-bold text-slate-400">{item.studentCode}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${eventTone[item.eventType] ?? eventTone['status-change']}`}>{item.eventType.replace('-', ' ')}</span></div><p className="mt-1 text-xs font-bold text-slate-400">{item.effectiveOn} · Changed by {item.changedBy}</p></div></div>
                            <div className="mt-4 grid items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950 md:grid-cols-[1fr_auto_1fr]">
                                <div><span className="text-[10px] font-black text-slate-400 uppercase">Previous</span><p className="mt-1 text-sm font-bold">{item.fromLevel || '—'} · {item.fromClass || '—'}</p><p className="text-xs font-semibold text-slate-500">{item.fromStatus || '—'}</p></div>
                                <ArrowRight size={18} className="text-slate-400" />
                                <div><span className="text-[10px] font-black text-slate-400 uppercase">New</span><p className="mt-1 text-sm font-bold">{item.toLevel || '—'} · {item.toClass || '—'}</p><p className="text-xs font-semibold text-slate-500">{item.toStatus || '—'}</p></div>
                            </div>
                            {item.note && <p className="mt-3 text-xs font-semibold text-slate-500">{item.note}</p>}
                        </article>
                    ))}
                    {filtered.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-500">No enrollment history found.</div>}
                </section>
            </div>
        </AdminShell>
    );
}
