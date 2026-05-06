import {
    PAYMENTS,
    STUDENTS,
    type Payment,
    type Student,
} from '@/pages/admin/data';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, FeeTag, KH, Pagination } from '@/pages/admin/ui';
import { useEffect, useMemo, useState } from 'react';

type FeeFilter = 'all' | 'paid' | 'unpaid' | 'partial';
type StudentOrderKey =
    | 'name-asc'
    | 'name-desc'
    | 'amount-desc'
    | 'amount-asc'
    | 'status-asc'
    | 'level-asc';
type PaymentOrderKey =
    | 'date-desc'
    | 'date-asc'
    | 'name-asc'
    | 'amount-desc'
    | 'amount-asc'
    | 'method-asc'
    | 'status-asc';

const STUDENT_ORDER_OPTIONS: { value: StudentOrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A → Z' },
    { value: 'name-desc', label: 'Name Z → A' },
    { value: 'amount-desc', label: 'Amount ↓ Highest' },
    { value: 'amount-asc', label: 'Amount ↑ Lowest' },
    { value: 'status-asc', label: 'Status' },
    { value: 'level-asc', label: 'Level' },
];

const PAYMENT_ORDER_OPTIONS: { value: PaymentOrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Date ↓ Newest' },
    { value: 'date-asc', label: 'Date ↑ Oldest' },
    { value: 'name-asc', label: 'Name A → Z' },
    { value: 'amount-desc', label: 'Amount ↓ Highest' },
    { value: 'amount-asc', label: 'Amount ↑ Lowest' },
    { value: 'method-asc', label: 'Method' },
    { value: 'status-asc', label: 'Status' },
];

const feeStatusRank: Record<Student['fees'], number> = {
    Unpaid: 0,
    Partial: 1,
    Paid: 2,
};

function sortStudentsByFee(list: Student[], order: StudentOrderKey): Student[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc':
                return a.nameEn.localeCompare(b.nameEn);
            case 'name-desc':
                return b.nameEn.localeCompare(a.nameEn);
            case 'amount-desc':
                return b.amt - a.amt;
            case 'amount-asc':
                return a.amt - b.amt;
            case 'status-asc':
                return feeStatusRank[a.fees] - feeStatusRank[b.fees];
            case 'level-asc':
                return a.level.localeCompare(b.level);
            default:
                return 0;
        }
    });
}

function sortPayments(list: Payment[], order: PaymentOrderKey): Payment[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc':
                return b.date.localeCompare(a.date);
            case 'date-asc':
                return a.date.localeCompare(b.date);
            case 'name-asc':
                return a.nameEn.localeCompare(b.nameEn);
            case 'amount-desc':
                return b.amount - a.amount;
            case 'amount-asc':
                return a.amount - b.amount;
            case 'method-asc':
                return a.method.localeCompare(b.method);
            case 'status-asc':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });
}

