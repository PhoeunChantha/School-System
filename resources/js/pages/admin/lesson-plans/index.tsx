import { FormEvent, useEffect, useMemo, useState } from 'react';
import { destroy, edit, show, store, update } from '@/routes/admin/lesson-plans';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { BookOpenText, CalendarCheck, Edit3, Eye, FileText, Image, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type FilterKey = 'today' | 'tomorrow' | 'upcoming' | 'all';
type LessonStatus = 'planned' | 'taught' | 'cancelled';
type LessonInputMode = 'details' | 'files';
type OrderKey = 'date-asc' | 'date-desc' | 'teacher-asc' | 'class-asc' | 'status-asc';

interface LessonPlan {
    id: number;
    routeKey?: string;
    teacherId: number | null;
    teacher: string;
    teacherPhoto: string | null;
    classId: number | null;
    className: string;
    room: string;
    time: string;
    date: string;
    day: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
    inputMode: LessonInputMode;
    attachments: LessonAttachment[];
}

interface LessonAttachment {
    id: number;
    name: string;
    url: string;
    mimeType: string;
    size: number;
    isImage: boolean;
}

interface TeacherOption {
    id: number;
    routeKey?: string;
    name: string;
    photo: string | null;
}

interface ClassOption {
    id: number;
    routeKey?: string;
    teacherId: number | null;
    name: string;
    teacher: string;
    room: string;
    time: string;
}

interface Summary {
    today: number;
    tomorrow: number;
    planned: number;
    taught: number;
}

interface LessonPlansPageProps {
    lessonPlans: LessonPlan[];
    teachers: TeacherOption[];
    classes: ClassOption[];
    today: string;
    tomorrow: string;
    summary: Summary;
}

interface LessonPlanFormData {
    teacher_id: number | null;
    school_class_id: number | null;
    lesson_date: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
    input_mode: LessonInputMode;
    attachments: File[];
    removed_attachment_ids: number[];
}

interface FormProps {
    mode: 'add' | 'edit';
    lessonPlan?: LessonPlan;
    teachers: TeacherOption[];
    classes: ClassOption[];
    today: string;
    onBack: () => void;
}

const statusBadge: Record<LessonStatus, 'blue' | 'green' | 'gray'> = {
    planned: 'blue',
    taught: 'green',
    cancelled: 'gray',
};

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-asc', label: 'Date Oldest' },
    { value: 'date-desc', label: 'Date Newest' },
    { value: 'teacher-asc', label: 'Teacher A-Z' },
    { value: 'class-asc', label: 'Class A-Z' },
    { value: 'status-asc', label: 'Status' },
];

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

function sortLessonPlans(list: LessonPlan[], order: OrderKey): LessonPlan[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-asc': return a.date.localeCompare(b.date);
            case 'date-desc': return b.date.localeCompare(a.date);
            case 'teacher-asc': return a.teacher.localeCompare(b.teacher);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'status-asc': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });
}

