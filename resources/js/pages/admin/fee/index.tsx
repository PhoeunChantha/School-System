import { create as createFee, destroy, edit as editFee, payment as recordPayment } from '@/actions/App/Http/Controllers/Backends/FeeChargeController';
import { DatePicker } from '@/components/ui/date-picker';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Avatar, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, Plus, Trash2, Wallet, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface FeeChargeItem {
    id: number;
    routeKey?: string;
    studentNameKh: string;
    studentNameEn: string;
    level: string;
    className: string;
    billingMonth: string;
    dueOn: string;
    amount: number;
    discountAmount: number;
    paidAmount: number;
    status: 'paid' | 'unpaid' | 'partial';
}

export interface PaymentItem {
    id: number;
    routeKey?: string;
    studentNameKh: string;
    studentNameEn: string;
    amount: number;
    method: string;
    status: string;
    paidOn: string;
    billingMonth: string;
    reference: string;
}

interface FeePageProps {
    charges: FeeChargeItem[];
    payments: PaymentItem[];
    summary: {
        collected: number;
        outstanding: number;
        paidCount: number;
        unpaidCount: number;
    };
}

type FeeFilter = 'all' | 'paid' | 'unpaid' | 'partial';
type ChargeOrderKey = 'name-asc' | 'name-desc' | 'amount-desc' | 'amount-asc' | 'status-asc' | 'month-desc';
type PaymentOrderKey = 'date-desc' | 'date-asc' | 'name-asc' | 'amount-desc' | 'amount-asc' | 'method-asc';

const CHARGE_ORDER_OPTIONS: { value: ChargeOrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A -> Z' },
    { value: 'name-desc', label: 'Name Z -> A' },
    { value: 'amount-desc', label: 'Amount Highest' },
    { value: 'amount-asc', label: 'Amount Lowest' },
    { value: 'status-asc', label: 'Status' },
    { value: 'month-desc', label: 'Month Newest' },
];

const PAYMENT_ORDER_OPTIONS: { value: PaymentOrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Date Newest' },
    { value: 'date-asc', label: 'Date Oldest' },
    { value: 'name-asc', label: 'Name A -> Z' },
    { value: 'amount-desc', label: 'Amount Highest' },
    { value: 'amount-asc', label: 'Amount Lowest' },
    { value: 'method-asc', label: 'Method' },
];

const statusRank: Record<FeeChargeItem['status'], number> = { unpaid: 0, partial: 1, paid: 2 };
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';

function sortCharges(list: FeeChargeItem[], order: ChargeOrderKey): FeeChargeItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'name-desc': return b.studentNameEn.localeCompare(a.studentNameEn);
            case 'amount-desc': return b.amount - a.amount;
            case 'amount-asc': return a.amount - b.amount;
            case 'status-asc': return statusRank[a.status] - statusRank[b.status];
            case 'month-desc': return b.billingMonth.localeCompare(a.billingMonth);
            default: return 0;
        }
    });
}

function sortPayments(list: PaymentItem[], order: PaymentOrderKey): PaymentItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc': return b.paidOn.localeCompare(a.paidOn);
            case 'date-asc': return a.paidOn.localeCompare(b.paidOn);
            case 'name-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'amount-desc': return b.amount - a.amount;
            case 'amount-asc': return a.amount - b.amount;
            case 'method-asc': return a.method.localeCompare(b.method);
            default: return 0;
        }
    });
}

function FeeStatusBadge({ status }: { status: FeeChargeItem['status'] }) {
    if (status === 'paid') return <Badge type="green">Paid</Badge>;
    if (status === 'partial') return <Badge type="amber">Partial</Badge>;
    return <Badge type="red">Unpaid</Badge>;
}

