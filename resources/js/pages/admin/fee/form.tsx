import { FormEvent } from 'react';
import { index as feeIndex, store, update } from '@/actions/App/Http/Controllers/Backends/FeeChargeController';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export interface FeeStudentOption {
    id: number;
    nameKh: string;
    nameEn: string;
    levelId: number | null;
    level: string;
    className: string;
    monthlyFee: string | number;
}

export interface FeeChargeFormData {
    id?: number;
    student_id: number | null;
    level_id: number | null;
    billing_month: string;
    academic_year: string;
    due_on: string;
    amount: string | number;
    discount_amount: string | number;
    paid_amount: string | number;
    status: 'paid' | 'unpaid' | 'partial';
}

interface FeeChargeFormPageProps {
    mode: 'create' | 'edit';
    charge?: FeeChargeFormData;
    students: FeeStudentOption[];
}

const fieldStyle = {
    width: '100%',
    minHeight: 42,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1e293b',
};

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 };

export default function FeeChargeFormPage({ mode, charge, students }: FeeChargeFormPageProps) {
    const isEdit = mode === 'edit';
    const { data, setData, post, put, processing, errors } = useForm<FeeChargeFormData>({
        student_id: charge?.student_id ?? students[0]?.id ?? null,
        level_id: charge?.level_id ?? students[0]?.levelId ?? null,
        billing_month: charge?.billing_month ?? new Date().toISOString().slice(0, 8) + '01',
        academic_year: charge?.academic_year ?? new Date().getFullYear().toString(),
        due_on: charge?.due_on ?? '',
        amount: charge?.amount ?? students[0]?.monthlyFee ?? 0,
        discount_amount: charge?.discount_amount ?? 0,
        paid_amount: charge?.paid_amount ?? 0,
        status: charge?.status ?? 'unpaid',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(isEdit ? 'Fee charge updated.' : 'Fee charge created.'),
        };

        if (isEdit && charge?.id) {
            put(update.url(charge.id), options);
            return;
        }

        post(store.url(), options);
    };

    const selectStudent = (studentId: number) => {
        const student = students.find(item => item.id === studentId);
        setData(current => ({
            ...current,
            student_id: studentId,
            level_id: student?.levelId ?? null,
            amount: student?.monthlyFee ?? current.amount,
        }));
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{isEdit ? 'Edit Fee Charge' : 'New Fee Charge'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{isEdit ? 'Update billing details' : 'Create a monthly student fee charge'}</div>
                    </div>
                    <Link href={feeIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
                </div>

                <form onSubmit={submit} className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Student *</label>
                        <select style={fieldStyle} value={data.student_id ?? ''} onChange={event => selectStudent(Number(event.target.value))}>
                            {students.map(student => <option key={student.id} value={student.id}>{student.nameEn} · {student.level}</option>)}
                        </select>
                        {errors.student_id && <div className="field-error">{errors.student_id}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Billing Month *</label>
                        <input type="date" style={fieldStyle} value={data.billing_month} onChange={event => setData('billing_month', event.target.value)} />
                        {errors.billing_month && <div className="field-error">{errors.billing_month}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Due Date</label>
                        <input type="date" style={fieldStyle} value={data.due_on} onChange={event => setData('due_on', event.target.value)} />
                        {errors.due_on && <div className="field-error">{errors.due_on}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Amount *</label>
                        <input type="number" step="0.01" style={fieldStyle} value={data.amount} onChange={event => setData('amount', event.target.value)} />
                        {errors.amount && <div className="field-error">{errors.amount}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Discount</label>
                        <input type="number" step="0.01" style={fieldStyle} value={data.discount_amount} onChange={event => setData('discount_amount', event.target.value)} />
                        {errors.discount_amount && <div className="field-error">{errors.discount_amount}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Paid Amount</label>
                        <input type="number" step="0.01" style={fieldStyle} value={data.paid_amount} onChange={event => setData('paid_amount', event.target.value)} />
                        {errors.paid_amount && <div className="field-error">{errors.paid_amount}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Status *</label>
                        <select style={fieldStyle} value={data.status} onChange={event => setData('status', event.target.value as FeeChargeFormData['status'])}>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                        </select>
                        {errors.status && <div className="field-error">{errors.status}</div>}
                    </div>
                    <div>
                        <label style={labelStyle}>Academic Year</label>
                        <input style={fieldStyle} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                        {errors.academic_year && <div className="field-error">{errors.academic_year}</div>}
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                        <Link href={feeIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, textDecoration: 'none' }}>Cancel</Link>
                        <button disabled={processing} type="submit" style={{ background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: processing ? 'default' : 'pointer' }}>{isEdit ? 'Save Changes' : 'Create Fee Charge'}</button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
