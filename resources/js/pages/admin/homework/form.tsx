import { FormEvent, useRef } from 'react';
import { index as homeworkIndex, store, update } from '@/actions/App/Http/Controllers/Backends/HomeworkAssignmentController';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

export interface HomeworkClassOption {
    id: number;
    routeKey?: string;
    name: string;
    room: string;
    student_count: number;
}

export interface HomeworkFormData {
    id?: number;
    routeKey?: string;
    school_class_id: number | null;
    title_kh: string;
    title_en: string;
    instructions: string;
    attachment_file: File | null;
    attachment_name?: string;
    attachment_url?: string;
    points: string | number;
    due_on: string;
    academic_year: string;
    status: 'assigned' | 'draft' | 'closed';
    _method?: 'put';
}

interface HomeworkFormPageProps {
    mode: 'create' | 'edit';
    homework?: HomeworkFormData;
    classes: HomeworkClassOption[];
}

const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

export default function HomeworkFormPage({ mode, homework, classes }: HomeworkFormPageProps) {
    const isEdit = mode === 'edit';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, transform } = useForm<HomeworkFormData>({
        school_class_id: homework?.school_class_id ?? classes[0]?.id ?? null,
        title_kh: homework?.title_kh ?? '',
        title_en: homework?.title_en ?? '',
        instructions: homework?.instructions ?? '',
        attachment_file: null,
        attachment_name: homework?.attachment_name ?? '',
        attachment_url: homework?.attachment_url ?? '',
        points: homework?.points ?? 100,
        due_on: homework?.due_on ?? '',
        academic_year: homework?.academic_year ?? new Date().getFullYear().toString(),
        status: homework?.status ?? 'assigned',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            ...(isEdit ? { _method: 'put' as const } : {}),
        }));

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success(isEdit ? 'Homework updated.' : 'Homework assigned.'),
        };

        if (isEdit && homework?.id) {
            post(update.url((homework.routeKey ?? homework.id) as never), options);
            return;
        }

        post(store.url(), options);
    };

    return (
        <AdminShell>
            <div className="fade-in bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="mb-3 hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                            {isEdit ? 'Edit Homework' : 'Assign Homework'}
                        </div>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">
                            {isEdit ? 'Update class assignment details' : 'Create a new class assignment'}
                        </div>
                    </div>
                    <Link href={homeworkIndex.url()} className="inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        Cancel
                    </Link>
                </div>

                <form onSubmit={submit} className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 md:grid md:grid-cols-2 md:p-6">
                    <section className="col-span-2 flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                        <div>
                            <span className="block text-xs font-black text-slate-400">{isEdit ? 'Homework editor' : 'Class assignment'}</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{isEdit ? 'Edit Homework' : 'Assign Homework'}</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">{isEdit ? 'Update class assignment details' : 'Create a new class assignment'}</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]">
                            <FileText size={20} />
                        </div>
                    </section>

                    <div className={`${fieldGroupClass} col-span-2`}>
                        <label className={fieldLabelClass}>Title (Khmer) *</label>
                        <input className={fieldInputClass} value={data.title_kh} onChange={event => setData('title_kh', event.target.value)} placeholder="សរសេរចំណងជើងកិច្ចការ" />
                        {errors.title_kh && <div className={errorTextClass}>{errors.title_kh}</div>}
                    </div>

                    <div className={`${fieldGroupClass} col-span-2`}>
                        <label className={fieldLabelClass}>Title (English)</label>
                        <input className={fieldInputClass} value={data.title_en} onChange={event => setData('title_en', event.target.value)} placeholder="e.g. Write about family" />
                        {errors.title_en && <div className={errorTextClass}>{errors.title_en}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Class *</label>
                        <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => setData('school_class_id', val ? Number(val) : null)}>
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(schoolClass => (
                                    <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                                        {schoolClass.name} {schoolClass.room ? `- ${schoolClass.room}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.school_class_id && <div className={errorTextClass}>{errors.school_class_id}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Due Date *</label>
                        <DatePicker value={data.due_on} onChange={value => setData('due_on', value)} className={fieldInputClass} />
                        {errors.due_on && <div className={errorTextClass}>{errors.due_on}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Score *</label>
                        <input type="number" min={1} className={fieldInputClass} value={data.points} onChange={event => setData('points', event.target.value)} />
                        {errors.points && <div className={errorTextClass}>{errors.points}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Status *</label>
                        <Select value={data.status} onValueChange={val => setData('status', val as HomeworkFormData['status'])}>
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <div className={errorTextClass}>{errors.status}</div>}
                    </div>

                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>Academic Year</label>
                        <input className={fieldInputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} placeholder="2026" />
                        {errors.academic_year && <div className={errorTextClass}>{errors.academic_year}</div>}
                    </div>

                    <div className={`${fieldGroupClass} col-span-2`}>
                        <label className={fieldLabelClass}>Instructions</label>
                        <textarea className={`${fieldInputClass} min-h-32 resize-y`} rows={5} value={data.instructions} onChange={event => setData('instructions', event.target.value)} placeholder="Additional instructions..." />
                        {errors.instructions && <div className={errorTextClass}>{errors.instructions}</div>}
                    </div>

                    <div className={`${fieldGroupClass} col-span-2`}>
                        <label className={fieldLabelClass}>Homework File</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex min-h-20 w-full items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                        >
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                {data.attachment_file || data.attachment_name ? <FileText size={18} /> : <Upload size={18} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">
                                    {data.attachment_file?.name || data.attachment_name || 'Upload homework file'}
                                </span>
                                <span className="mt-1 block text-[11px] font-bold text-slate-400">
                                    PDF, Word, Excel, PowerPoint, JPG, or PNG up to 10MB
                                </span>
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                            className="hidden"
                            onChange={event => setData('attachment_file', event.target.files?.[0] ?? null)}
                        />
                        {data.attachment_url && !data.attachment_file && (
                            <a href={data.attachment_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-black text-blue-600 dark:text-blue-300">
                                View current file
                            </a>
                        )}
                        {errors.attachment_file && <div className={errorTextClass}>{errors.attachment_file}</div>}
                    </div>

                    <div className="col-span-2 mt-1 grid grid-cols-[1fr_2fr] gap-2 rounded-[22px] border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 md:border-0 md:bg-transparent md:p-0">
                        <Link href={homeworkIndex.url()} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">
                            Cancel
                        </Link>
                        <button disabled={processing} type="submit" className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-900">
                            {isEdit ? 'Save Changes' : 'Assign Homework'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
