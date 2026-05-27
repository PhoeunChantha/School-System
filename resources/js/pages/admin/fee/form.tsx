import { index as feeIndex, store, update } from '@/actions/App/Http/Controllers/Backends/FeeChargeController';
import { DatePicker } from '@/components/ui/date-picker';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect } from '@/pages/admin/ui';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ReceiptText, WalletCards } from 'lucide-react';
import { FormEvent, useMemo } from 'react';
import { toast } from 'sonner';

export interface FeeStudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    levelId: number | null;
    level: string;
    className: string;
    monthlyFee: string | number;
}

export interface FeeChargeFormData {
    id?: number;
    routeKey?: string;
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

const pageClass = 'fade-in flex min-h-full flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const labelClass = 'mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorClass = 'mt-1.5 text-xs font-bold text-red-500';
const footerButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition';

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
            put(update.url((charge.routeKey ?? charge.id) as never), options);
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

    const selectedStudent = useMemo(() => students.find(student => student.id === data.student_id), [data.student_id, students]);
    const balance = Math.max(0, Number(data.amount || 0) - Number(data.discount_amount || 0) - Number(data.paid_amount || 0));

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className={panelClass}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                <ReceiptText size={20} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-black text-slate-400">Student billing</span>
                                <h1 className="mt-1 text-xl font-black leading-tight text-slate-900 dark:text-slate-50">{isEdit ? 'Edit fee charge' : 'New fee charge'}</h1>
                                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.level || selectedStudent.className}` : 'Create a monthly student fee charge'}</p>
                            </div>
                        </div>
                        <Link href={feeIndex.url()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Back to fees">
                            <ArrowLeft size={18} />
                        </Link>
                    </div>
                </section>

                <section className="grid grid-cols-3 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
                        <span className="block text-[10px] font-black uppercase opacity-75">Amount</span>
                        <strong className="mt-1 block text-lg font-black">${Number(data.amount || 0).toFixed(2)}</strong>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                        <span className="block text-[10px] font-black uppercase opacity-75">Paid</span>
                        <strong className="mt-1 block text-lg font-black">${Number(data.paid_amount || 0).toFixed(2)}</strong>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
                        <span className="block text-[10px] font-black uppercase opacity-75">Balance</span>
                        <strong className="mt-1 block text-lg font-black">${balance.toFixed(2)}</strong>
                    </div>
                </section>

                <form onSubmit={submit} className={`${panelClass} grid flex-1 grid-cols-1 gap-3 md:grid-cols-2`}>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Student *</label>
                        <AdminSelect
                            value={data.student_id ? String(data.student_id) : ''}
                            onChange={value => selectStudent(Number(value))}
                            options={students.map(student => ({ value: String(student.id), label: `${student.nameEn} - ${student.level}` }))}
                            placeholder="Select student"
                            triggerClassName={inputClass}
                        />
                        {errors.student_id && <div className={errorClass}>{errors.student_id}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Billing Month *</label>
                        <DatePicker value={data.billing_month} onChange={value => setData('billing_month', value)} className={inputClass} />
                        {errors.billing_month && <div className={errorClass}>{errors.billing_month}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Due Date</label>
                        <DatePicker value={data.due_on} onChange={value => setData('due_on', value)} placeholder="Pick due date" className={inputClass} />
                        {errors.due_on && <div className={errorClass}>{errors.due_on}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Amount *</label>
                        <input type="number" step="0.01" className={inputClass} value={data.amount} onChange={event => setData('amount', event.target.value)} />
                        {errors.amount && <div className={errorClass}>{errors.amount}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Discount</label>
                        <input type="number" step="0.01" className={inputClass} value={data.discount_amount} onChange={event => setData('discount_amount', event.target.value)} />
                        {errors.discount_amount && <div className={errorClass}>{errors.discount_amount}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Paid Amount</label>
                        <input type="number" step="0.01" className={inputClass} value={data.paid_amount} onChange={event => setData('paid_amount', event.target.value)} />
                        {errors.paid_amount && <div className={errorClass}>{errors.paid_amount}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Status *</label>
                        <AdminSelect
                            value={data.status}
                            onChange={value => setData('status', value as FeeChargeFormData['status'])}
                            options={[
                                { value: 'unpaid', label: 'Unpaid' },
                                { value: 'partial', label: 'Partial' },
                                { value: 'paid', label: 'Paid' },
                            ]}
                            triggerClassName={inputClass}
                        />
                        {errors.status && <div className={errorClass}>{errors.status}</div>}
                    </div>
                    <div>
                        <label className={labelClass}>Academic Year</label>
                        <input className={inputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                        {errors.academic_year && <div className={errorClass}>{errors.academic_year}</div>}
                    </div>
                    <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 pt-3 dark:border-slate-700 md:col-span-2">
                        <Link href={feeIndex.url()} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                            <ArrowLeft size={16} /> Cancel
                        </Link>
                        <button disabled={processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                            {isEdit ? <CheckCircle2 size={16} /> : <WalletCards size={16} />}
                            {isEdit ? 'Save Changes' : 'Create Fee Charge'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}