export default function FeePage() {
    const [filter, setFilter] = useState<FeeFilter>('all');
    const [studentOrderBy, setStudentOrderBy] =
        useState<StudentOrderKey>('name-asc');
    const [studentPage, setStudentPage] = useState(1);
    const [studentPerPage, setStudentPerPage] = useState(5);
    const [paymentOrderBy, setPaymentOrderBy] =
        useState<PaymentOrderKey>('date-desc');
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentPerPage, setPaymentPerPage] = useState(5);
    const [showModal, setShowModal] = useState<Student | null>(null);
    const [method, setMethod] = useState('ABA');
    const [step, setStep] = useState(1);
    const [done, setDone] = useState(false);
    const [screenshot, setScreenshot] = useState(false);

    const filtered = useMemo(() => {
        const base =
            filter === 'all'
                ? STUDENTS
                : STUDENTS.filter((s) =>
                      filter === 'paid'
                          ? s.fees === 'Paid'
                          : filter === 'unpaid'
                            ? s.fees === 'Unpaid'
                            : s.fees === 'Partial',
                  );

        return sortStudentsByFee(base, studentOrderBy);
    }, [filter, studentOrderBy]);

    const paginatedStudents = useMemo(
        () =>
            filtered.slice(
                (studentPage - 1) * studentPerPage,
                studentPage * studentPerPage,
            ),
        [filtered, studentPage, studentPerPage],
    );

    const sortedPayments = useMemo(
        () => sortPayments(PAYMENTS, paymentOrderBy),
        [paymentOrderBy],
    );

    const paginatedPayments = useMemo(
        () =>
            sortedPayments.slice(
                (paymentPage - 1) * paymentPerPage,
                paymentPage * paymentPerPage,
            ),
        [sortedPayments, paymentPage, paymentPerPage],
    );

    useEffect(() => {
        setStudentPage(1);
    }, [filter, studentOrderBy, studentPerPage]);
    useEffect(() => {
        setPaymentPage(1);
    }, [paymentOrderBy, paymentPerPage]);

    const totalCollected = PAYMENTS.filter(
        (p) => p.status === 'verified',
    ).reduce((a, p) => a + p.amount, 0);

    const openModal = (s: Student) => {
        setShowModal(s);
        setStep(1);
        setDone(false);
        setScreenshot(false);
    };

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                {/* Summary cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill,minmax(160px,1fr))',
                        gap: 12,
                    }}
                >
                    {[
                        {
                            lk: 'ប្រមូលបាន',
                            l: 'Collected',
                            v: `$${totalCollected}`,
                            c: '#10b981',
                            bg: '#f0fdf4',
                        },
                        {
                            lk: 'នៅខ្វះ',
                            l: 'Outstanding',
                            v: '$450',
                            c: '#f59e0b',
                            bg: '#fffbeb',
                        },
                        {
                            lk: 'ក្បាលគ្រប',
                            l: 'Paid Count',
                            v: STUDENTS.filter((s) => s.fees === 'Paid').length,
                            c: '#3b82f6',
                            bg: '#eff6ff',
                        },
                        {
                            lk: 'មិនទាន់',
                            l: 'Unpaid Count',
                            v: STUDENTS.filter((s) => s.fees === 'Unpaid')
                                .length,
                            c: '#ef4444',
                            bg: '#fff1f2',
                        },
                    ].map((s, i) => (
                        <div
                            key={i}
                            style={{
                                background: s.bg,
                                borderRadius: 14,
                                padding: 16,
                                border: `1px solid ${s.c}30`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 24,
                                    fontWeight: 800,
                                    color: s.c,
                                    marginBottom: 2,
                                }}
                            >
                                {s.v}
                            </div>
                            <KH
                                style={{
                                    fontSize: 12,
                                    color: s.c,
                                    display: 'block',
                                    opacity: 0.8,
                                }}
                            >
                                {s.lk}
                            </KH>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: s.c,
                                    opacity: 0.6,
                                }}
                            >
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Student fee table */}
                <div className="card">
                    <div
                        style={{
                            padding: '16px 20px 0',
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 4,
                        }}
                    >
                        {(
                            [
                                { id: 'all', l: 'All' },
                                { id: 'paid', l: 'Paid ✓' },
                                { id: 'unpaid', l: 'Unpaid ✗' },
                                { id: 'partial', l: 'Partial ~' },
                            ] as { id: FeeFilter; l: string }[]
                        ).map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    border: '1.5px solid',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    borderColor:
                                        filter === f.id ? '#3b82f6' : '#e2e8f0',
                                    background:
                                        filter === f.id ? '#eff6ff' : 'white',
                                    color:
                                        filter === f.id ? '#2563eb' : '#64748b',
                                }}
                            >
                                {f.l}
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#94a3b8',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Sort by
                        </span>
                        <select
                            value={studentOrderBy}
                            onChange={(e) =>
                                setStudentOrderBy(
                                    e.target.value as StudentOrderKey,
                                )
                            }
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {STUDENT_ORDER_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>

                        <div
                            style={{
                                width: 1,
                                height: 18,
                                background: '#e2e8f0',
                                margin: '0 2px',
                            }}
                        />

                        <select
                            value={studentPerPage}
                            onChange={(e) => {
                                setStudentPerPage(Number(e.target.value));
                                setStudentPage(1);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {[5, 10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} per page
                                </option>
                            ))}
                        </select>

                        <span
                            style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                marginLeft: 4,
                            }}
                        >
                            {filtered.length} student
                            {filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Level</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Month</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <Avatar
                                                    name={s.nameEn}
                                                    size={32}
                                                />
                                                <div>
                                                    <KH
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 13,
                                                            display: 'block',
                                                        }}
                                                    >
                                                        {s.nameKh}
                                                    </KH>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        {s.nameEn}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge type="blue">{s.level}</Badge>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700 }}>
                                                ${s.amt}
                                            </span>
                                        </td>
                                        <td>
                                            <FeeTag status={s.fees} />
                                        </td>
                                        <td
                                            style={{
                                                fontSize: 12,
                                                color: '#64748b',
                                            }}
                                        >
                                            May 2026
                                        </td>
                                        <td>
                                            {s.fees !== 'Paid' && (
                                                <button
                                                    onClick={() => openModal(s)}
                                                    style={{
                                                        background: '#eff6ff',
                                                        color: '#2563eb',
                                                        border: '1px solid #bfdbfe',
                                                        borderRadius: 7,
                                                        padding: '5px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    + Record
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        total={filtered.length}
                        page={studentPage}
                        perPage={studentPerPage}
                        onPageChange={setStudentPage}
                        onPerPageChange={setStudentPerPage}
                        showPerPage={false}
                    />
                </div>

                {/* Payment history */}
                <div className="card">
                    <div
                        style={{
                            padding: '16px 20px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <KH
                            style={{
                                fontWeight: 800,
                                fontSize: 15,
                                display: 'block',
                            }}
                        >
                            ប្រវត្តិការទូទាត់
                        </KH>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {sortedPayments.length} payment
                            {sortedPayments.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 16px',
                            borderTop: '1px solid #f1f5f9',
                            borderBottom: '1px solid #f1f5f9',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#94a3b8',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Sort by
                        </span>
                        <select
                            value={paymentOrderBy}
                            onChange={(e) =>
                                setPaymentOrderBy(
                                    e.target.value as PaymentOrderKey,
                                )
                            }
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {PAYMENT_ORDER_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>

                        <div
                            style={{
                                width: 1,
                                height: 18,
                                background: '#e2e8f0',
                                margin: '0 2px',
                            }}
                        />

                        <select
                            value={paymentPerPage}
                            onChange={(e) => {
                                setPaymentPerPage(Number(e.target.value));
                                setPaymentPage(1);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {[5, 10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} per page
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayments.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <KH
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {p.nameKh}
                                            </KH>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                {p.nameEn}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700 }}>
                                                ${p.amount}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge type="blue">
                                                {p.method}
                                            </Badge>
                                        </td>
                                        <td
                                            style={{
                                                fontSize: 12,
                                                color: '#64748b',
                                            }}
                                        >
                                            {p.date}
                                        </td>
                                        <td>
                                            <Badge
                                                type={
                                                    p.status === 'verified'
                                                        ? 'green'
                                                        : p.status === 'pending'
                                                          ? 'amber'
                                                          : 'blue'
                                                }
                                            >
                                                {p.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        total={sortedPayments.length}
                        page={paymentPage}
                        perPage={paymentPerPage}
                        onPageChange={setPaymentPage}
                        onPerPageChange={setPaymentPerPage}
                        showPerPage={false}
                    />
                </div>

                {/* Payment Modal */}
                {showModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 100,
                            padding: 16,
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget)
                                setShowModal(null);
                        }}
                    >
                        <div
                            style={{
                                background: 'white',
                                borderRadius: 20,
                                width: '100%',
                                maxWidth: 480,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                padding: 28,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!done ? (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 20,
                                        }}
                                    >
                                        <div>
                                            <KH
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 18,
                                                    display: 'block',
                                                }}
                                            >
                                                ទទួលការទូទាត់
                                            </KH>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Record Payment ·{' '}
                                                {showModal.nameEn}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(null)}
                                            style={{
                                                background: '#f1f5f9',
                                                border: 'none',
                                                borderRadius: 8,
                                                width: 32,
                                                height: 32,
                                                cursor: 'pointer',
                                                fontSize: 18,
                                                color: '#64748b',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'center',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            padding: 14,
                                            marginBottom: 20,
                                        }}
                                    >
                                        <Avatar
                                            name={showModal.nameEn}
                                            size={44}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <KH
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    display: 'block',
                                                }}
                                            >
                                                {showModal.nameKh}
                                            </KH>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#64748b',
                                                }}
                                            >
                                                {showModal.level}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                ${showModal.amt}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Due
                                            </div>
                                        </div>
                                    </div>

                                    {step === 1 && (
                                        <div>
                                            <div
                                                className="f-label"
                                                style={{ marginBottom: 10 }}
                                            >
                                                Payment Method
                                            </div>
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns:
                                                        '1fr 1fr',
                                                    gap: 10,
                                                    marginBottom: 20,
                                                }}
                                            >
                                                {[
                                                    { id: 'ABA', c: '#ef4444' },
                                                    {
                                                        id: 'ACLEDA',
                                                        c: '#2563eb',
                                                    },
                                                    {
                                                        id: 'Wing',
                                                        c: '#f59e0b',
                                                    },
                                                    {
                                                        id: 'Cash',
                                                        c: '#10b981',
                                                    },
                                                ].map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() =>
                                                            setMethod(m.id)
                                                        }
                                                        style={{
                                                            padding:
                                                                '12px 16px',
                                                            borderRadius: 12,
                                                            border: `2px solid ${method === m.id ? m.c : '#e2e8f0'}`,
                                                            background:
                                                                method === m.id
                                                                    ? m.c + '15'
                                                                    : 'white',
                                                            cursor: 'pointer',
                                                            fontWeight: 700,
                                                            fontSize: 14,
                                                            color:
                                                                method === m.id
                                                                    ? m.c
                                                                    : '#64748b',
                                                            transition:
                                                                'all 0.15s',
                                                        }}
                                                    >
                                                        {m.id}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setStep(2)}
                                                style={{
                                                    width: '100%',
                                                    background: '#2563eb',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 12,
                                                    padding: '13px',
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    cursor: 'pointer',
                                                    fontFamily:
                                                        "'Noto Sans Khmer',sans-serif",
                                                }}
                                            >
                                                បន្ត → Next
                                            </button>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div>
                                            <div className="f-group">
                                                <label className="f-label">
                                                    Amount (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="f-input"
                                                    defaultValue={showModal.amt}
                                                />
                                            </div>
                                            <div className="f-group">
                                                <label className="f-label">
                                                    Month
                                                </label>
                                                <select className="f-input">
                                                    <option>May 2026</option>
                                                    <option>June 2026</option>
                                                </select>
                                            </div>
                                            {method !== 'Cash' && (
                                                <div className="f-group">
                                                    <label className="f-label">
                                                        Payment Screenshot
                                                    </label>
                                                    <div
                                                        onClick={() =>
                                                            setScreenshot(true)
                                                        }
                                                        style={{
                                                            border: `2px dashed ${screenshot ? '#10b981' : '#cbd5e1'}`,
                                                            borderRadius: 12,
                                                            padding: 24,
                                                            textAlign: 'center',
                                                            cursor: 'pointer',
                                                            background:
                                                                screenshot
                                                                    ? '#f0fdf4'
                                                                    : '#f8fafc',
                                                            transition:
                                                                'all 0.2s',
                                                        }}
                                                    >
                                                        {screenshot ? (
                                                            <>
                                                                <div
                                                                    style={{
                                                                        fontSize: 32,
                                                                        marginBottom: 6,
                                                                    }}
                                                                >
                                                                    ✅
                                                                </div>
                                                                <KH
                                                                    style={{
                                                                        fontWeight: 700,
                                                                        color: '#16a34a',
                                                                        display:
                                                                            'block',
                                                                    }}
                                                                >
                                                                    បានបន្ថែម
                                                                </KH>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div
                                                                    style={{
                                                                        fontSize: 32,
                                                                        marginBottom: 6,
                                                                    }}
                                                                >
                                                                    📱
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 11,
                                                                        color: '#94a3b8',
                                                                    }}
                                                                >
                                                                    Upload
                                                                    payment
                                                                    screenshot
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 10,
                                                    marginTop: 8,
                                                }}
                                            >
                                                <button
                                                    onClick={() => setStep(1)}
                                                    style={{
                                                        flex: 1,
                                                        background: '#f1f5f9',
                                                        color: '#64748b',
                                                        border: 'none',
                                                        borderRadius: 12,
                                                        padding: '13px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    ← Back
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDone(true)
                                                    }
                                                    style={{
                                                        flex: 2,
                                                        background: '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 12,
                                                        padding: '13px',
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        cursor: 'pointer',
                                                        fontFamily:
                                                            "'Noto Sans Khmer',sans-serif",
                                                    }}
                                                >
                                                    ✓ Confirm Payment
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '20px 0',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 56,
                                            marginBottom: 12,
                                        }}
                                    >
                                        ✅
                                    </div>
                                    <KH
                                        style={{
                                            fontWeight: 800,
                                            fontSize: 22,
                                            display: 'block',
                                            marginBottom: 4,
                                        }}
                                    >
                                        រួចរាល់!
                                    </KH>
                                    <div
                                        style={{
                                            color: '#64748b',
                                            marginBottom: 20,
                                        }}
                                    >
                                        Payment recorded successfully
                                    </div>
                                    <button
                                        onClick={() => setShowModal(null)}
                                        style={{
                                            background: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 12,
                                            padding: '12px 32px',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