export default function LessonPlansPage({ lessonPlans, teachers, classes, today, tomorrow, summary, openForm = false, editing: initialEditing = null }: LessonPlansPageProps & { openForm?: boolean; editing?: LessonPlan | null }) {
    const [view, setView] = useState<View>(openForm ? (initialEditing ? 'edit' : 'add') : 'list');
    const [filter, setFilter] = useState<FilterKey>('today');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [editing, setEditing] = useState<LessonPlan | null>(initialEditing ?? null);
    const [deleteTarget, setDeleteTarget] = useState<LessonPlan | null>(null);

    useEffect(() => { setPage(1); }, [filter, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = lessonPlans.filter(lessonPlan => {
            const matchesFilter = filter === 'all'
                || (filter === 'today' && lessonPlan.date === today)
                || (filter === 'tomorrow' && lessonPlan.date === tomorrow)
                || (filter === 'upcoming' && lessonPlan.date >= today);
            const matchesSearch = !query
                || lessonPlan.title.toLowerCase().includes(query)
                || lessonPlan.teacher.toLowerCase().includes(query)
                || lessonPlan.className.toLowerCase().includes(query)
                || lessonPlan.objective.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });

        return sortLessonPlans(base, orderBy);
    }, [filter, lessonPlans, orderBy, search, today, tomorrow]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lesson plan deleted successfully!', { description: deleteTarget.title });
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            {view === 'list' && (
                <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6">
                    <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                        <div>
                            <span className="block text-xs font-black text-slate-400">Lesson plans</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{filtered.length} plans</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">{summary.today} today - {summary.planned} planned</p>
                        </div>
                        <Link href="/admin/lesson-plans/create" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add lesson">
                            <Plus size={18} />
                        </Link>
                    </section>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {[
                            { label: 'Today', value: summary.today, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                            { label: 'Tomorrow', value: summary.tomorrow, className: 'border-teal-500/25 bg-teal-500/10 text-teal-500' },
                            { label: 'Planned', value: summary.planned, className: 'border-violet-500/25 bg-violet-500/10 text-violet-500' },
                            { label: 'Taught', value: summary.taught, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        ].map(item => (
                            <div key={item.label} className={`rounded-[18px] border p-3 ${item.className}`}>
                                <div className="text-2xl font-black leading-none">{item.value}</div>
                                <div className="mt-1 text-[11px] font-black opacity-70">{item.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                            <div className="contents md:flex md:items-center md:gap-2">
                                <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                                <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                                    <SelectTrigger className={`${controlInputClass} md:w-[180px]`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={perPage.toString()} onValueChange={value => setPerPage(Number(value))}>
                                    <SelectTrigger className={`${controlInputClass} md:w-[136px]`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filter} onValueChange={value => setFilter(value as FilterKey)}>
                                    <SelectTrigger className={`${controlInputClass} md:w-[136px]`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="all">All</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                            </div>
                            <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`} placeholder="Search lesson plans..." />
                        </div>

                        <table className="data-table hidden md:table md:min-w-[920px]">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Lesson Topic</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-11 text-center text-sm font-bold text-slate-400">
                                            {search ? <>No lesson plans found for <strong>"{search}"</strong></> : 'No lesson plans found'}
                                        </td>
                                    </tr>
                                ) : paginated.map(lessonPlan => (
                                    <tr key={lessonPlan.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                        <td>
                                            <div className="text-[13px] font-black text-slate-900 dark:text-slate-50">{lessonPlan.date}</div>
                                            <div className="text-[11px] font-bold text-slate-400">{lessonPlan.day}</div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={lessonPlan.teacher} src={lessonPlan.teacherPhoto} size={34} />
                                                <span className="text-[13px] font-black text-slate-700 dark:text-slate-200">{lessonPlan.teacher}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-[13px] font-black text-slate-700 dark:text-slate-200">{lessonPlan.className}</div>
                                            <div className="text-[11px] font-bold text-slate-400">Room {lessonPlan.room || 'N/A'} - {lessonPlan.time || 'No time'}</div>
                                        </td>
                                        <td className="max-w-[380px]">
                                            <div className="text-[13px] font-black text-slate-900 dark:text-slate-50">{lessonPlan.title}</div>
                                            <div className="mt-1 truncate text-[11px] font-bold text-slate-400">{lessonPlan.objective || lessonPlan.content || 'No lesson objective added yet.'}</div>
                                        </td>
                                        <td><Badge type={statusBadge[lessonPlan.status]}>{lessonPlan.status}</Badge></td>
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${lessonPlan.title}`}
                                                actions={[
                                                    { key: 'view', label: 'View details', icon: Eye, href: show.url((lessonPlan.routeKey ?? lessonPlan.id) as never) },
                                                    { key: 'edit', label: 'Edit', icon: Edit3, href: edit.url((lessonPlan.routeKey ?? lessonPlan.id) as never) },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(lessonPlan), variant: 'destructive', separatorBefore: true },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="grid gap-3 md:hidden">
                            {paginated.length === 0 ? (
                                <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                    {search ? <>No lesson plans found for <strong>"{search}"</strong></> : 'No lesson plans found'}
                                </div>
                            ) : paginated.map(lessonPlan => (
                                <article key={lessonPlan.id} className={mobileCardClass}>
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className="block text-[11px] font-black text-blue-400">{lessonPlan.date} - {lessonPlan.day}</span>
                                            <strong className="mt-0.5 block truncate text-base font-black text-slate-900 dark:text-slate-50">{lessonPlan.title}</strong>
                                            <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{lessonPlan.objective || lessonPlan.content || 'No lesson objective added yet.'}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Badge type={statusBadge[lessonPlan.status]}>{lessonPlan.status}</Badge>
                                            <RowActions
                                                ariaLabel={`Actions for ${lessonPlan.title}`}
                                                actions={[
                                                    { key: 'view', label: 'View details', icon: Eye, href: show.url((lessonPlan.routeKey ?? lessonPlan.id) as never) },
                                                    { key: 'edit', label: 'Edit', icon: Edit3, href: edit.url((lessonPlan.routeKey ?? lessonPlan.id) as never) },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(lessonPlan), variant: 'destructive', separatorBefore: true },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Teacher</span>
                                            <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                                <Avatar name={lessonPlan.teacher} src={lessonPlan.teacherPhoto} size={22} />
                                                <strong className="truncate text-xs font-black text-slate-900 dark:text-slate-50">{lessonPlan.teacher}</strong>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                            <span className="block text-[9px] font-black uppercase text-slate-400">Class</span>
                                            <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{lessonPlan.className}</strong>
                                            <span className="block truncate text-[10px] font-bold text-slate-400">Room {lessonPlan.room || 'N/A'} - {lessonPlan.time || 'No time'}</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {filtered.length > 0 && (
                            <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                        )}
                    </div>
                </div>
            )}

            {(view === 'add' || view === 'edit') && (
                <LessonPlanForm
                    mode={view}
                    lessonPlan={editing ?? undefined}
                    teachers={teachers}
                    classes={classes}
                    today={today}
                    onBack={() => { setView('list'); setEditing(null); }}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4" onClick={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Lesson Plan?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.title}</strong> from the teaching plan.</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white transition hover:bg-red-600"><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function LessonPlanForm({ mode, lessonPlan, teachers, classes, today, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const { data, setData, post, processing, progress, errors, transform } = useForm<LessonPlanFormData>({
        teacher_id: lessonPlan?.teacherId ?? null,
        school_class_id: lessonPlan?.classId ?? null,
        lesson_date: lessonPlan?.date ?? today,
        title: lessonPlan?.title ?? '',
        objective: lessonPlan?.objective ?? '',
        content: lessonPlan?.content ?? '',
        materials: lessonPlan?.materials ?? '',
        homework: lessonPlan?.homework ?? '',
        status: lessonPlan?.status ?? 'planned',
        input_mode: lessonPlan?.inputMode ?? 'details',
        attachments: [],
        removed_attachment_ids: [],
    });

    const availableClasses = data.teacher_id
        ? classes.filter(classOption => classOption.teacherId === data.teacher_id)
        : classes;
    const selectedClass = classes.find(classOption => classOption.id === data.school_class_id);
    const inputError = (message?: string) => message ? <div className={errorTextClass}>{message}</div> : null;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        transform(formData => ({
            ...formData,
            teacher_id: formData.teacher_id || null,
            school_class_id: formData.school_class_id || null,
            objective: formData.objective || null,
            content: formData.content || null,
            materials: formData.materials || null,
            homework: formData.homework || null,
            ...(isEdit ? { _method: 'put' } : {}),
        }) as LessonPlanFormData);

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Lesson plan updated successfully!' : 'Lesson plan created successfully!', { description: data.title });
                onBack();
            },
            onError: (formErrors: Record<string, string>) => {
                if (formErrors.form) {
                    toast.error(formErrors.form);
                }
            },
        };

        if (isEdit && lessonPlan) {
            post(update.url((lessonPlan.routeKey ?? lessonPlan.id) as never), {
                ...options,
                forceFormData: true,
            });
            return;
        }

        post(store.url(), { ...options, forceFormData: true });
    };

    const activeAttachments = (lessonPlan?.attachments ?? []).filter(
        attachment => !data.removed_attachment_ids.includes(attachment.id),
    );
    const totalFiles = activeAttachments.length + data.attachments.length;

    const addFiles = (files: FileList | null) => {
        if (!files) return;

        const availableSlots = Math.max(0, 10 - totalFiles);
        setData('attachments', [...data.attachments, ...Array.from(files).slice(0, availableSlots)]);
    };

    return (
        <div className="fade-in bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
            <form className="mx-auto flex max-w-4xl flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 md:grid md:grid-cols-2 md:p-6" onSubmit={submit}>
                <section className="col-span-2 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]">
                        {isEdit ? <Edit3 size={20} /> : <CalendarCheck size={20} />}
                    </div>
                    <div className="min-w-0">
                        <strong className="block text-xl font-black text-slate-900 dark:text-slate-50">{isEdit ? 'Edit Lesson Plan' : 'Add Lesson Plan'}</strong>
                        <p className="mt-1 text-xs font-extrabold text-slate-400">Plan what lesson students will be taught today or tomorrow.</p>
                    </div>
                </section>

                <div className={fieldGroupClass}>
                    <label className={fieldLabelClass}>Teacher *</label>
                    <Select value={data.teacher_id ? String(data.teacher_id) : ''} onValueChange={val => {
                        const teacherId = val ? Number(val) : null;
                        setData(values => ({ ...values, teacher_id: teacherId, school_class_id: null }));
                    }}>
                        <SelectTrigger className={fieldInputClass}>
                            <SelectValue placeholder="Select teacher..." />
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map(teacher => <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {inputError(errors.teacher_id)}
                </div>

                <div className={fieldGroupClass}>
                    <label className={fieldLabelClass}>Class *</label>
                    <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => setData('school_class_id', val ? Number(val) : null)}>
                        <SelectTrigger className={fieldInputClass}>
                            <SelectValue placeholder="Select class..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableClasses.map(classOption => <SelectItem key={classOption.id} value={String(classOption.id)}>{classOption.name} {classOption.time ? `(${classOption.time})` : ''}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {selectedClass && <div className="text-[11px] font-bold text-slate-400">Room {selectedClass.room || 'N/A'} - {selectedClass.teacher}</div>}
                    {inputError(errors.school_class_id)}
                </div>

                <div className={fieldGroupClass}>
                    <label className={fieldLabelClass}>Lesson Date *</label>
                    <DatePicker value={data.lesson_date} onChange={value => setData('lesson_date', value)} className={fieldInputClass} />
                    {inputError(errors.lesson_date)}
                </div>

                <div className={fieldGroupClass}>
                    <label className={fieldLabelClass}>Status</label>
                    <Select value={data.status} onValueChange={val => setData('status', val as LessonStatus)}>
                        <SelectTrigger className={fieldInputClass}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="taught">Taught</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    {inputError(errors.status)}
                </div>

                <div className="col-span-2 grid w-full max-w-md grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
                    <button
                        type="button"
                        aria-pressed={data.input_mode === 'details'}
                        onClick={() => setData('input_mode', 'details')}
                        className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition ${data.input_mode === 'details' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <BookOpenText size={15} />
                        Lesson Details
                    </button>
                    <button
                        type="button"
                        aria-pressed={data.input_mode === 'files'}
                        onClick={() => setData('input_mode', 'files')}
                        className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition ${data.input_mode === 'files' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <UploadCloud size={15} />
                        Upload Files
                    </button>
                </div>

                {data.input_mode === 'details' ? (
                    <>
                        <div className={`${fieldGroupClass} col-span-2`}>
                            <label className={fieldLabelClass}>Lesson Topic *</label>
                            <input className={fieldInputClass} value={data.title} onChange={event => setData('title', event.target.value)} placeholder="e.g. Present Simple Tense" />
                            {inputError(errors.title)}
                        </div>

                        <div className={`${fieldGroupClass} col-span-2`}>
                            <label className={fieldLabelClass}>Students Learn / Objective</label>
                            <textarea className={`${fieldInputClass} min-h-24 resize-y`} value={data.objective} onChange={event => setData('objective', event.target.value)} rows={3} placeholder="Students can use present simple positive and negative sentences." />
                            {inputError(errors.objective)}
                        </div>

                        <div className={`${fieldGroupClass} col-span-2`}>
                            <label className={fieldLabelClass}>Teaching Content</label>
                            <textarea className={`${fieldInputClass} min-h-28 resize-y`} value={data.content} onChange={event => setData('content', event.target.value)} rows={4} placeholder="Warm-up, explanation, examples, guided practice..." />
                            {inputError(errors.content)}
                        </div>

                        <div className={fieldGroupClass}>
                            <label className={fieldLabelClass}>Materials</label>
                            <textarea className={`${fieldInputClass} min-h-24 resize-y`} value={data.materials} onChange={event => setData('materials', event.target.value)} rows={3} placeholder="Workbook page, flashcards, audio..." />
                            {inputError(errors.materials)}
                        </div>

                        <div className={fieldGroupClass}>
                            <label className={fieldLabelClass}>Homework</label>
                            <textarea className={`${fieldInputClass} min-h-24 resize-y`} value={data.homework} onChange={event => setData('homework', event.target.value)} rows={3} placeholder="Workbook page 12, exercise A-B..." />
                            {inputError(errors.homework)}
                        </div>
                    </>
                ) : (
                    <section className="col-span-2 rounded-[22px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70 md:p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">Lesson images and documents</h3>
                                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Upload up to 10 images, PDFs, Word, PowerPoint, Excel, or text files. Maximum 15 MB each.</p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">{totalFiles}/10</span>
                        </div>

                        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-white px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-950/20">
                            <UploadCloud className="mb-2 text-blue-600" size={28} />
                            <strong className="text-sm font-black text-slate-900 dark:text-slate-50">Choose multiple files</strong>
                            <span className="mt-1 text-xs font-semibold text-slate-400">Photos, scans, worksheets, slides, and documents</span>
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                                className="sr-only"
                                disabled={totalFiles >= 10}
                                onChange={event => {
                                    addFiles(event.target.files);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        {inputError(errors.attachments)}

                        {totalFiles > 0 && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                {activeAttachments.map(attachment => (
                                    <FileRow
                                        key={`existing-${attachment.id}`}
                                        name={attachment.name}
                                        size={attachment.size}
                                        isImage={attachment.isImage}
                                        url={attachment.url}
                                        onRemove={() => setData('removed_attachment_ids', [...data.removed_attachment_ids, attachment.id])}
                                    />
                                ))}
                                {data.attachments.map((file, index) => (
                                    <FileRow
                                        key={`${file.name}-${file.lastModified}-${index}`}
                                        name={file.name}
                                        size={file.size}
                                        isImage={file.type.startsWith('image/')}
                                        onRemove={() => setData('attachments', data.attachments.filter((_, fileIndex) => fileIndex !== index))}
                                    />
                                ))}
                            </div>
                        )}

                        {progress && (
                            <div className="mt-3">
                                <div className="mb-1 flex justify-between text-[11px] font-black text-slate-500"><span>Uploading files</span><span>{progress.percentage}%</span></div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress.percentage}%` }} /></div>
                            </div>
                        )}
                    </section>
                )}

                <div className="col-span-2 mt-1 grid grid-cols-[1fr_2fr] gap-2 rounded-[22px] border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 md:border-0 md:bg-transparent md:p-0">
                    <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button>
                    <button type="submit" disabled={processing} className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-900">
                        {processing ? 'Saving...' : isEdit ? 'Update Lesson Plan' : 'Save Lesson Plan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FileRow({ name, size, isImage, url, onRemove }: { name: string; size: number; isImage: boolean; url?: string; onRemove: () => void }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
            {isImage && url ? (
                <img src={url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
            ) : (
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isImage ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'}`}>
                    {isImage ? <Image size={19} /> : <FileText size={19} />}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{name}</div>
                <div className="mt-0.5 text-[11px] font-bold text-slate-400">{formatFileSize(size)}</div>
            </div>
            <button type="button" onClick={onRemove} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30" aria-label={`Remove ${name}`}>
                <X size={16} />
            </button>
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
