import { index as periodsIndex } from '@/actions/App/Http/Controllers/Backends/GradePeriodController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEvent } from 'react';
import { toast } from 'sonner';

export interface GradePeriodFormData {
    name: string;
    type: 'monthly' | 'term' | 'final';
    academic_year: string;
    starts_on: string;
    ends_on: string;
    is_current: boolean;
}

interface GradePeriodFormProps {
    defaults: GradePeriodFormData;
    mode: 'create' | 'edit';
    submitUrl: string;
    title: string;
}

const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

export default function GradePeriodForm({ defaults, mode, submitUrl, title }: GradePeriodFormProps) {
    const { data, setData, post, put, processing, errors } = useForm<GradePeriodFormData>(defaults);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(mode === 'create' ? 'Grade period created.' : 'Grade period updated.'),
            onError: () => toast.error('Unable to save grade period. Please check the form.'),
        };

        if (mode === 'edit') {
            put(submitUrl, options);
            return;
        }

        post(submitUrl, options);
    };

    return (
        <AdminShell>
            <div className="fade-in mx-auto flex w-full max-w-[980px] flex-col gap-4 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">{title}</h1>
                        <p className="mt-1 text-sm font-bold text-slate-400">Manage monthly, term, and final grading periods.</p>
                    </div>
                    <Link href={periodsIndex.url()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300">
                        <ArrowLeft size={16} /> Back
                    </Link>
                </div>

                <form onSubmit={submit} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2 md:p-6">
                    <div className={`${fieldGroupClass} md:col-span-2`}>
                        <label className={fieldLabelClass}>Name *</label>
                        <input className={fieldInputClass} value={data.name} onChange={event => setData('name', event.target.value)} placeholder="June 2026" />
                        {errors.name && <div className={errorTextClass}>{errors.name}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Type *</label>
                        <Select value={data.type} onValueChange={value => setData('type', value as GradePeriodFormData['type'])}>
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="term">Term</SelectItem>
                                <SelectItem value="final">Final</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <div className={errorTextClass}>{errors.type}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Academic Year *</label>
                        <input className={fieldInputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} placeholder="2026" />
                        {errors.academic_year && <div className={errorTextClass}>{errors.academic_year}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Starts On</label>
                        <input type="date" className={fieldInputClass} value={data.starts_on} onChange={event => setData('starts_on', event.target.value)} />
                        {errors.starts_on && <div className={errorTextClass}>{errors.starts_on}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Ends On</label>
                        <input type="date" className={fieldInputClass} value={data.ends_on} onChange={event => setData('ends_on', event.target.value)} />
                        {errors.ends_on && <div className={errorTextClass}>{errors.ends_on}</div>}
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 dark:bg-slate-950 dark:text-slate-200 md:col-span-2">
                        <span>Set as current period</span>
                        <input type="checkbox" checked={data.is_current} onChange={event => setData('is_current', event.target.checked)} className="h-5 w-5 accent-blue-600" />
                    </label>

                    <div className="flex justify-end gap-2 md:col-span-2">
                        <Link href={periodsIndex.url()} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300">
                            Cancel
                        </Link>
                        <button disabled={processing} type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:bg-blue-300">
                            <Save size={16} /> {mode === 'create' ? 'Create Period' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