export default function FeePage({ charges, payments, summary }: FeePageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('fee.create');
    const canUpdate = can('fee.update');
    const canDelete = can('fee.delete');
    const canRecordPayment = can('fee-payments.create');
    const canManageFee = canAny(['fee.update', 'fee.delete', 'fee-payments.create']);
    const [filter, setFilter] = useState<FeeFilter>('all');
    const [chargeSearch, setChargeSearch] = useState('');
    const [chargeOrderBy, setChargeOrderBy] = useState<ChargeOrderKey>('name-asc');
    const [chargePage, setChargePage] = useState(1);
    const [chargePerPage, setChargePerPage] = useState(5);
    const [paymentOrderBy, setPaymentOrderBy] = useState<PaymentOrderKey>('date-desc');
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentPerPage, setPaymentPerPage] = useState(5);
    const [payTarget, setPayTarget] = useState<FeeChargeItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FeeChargeItem | null>(null);

    const paymentForm = useForm({
        amount: '',
        method: 'aba',
        status: 'paid',
        paid_on: new Date().toISOString().slice(0, 10),
        billing_month: '',
        reference: '',
        screenshot_path: '',
    });

    useEffect(() => { setChargePage(1); }, [filter, chargeSearch, chargeOrderBy, chargePerPage]);
    useEffect(() => { setPaymentPage(1); }, [paymentSearch, paymentOrderBy, paymentPerPage]);

    const filteredCharges = useMemo(() => {
        const query = chargeSearch.toLowerCase();
        const base = charges.filter(charge => {
            const matchesFilter = filter === 'all' || charge.status === filter;
            const matchesSearch = !query
                || charge.studentNameKh.includes(chargeSearch)
                || charge.studentNameEn.toLowerCase().includes(query)
                || charge.level.toLowerCase().includes(query)
                || charge.className.toLowerCase().includes(query)
                || charge.billingMonth.includes(chargeSearch)
                || charge.status.toLowerCase().includes(query);
            return matchesFilter && matchesSearch;
        });
        return sortCharges(base, chargeOrderBy);
    }, [charges, chargeOrderBy, chargeSearch, filter]);

    const paginatedCharges = useMemo(
        () => filteredCharges.slice((chargePage - 1) * chargePerPage, chargePage * chargePerPage),
        [filteredCharges, chargePage, chargePerPage],
    );

    const sortedPayments = useMemo(() => {
        const query = paymentSearch.toLowerCase();
        const base = payments.filter(payment =>
            !query
            || payment.studentNameKh.includes(paymentSearch)
            || payment.studentNameEn.toLowerCase().includes(query)
            || payment.method.toLowerCase().includes(query)
            || payment.status.toLowerCase().includes(query)
            || payment.paidOn.includes(paymentSearch)
            || payment.billingMonth.includes(paymentSearch)
            || payment.reference.toLowerCase().includes(query)
        );
        return sortPayments(base, paymentOrderBy);
    }, [payments, paymentOrderBy, paymentSearch]);

    const paginatedPayments = useMemo(
        () => sortedPayments.slice((paymentPage - 1) * paymentPerPage, paymentPage * paymentPerPage),
        [sortedPayments, paymentPage, paymentPerPage],
    );

    const openPayment = (charge: FeeChargeItem) => {
        if (!canRecordPayment) return;
        const balance = Math.max(0, charge.amount - charge.discountAmount - charge.paidAmount);
        setPayTarget(charge);
        paymentForm.setData({
            amount: String(balance || charge.amount),
            method: 'aba',
            status: 'paid',
            paid_on: new Date().toISOString().slice(0, 10),
            billing_month: `${charge.billingMonth}-01`,
            reference: '',
            screenshot_path: '',
        });
    };

    const submitPayment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!payTarget) return;
        if (!canRecordPayment) {
            setPayTarget(null);
            return;
        }
        paymentForm.post(recordPayment.url((payTarget.routeKey ?? payTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment recorded successfully.');
                setPayTarget(null);
                paymentForm.reset();
            },
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }
        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Fee charge deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6">
                <div className="hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Fee Management</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">Track monthly fee charges and payments</div>
                    </div>
                </div>

                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">Fee management</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">${Number(summary.collected).toFixed(2)}</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">Collected - ${Number(summary.outstanding).toFixed(2)} outstanding</p>
                    </div>
                    {canCreate && (
                        <Link href={createFee.url()} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="New fee charge">
                            <Plus size={18} />
                        </Link>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { l: 'Collected', v: `$${Number(summary.collected).toFixed(2)}`, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { l: 'Outstanding', v: `$${Number(summary.outstanding).toFixed(2)}`, className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
                        { l: 'Paid Count', v: summary.paidCount, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { l: 'Unpaid Count', v: summary.unpaidCount, className: 'border-red-500/25 bg-red-500/10 text-red-500' },
                    ].map(item => (
                        <div key={item.l} className={`rounded-[18px] border p-3 ${item.className}`}>
                            <div className="text-2xl font-black leading-none">{item.v}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{item.l}</div>
                        </div>
                    ))}
                </div>

                <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="mb-3 flex flex-wrap gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:border-x-0 md:border-t-0 md:shadow-none">
                        {([
                            { id: 'all', l: 'All' },
                            { id: 'paid', l: 'Paid' },
                            { id: 'unpaid', l: 'Unpaid' },
                            { id: 'partial', l: 'Partial' },
                        ] as { id: FeeFilter; l: string }[]).map(item => (
                            <button key={item.id} onClick={() => setFilter(item.id)} className={`min-h-9 rounded-xl border px-3 py-2 text-xs font-black transition ${filter === item.id ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>
                                {item.l}
                            </button>
                        ))}
                    </div>
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                            <AdminSelect value={chargeOrderBy} onChange={value => setChargeOrderBy(value as ChargeOrderKey)} options={CHARGE_ORDER_OPTIONS} className="min-w-0 md:w-[170px]" triggerClassName={controlInputClass} />
                            <AdminSelect value={chargePerPage.toString()} onChange={value => setChargePerPage(Number(value))} options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))} className="min-w-0 md:w-[130px]" triggerClassName={controlInputClass} />
                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filteredCharges.length} charge{filteredCharges.length !== 1 ? 's' : ''}</span>
                        </div>
                        <input value={chargeSearch} onChange={event => setChargeSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`} placeholder="Search fee charges..." />
                    </div>

                    <table className={`${desktopTableClass} w-full md:min-w-full`}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Level</th>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Status</th>
                                {canManageFee && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCharges.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageFee ? 7 : 6} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {chargeSearch ? <>No fee charges found for <strong>"{chargeSearch}"</strong></> : 'Data not found'}
                                    </td>
                                </tr>
                            ) : paginatedCharges.map(charge => (
                                <tr key={charge.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={charge.studentNameEn} size={32} />
                                            <div>
                                                <KH className="block text-[13px] font-black text-slate-900 dark:text-slate-50">{charge.studentNameKh}</KH>
                                                <div className="text-[11px] font-bold text-slate-400">{charge.studentNameEn}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><Badge type="blue">{charge.level || charge.className}</Badge></td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{charge.billingMonth}</td>
                                    <td className="text-xs font-black text-slate-900 dark:text-slate-50">${charge.amount.toFixed(2)}</td>
                                    <td className="text-xs font-black text-slate-900 dark:text-slate-50">${charge.paidAmount.toFixed(2)}</td>
                                    <td><FeeStatusBadge status={charge.status} /></td>
                                    {canManageFee && (
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${charge.studentNameEn}`}
                                                actions={[
                                                    { key: 'pay', label: 'Pay', icon: Wallet, onSelect: () => openPayment(charge), hidden: !(canRecordPayment && charge.status !== 'paid') },
                                                    { key: 'edit', label: 'Edit', icon: Edit3, href: editFee.url((charge.routeKey ?? charge.id) as never), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(charge), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginatedCharges.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {chargeSearch ? <>No fee charges found for <strong>"{chargeSearch}"</strong></> : 'Data not found'}
                            </div>
                        ) : paginatedCharges.map(charge => {
                            const balance = Math.max(0, charge.amount - charge.discountAmount - charge.paidAmount);
                            return (
                                <article key={charge.id} className={mobileCardClass}>
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar name={charge.studentNameEn} size={36} />
                                            <div className="min-w-0">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{charge.studentNameKh}</KH>
                                                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{charge.studentNameEn}</p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <FeeStatusBadge status={charge.status} />
                                            {canManageFee && (
                                                <RowActions
                                                    ariaLabel={`Actions for ${charge.studentNameEn}`}
                                                    actions={[
                                                        { key: 'pay', label: 'Pay', icon: Wallet, onSelect: () => openPayment(charge), hidden: !(canRecordPayment && charge.status !== 'paid') },
                                                        { key: 'edit', label: 'Edit', icon: Edit3, href: editFee.url((charge.routeKey ?? charge.id) as never), hidden: !canUpdate },
                                                        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(charge), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                    ]}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950"><span className="block text-[9px] font-black uppercase text-slate-400">Month</span><strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{charge.billingMonth}</strong></div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950"><span className="block text-[9px] font-black uppercase text-slate-400">Amount</span><strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">${charge.amount.toFixed(2)}</strong></div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950"><span className="block text-[9px] font-black uppercase text-slate-400">Paid</span><strong className="mt-1 block text-xs font-black text-emerald-500">${charge.paidAmount.toFixed(2)}</strong></div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black dark:bg-slate-950">
                                        <span className="text-slate-400">{charge.level || charge.className}</span>
                                        <span className={balance > 0 ? 'text-red-500' : 'text-emerald-500'}>${balance.toFixed(2)} due</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    {filteredCharges.length > 0 && <Pagination total={filteredCharges.length} page={chargePage} perPage={chargePerPage} onPageChange={setChargePage} onPerPageChange={setChargePerPage} showPerPage={false} />}
                </section>

                <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Payments</span>
                            <AdminSelect value={paymentOrderBy} onChange={value => setPaymentOrderBy(value as PaymentOrderKey)} options={PAYMENT_ORDER_OPTIONS} className="min-w-0 md:w-[170px]" triggerClassName={controlInputClass} />
                            <AdminSelect value={paymentPerPage.toString()} onChange={value => setPaymentPerPage(Number(value))} options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))} className="min-w-0 md:w-[130px]" triggerClassName={controlInputClass} />
                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{sortedPayments.length} result{sortedPayments.length !== 1 ? 's' : ''}</span>
                        </div>
                        <input value={paymentSearch} onChange={event => setPaymentSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`} placeholder="Search payments..." />
                    </div>
                    <table className={`${desktopTableClass} w-full md:min-w-full`}>
                        <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid On</th><th>Month</th></tr></thead>
                        <tbody>
                            {paginatedPayments.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">{paymentSearch ? <>No payments found for <strong>"{paymentSearch}"</strong></> : 'Data not found'}</td></tr>
                            ) : paginatedPayments.map(payment => (
                                <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td className="text-xs font-bold text-slate-700 dark:text-slate-200">{payment.studentNameEn}</td>
                                    <td className="text-xs font-black text-slate-900 dark:text-slate-50">${payment.amount.toFixed(2)}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{payment.method}</td>
                                    <td><Badge type={payment.status === 'verified' || payment.status === 'paid' ? 'green' : 'amber'}>{payment.status}</Badge></td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{payment.paidOn}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{payment.billingMonth}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="grid gap-3 md:hidden">
                        {paginatedPayments.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {paymentSearch ? <>No payments found for <strong>"{paymentSearch}"</strong></> : 'Data not found'}
                            </div>
                        ) : paginatedPayments.map(payment => (
                            <article key={payment.id} className={mobileCardClass}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <strong className="block text-sm font-black text-slate-900 dark:text-slate-50">{payment.studentNameEn}</strong>
                                        <span className="text-[11px] font-bold text-slate-400">{payment.paidOn} - {payment.billingMonth}</span>
                                    </div>
                                    <Badge type={payment.status === 'verified' || payment.status === 'paid' ? 'green' : 'amber'}>{payment.status}</Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950"><span className="block text-[9px] font-black uppercase text-slate-400">Amount</span><strong className="mt-1 block text-xs font-black text-emerald-500">${payment.amount.toFixed(2)}</strong></div>
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950"><span className="block text-[9px] font-black uppercase text-slate-400">Method</span><strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{payment.method}</strong></div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {sortedPayments.length > 0 && <Pagination total={sortedPayments.length} page={paymentPage} perPage={paymentPerPage} onPageChange={setPaymentPage} onPerPageChange={setPaymentPerPage} showPerPage={false} />}
                </section>
            </div>

            {payTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4" onClick={event => { if (event.target === event.currentTarget) setPayTarget(null); }}>
                    <form onSubmit={submitPayment} className="grid w-full max-w-[440px] gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div>
                            <div className="text-lg font-black text-slate-900 dark:text-slate-50">Record Payment</div>
                            <div className="mt-0.5 text-xs font-bold text-slate-400">{payTarget.studentNameEn} - {payTarget.billingMonth}</div>
                        </div>
                        <input type="number" step="0.01" className={fieldInputClass} value={paymentForm.data.amount} onChange={event => paymentForm.setData('amount', event.target.value)} />
                        <AdminSelect
                            value={paymentForm.data.method}
                            onChange={value => paymentForm.setData('method', value)}
                            options={[
                                { value: 'aba', label: 'ABA' },
                                { value: 'acleda', label: 'ACLEDA' },
                                { value: 'wing', label: 'Wing' },
                                { value: 'cash', label: 'Cash' },
                                { value: 'bank', label: 'Bank' },
                            ]}
                            triggerClassName={fieldInputClass}
                        />
                        <DatePicker value={paymentForm.data.paid_on} onChange={value => paymentForm.setData('paid_on', value)} className={fieldInputClass} />
                        <input className={fieldInputClass} placeholder="Reference" value={paymentForm.data.reference} onChange={event => paymentForm.setData('reference', event.target.value)} />
                        <div className="grid grid-cols-[1fr_2fr] gap-2">
                            <button type="button" onClick={() => setPayTarget(null)} className={ghostButtonClass}><X size={15} /> Cancel</button>
                            <button disabled={paymentForm.processing} type="submit" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-default disabled:bg-emerald-300"><CheckCircle2 size={15} /> Confirm Payment</button>
                        </div>
                    </form>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Fee Charge?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Are you sure you want to remove this fee charge?</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className={ghostButtonClass}><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white transition hover:bg-red-600"><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
