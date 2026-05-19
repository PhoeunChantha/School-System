import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { CreditCard, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface FeesSummary {
    total: number;
    paid: number;
    pending: number;
    count: number;
    unpaidCount: number;
}

interface Fee {
    billingMonth: string;
    due: string;
    amount: number;
    paid: number;
    discount: number;
    balance: number;
    status: string;
}

interface Props {
    profile: StudentProfile;
    summary: FeesSummary;
    fees: Fee[];
}

function formatCurrency(n: number) {
    return '$' + n.toFixed(2);
}

function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusConfig(status: string) {
    if (status === 'paid')    return { label: 'Paid',    cls: 's-badge-green',  iconColor: '#059669', bg: '#dcfce7' };
    if (status === 'partial') return { label: 'Partial', cls: 's-badge-amber',  iconColor: '#d97706', bg: '#fef3c7' };
    return                           { label: 'Unpaid',  cls: 's-badge-red',    iconColor: '#e11d48', bg: '#fee2e2' };
}

export default function StudentFees({ profile, summary, fees }: Props) {
    const paidPct = summary.total > 0 ? (summary.paid / summary.total) * 100 : 0;

    return (
        <StudentShell profile={profile} activePage="fees" title="Fees">
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#fee2e2' }}>
                    <CreditCard size={18} color="#e11d48" />
                </div>
                <div className="s-page-title">Fees</div>
            </div>

            {/* ── Summary card ── */}
            <div className="s-card s-card-pad s-fade-up s-delay-1" style={{ marginBottom: 14 }}>
                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>Payment progress</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                            {Math.round(paidPct)}%
                        </span>
                    </div>
                    <div
                        style={{
                            height: 10,
                            background: '#f1f5f9',
                            borderRadius: 99,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${paidPct}%`,
                                background: paidPct >= 100 ? '#059669' : paidPct >= 50 ? '#2563eb' : '#e11d48',
                                borderRadius: 99,
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </div>
                </div>

                {/* 3 stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                        { label: 'Total',   val: formatCurrency(summary.total),   color: '#1a1a2e' },
                        { label: 'Paid',    val: formatCurrency(summary.paid),    color: '#059669' },
                        { label: 'Balance', val: formatCurrency(summary.pending), color: summary.pending > 0 ? '#e11d48' : '#9ca3af' },
                    ].map((s) => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontFamily: 'DM Serif Display, serif',
                                    fontSize: 16,
                                    color: s.color,
                                    lineHeight: 1,
                                    marginBottom: 4,
                                }}
                            >
                                {s.val}
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {summary.unpaidCount > 0 && (
                    <div
                        style={{
                            marginTop: 14,
                            padding: '10px 14px',
                            background: '#fee2e2',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <AlertTriangle size={15} color="#e11d48" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                            {summary.unpaidCount} unpaid {summary.unpaidCount === 1 ? 'month' : 'months'} — please contact the office
                        </span>
                    </div>
                )}
            </div>

            {/* ── Fee list ── */}
            {fees.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <span className="s-empty-icon">💳</span>
                        <div className="s-empty-text">No fee records found</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-2">
                    {fees.map((fee, i) => {
                        const cfg = statusConfig(fee.status);
                        return (
                            <div key={i} className="s-list-item">
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 13,
                                        background: cfg.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {fee.status === 'paid'    && <CheckCircle    size={18} color={cfg.iconColor} />}
                                    {fee.status === 'partial' && <Clock          size={18} color={cfg.iconColor} />}
                                    {fee.status === 'unpaid'  && <AlertTriangle  size={18} color={cfg.iconColor} />}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>
                                        {fee.billingMonth}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                                        Due {formatDate(fee.due)}
                                    </div>
                                    {fee.discount > 0 && (
                                        <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                                            Discount: {formatCurrency(fee.discount)}
                                        </div>
                                    )}
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
                                        {formatCurrency(fee.amount)}
                                    </div>
                                    <span className={`s-badge ${cfg.cls}`}>{cfg.label}</span>
                                    {fee.balance > 0 && fee.status !== 'paid' && (
                                        <div style={{ fontSize: 11, color: '#e11d48', fontWeight: 600, marginTop: 3 }}>
                                            Owed: {formatCurrency(fee.balance)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
