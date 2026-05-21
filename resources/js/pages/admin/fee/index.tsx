import { create as createFee, destroy, edit as editFee, payment as recordPayment } from '@/actions/App/Http/Controllers/Backends/FeeChargeController';
import { DatePicker } from '@/components/ui/date-picker';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Avatar, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, Trash2, Wallet, X } from 'lucide-react';
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
        if (!canRecordPayment) {
            return;
        }

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
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Fee Management</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Track monthly fee charges and payments</div>
                    </div>
                    {canCreate && <Link href={createFee.url()} className="admin-btn admin-btn-primary">
                        + New Fee Charge
                    </Link>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                    {[
                        { l: 'Collected', v: `$${Number(summary.collected).toFixed(2)}`, c: '#10b981', bg: '#f0fdf4' },
                        { l: 'Outstanding', v: `$${Number(summary.outstanding).toFixed(2)}`, c: '#f59e0b', bg: '#fffbeb' },
                        { l: 'Paid Count', v: summary.paidCount, c: '#3b82f6', bg: '#eff6ff' },
                        { l: 'Unpaid Count', v: summary.unpaidCount, c: '#ef4444', bg: '#fff1f2' },
                    ].map(item => (
                        <div key={item.l} style={{ background: item.bg, borderRadius: 14, padding: 16, border: `1px solid ${item.c}30` }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: item.c, marginBottom: 2 }}>{item.v}</div>
                            <div style={{ fontSize: 11, color: item.c, opacity: 0.7 }}>{item.l}</div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        {([
                            { id: 'all', l: 'All' },
                            { id: 'paid', l: 'Paid' },
                            { id: 'unpaid', l: 'Unpaid' },
                            { id: 'partial', l: 'Partial' },
                        ] as { id: FeeFilter; l: string }[]).map(item => (
                            <button key={item.id} onClick={() => setFilter(item.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderColor: filter === item.id ? '#3b82f6' : '#e2e8f0', background: filter === item.id ? '#eff6ff' : 'white', color: filter === item.id ? '#2563eb' : '#64748b' }}>
                                {item.l}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <AdminSelect
                            value={chargeOrderBy}
                            onChange={value => setChargeOrderBy(value as ChargeOrderKey)}
                            options={CHARGE_ORDER_OPTIONS}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <AdminSelect
                            value={chargePerPage.toString()}
                            onChange={value => setChargePerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            style={{ minWidth: 130 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filteredCharges.length} charge{filteredCharges.length !== 1 ? 's' : ''}</span>
                        <input value={chargeSearch} onChange={event => setChargeSearch(event.target.value)} className="f-input" style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }} placeholder="Search fee charges..." />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
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
                                        <td colSpan={canManageFee ? 7 : 6} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                            {chargeSearch ? <>No fee charges found for <strong>"{chargeSearch}"</strong></> : 'Data not found'}
                                        </td>
                                    </tr>
                                ) : paginatedCharges.map(charge => (
                                    <tr key={charge.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={charge.studentNameEn} size={32} />
                                                <div>
                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{charge.studentNameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{charge.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><Badge type="blue">{charge.level || charge.className}</Badge></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{charge.billingMonth}</td>
                                        <td style={{ fontWeight: 700 }}>${charge.amount.toFixed(2)}</td>
                                        <td style={{ fontWeight: 700 }}>${charge.paidAmount.toFixed(2)}</td>
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
                    </div>
                    {filteredCharges.length > 0 && <Pagination total={filteredCharges.length} page={chargePage} perPage={chargePerPage} onPageChange={setChargePage} onPerPageChange={setChargePerPage} showPerPage={false} />}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Payments</span>
                        <AdminSelect
                            value={paymentOrderBy}
                            onChange={value => setPaymentOrderBy(value as PaymentOrderKey)}
                            options={PAYMENT_ORDER_OPTIONS}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <AdminSelect
                            value={paymentPerPage.toString()}
                            onChange={value => setPaymentPerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            style={{ minWidth: 130 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{sortedPayments.length} result{sortedPayments.length !== 1 ? 's' : ''}</span>
                        <input value={paymentSearch} onChange={event => setPaymentSearch(event.target.value)} className="f-input" style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }} placeholder="Search payments..." />
                    </div>
                    <table className="data-table">
                        <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid On</th><th>Month</th></tr></thead>
                        <tbody>
                            {paginatedPayments.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>{paymentSearch ? <>No payments found for <strong>"{paymentSearch}"</strong></> : 'Data not found'}</td></tr>
                            ) : paginatedPayments.map(payment => (
                                <tr key={payment.id}>
                                    <td>{payment.studentNameEn}</td>
                                    <td style={{ fontWeight: 700 }}>${payment.amount.toFixed(2)}</td>
                                    <td>{payment.method}</td>
                                    <td><Badge type={payment.status === 'verified' || payment.status === 'paid' ? 'green' : 'amber'}>{payment.status}</Badge></td>
                                    <td>{payment.paidOn}</td>
                                    <td>{payment.billingMonth}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedPayments.length > 0 && <Pagination total={sortedPayments.length} page={paymentPage} perPage={paymentPerPage} onPageChange={setPaymentPage} onPerPageChange={setPaymentPerPage} showPerPage={false} />}
                </div>
            </div>

            {payTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={event => { if (event.target === event.currentTarget) setPayTarget(null); }}>
                    <form onSubmit={submitPayment} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Record Payment</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{payTarget.studentNameEn} - {payTarget.billingMonth}</div>
                        </div>
                        <input type="number" step="0.01" className="f-input" value={paymentForm.data.amount} onChange={event => paymentForm.setData('amount', event.target.value)} />
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
                        />
                        <DatePicker value={paymentForm.data.paid_on} onChange={value => paymentForm.setData('paid_on', value)} className="f-input min-h-[42px]" />
                        <input className="f-input" placeholder="Reference" value={paymentForm.data.reference} onChange={event => paymentForm.setData('reference', event.target.value)} />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" onClick={() => setPayTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                            <button disabled={paymentForm.processing} type="submit" style={{ flex: 2, background: paymentForm.processing ? '#93c5fd' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: paymentForm.processing ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CheckCircle2 size={15} /> Confirm Payment</button>
                        </div>
                    </form>
                </div>
            )}

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Fee Charge?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Are you sure you want to remove this fee charge?</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}



