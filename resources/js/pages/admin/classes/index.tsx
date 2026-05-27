import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Backends/SchoolClassController';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination, RowActions, type RowAction } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ClipboardCheck,
    Clock,
    Edit3,
    Plus,
    School,
    Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface SchoolClass {
    id: number;
    routeKey?: string;
    levelId: number | null;
    teacherId: number | null;
    name: string;
    teacher: string;
    time: string;
    room: string;
    count: number;
    days: string;
    startsAt: string | null;
    endsAt: string | null;
    capacity: number | null;
    monthlyFee: string | null;
    status: 'active' | 'inactive';
}

interface LevelOption {
    id: number;
    routeKey?: string;
    name: string;
    monthly_fee: string;
}

interface TeacherOption {
    id: number;
    routeKey?: string;
    name_en: string;
}

interface ClassesPageProps {
    classes: SchoolClass[];
    levels: LevelOption[];
    teachers: TeacherOption[];
}

// Sort options
type OrderKey =
    | 'name-asc'
    | 'name-desc'
    | 'teacher-asc'
    | 'students-desc'
    | 'students-asc'
    | 'room-asc';
const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'teacher-asc', label: 'Teacher A-Z' },
    { value: 'students-desc', label: 'Students Most' },
    { value: 'students-asc', label: 'Students Least' },
    { value: 'room-asc', label: 'Room' },
];
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const softTileClass = 'rounded-2xl bg-slate-50 p-2 dark:bg-slate-950/70';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

function sortClasses(list: SchoolClass[], order: OrderKey): SchoolClass[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'teacher-asc':
                return a.teacher.localeCompare(b.teacher);
            case 'students-desc':
                return b.count - a.count;
            case 'students-asc':
                return a.count - b.count;
            case 'room-asc':
                return a.room.localeCompare(b.room);
            default:
                return 0;
        }
    });
}

function DayBadges({ days }: { days: string }) {
    const list = days.split(/\s+/).filter(Boolean);

    if (list.length === 0) {
        return <span className="text-xs text-slate-400">-</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {list.map((day) => (
                <Badge key={day} type="blue">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                </Badge>
            ))}
        </div>
    );
}

export default function ClassesPage({
    classes,
    levels,
    teachers,
}: ClassesPageProps) {
    const { translateText } = useAdminTranslation();
    const [view, setView] = useState<View>('list');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
    const [orderBy, setOrderBy] = useState<OrderKey>('name-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);

    const handleEdit = (cls: SchoolClass) => {
        setEditing(cls);
        setView('edit');
    };
    const handleDelete = (cls: SchoolClass) => setDeleteTarget(cls);
    const classActions = (cls: SchoolClass): RowAction[] => [
        { key: 'attendance', label: translateText('Attendance'), icon: ClipboardCheck, href: '/admin/attendance' },
        { key: 'edit', label: translateText('Edit'), icon: Edit3, onSelect: () => handleEdit(cls) },
        { key: 'delete', label: translateText('Delete'), icon: Trash2, onSelect: () => handleDelete(cls), variant: 'destructive', separatorBefore: true },
    ];
    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(
            destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Class deleted successfully!', {
                        description: `${deleteTarget.name} has been removed.`,
                    });
                    setDeleteTarget(null);
                },
            },
        );
    };

    useEffect(() => {
        setPage(1);
    }, [search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = classes.filter(
            (c) =>
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.teacher.toLowerCase().includes(q) ||
                c.room.toLowerCase().includes(q) ||
                c.days.toLowerCase().includes(q),
        );
        return sortClasses(base, orderBy);
    }, [classes, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>
            {/* List view */}
            {view === 'list' && (
                <div className="fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 md:gap-5 md:p-6 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                    <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:rounded-[28px] md:p-5">
                        <div>
                            <span className="block text-xs font-black text-slate-400">Class directory</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{classes.length} classes</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">
                                {classes.reduce((total, cls) => total + cls.count, 0)} students
                                {' '}·{' '}
                                {new Set(classes.map((cls) => cls.room).filter(Boolean)).size} rooms
                            </p>
                        </div>
                        <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]" type="button" onClick={() => setView('add')}>
                            <Plus size={17} />
                        </button>
                    </section>

                    {/* Table */}
                    <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        {/* Sort + per-page controls */}
                        <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-0 md:border-b md:border-slate-200 md:bg-white md:p-4 md:shadow-none md:backdrop-blur-none dark:md:border-slate-700 dark:md:bg-slate-800/90">
                            <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden text-[11px] font-black text-slate-400 md:inline">
                                {translateText('Sort by')}
                            </span>
                            <Select
                                value={orderBy}
                                onValueChange={(e) => setOrderBy(e as OrderKey)}
                            >
                                <SelectTrigger className={`${controlInputClass} w-full md:w-[180px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {translateText(o.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="hidden h-5 w-px bg-slate-200 md:block" />

                            <Select
                                value={perPage.toString()}
                                onValueChange={(e) => {
                                    setPerPage(Number(e));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className={`${controlInputClass} w-full md:w-[140px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map((n) => (
                                        <SelectItem
                                            key={n}
                                            value={n.toString()}
                                        >
                                            {n} {translateText('per page')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span className="hidden text-[11px] font-extrabold text-slate-400 md:inline">
                                {filtered.length}{' '}
                                {translateText(
                                    filtered.length === 1
                                        ? 'result'
                                        : 'results',
                                )}
                            </span>
                            </div>

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${controlInputClass} col-span-2 w-full md:col-span-1 md:col-start-3 md:ml-0 md:max-w-none`}
                                data-role="classes-search"
                                placeholder={translateText('Search classes...')}
                            />
                        </div>

                        <table className="data-table hidden md:table md:min-w-[980px]">
                            <thead>
                                <tr>
                                    <th>{translateText('Class')}</th>
                                    <th>{translateText('Teacher')}</th>
                                    <th>{translateText('Room')}</th>
                                    <th>{translateText('Schedule')}</th>
                                    <th>{translateText('Days')}</th>
                                    <th>{translateText('Students')}</th>
                                    <th>{translateText('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-11 text-center text-sm text-slate-400"
                                        >
                                            {translateText('No classes found')}{' '}
                                            <strong>"{search}"</strong>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((cls) => (
                                        <tr key={cls.id}>
                                            <td>
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                                                    {cls.name}
                                                </span>
                                            </td>
                                            <td
                                                className="text-[13px] text-slate-500 dark:text-slate-400"
                                            >
                                                {cls.teacher}
                                            </td>
                                            <td>
                                                <Badge type="blue">
                                                    {cls.room}
                                                </Badge>
                                            </td>
                                            <td
                                                className="text-[13px] font-semibold text-blue-500"
                                            >
                                                <span
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    <Clock size={13} />
                                                    {cls.time}
                                                </span>
                                            </td>
                                            <td>
                                                <DayBadges days={cls.days} />
                                            </td>
                                            <td>
                                                <div
                                                    className="flex items-center gap-1.5"
                                                >
                                                    <span
                                                        className="font-bold text-slate-900 dark:text-slate-50"
                                                    >
                                                        {cls.count}
                                                    </span>
                                                    <span
                                                        className="text-[11px] text-slate-400"
                                                    >
                                                        {translateText(
                                                            'students',
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <RowActions
                                                    ariaLabel={`Actions for ${cls.name}`}
                                                    actions={classActions(cls)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="grid gap-3 md:hidden">
                            {paginated.length === 0 ? (
                                <div className="py-8 text-center text-sm font-bold text-slate-500">
                                    {translateText('No classes found')}{' '}
                                    <strong>"{search}"</strong>
                                </div>
                            ) : (
                                paginated.map((cls) => (
                                    <article
                                        key={cls.id}
                                        className={mobileCardClass}
                                    >
                                        <div className="mb-3 flex items-start gap-3">
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-50">
                                                    {cls.name}
                                                </div>
                                                <div className="text-xs font-extrabold text-slate-400">
                                                    {cls.teacher}
                                                </div>
                                            </div>
                                            <Badge type="blue">
                                                {cls.room}
                                            </Badge>
                                            <div className="ml-auto" onClick={(event) => event.stopPropagation()}>
                                                <RowActions
                                                    ariaLabel={`Actions for ${cls.name}`}
                                                    actions={classActions(cls)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5 dark:border-slate-700 dark:bg-slate-950/70">
                                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700">
                                                <span className="text-[10px] font-black uppercase text-slate-400">
                                                    {translateText('Schedule')}
                                                </span>
                                                <strong className="inline-flex items-center gap-1 text-xs font-black text-blue-500">
                                                    <Clock size={13} />
                                                    {cls.time}
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700">
                                                <span className="text-[10px] font-black uppercase text-slate-400">
                                                    {translateText('Days')}
                                                </span>
                                                <strong className="flex justify-end">
                                                    <DayBadges days={cls.days} />
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                                                <span className="text-[10px] font-black uppercase text-slate-400">
                                                    {translateText('Students')}
                                                </span>
                                                <strong className="text-xs font-black text-slate-900 dark:text-slate-50">
                                                    {cls.count}{' '}
                                                    {translateText('students')}
                                                </strong>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>

                        {filtered.length > 0 && (
                            <Pagination
                                total={filtered.length}
                                page={page}
                                perPage={perPage}
                                onPageChange={setPage}
                                onPerPageChange={setPerPage}
                                showPerPage={false}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Add / Edit form */}
            {(view === 'add' || view === 'edit') && (
                <ClassForm
                    mode={view}
                    cls={editing ?? undefined}
                    levels={levels}
                    teachers={teachers}
                    onBack={() => {
                        setView('list');
                        setEditing(null);
                    }}
                />
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDeleteTarget(null);
                    }}
                >
                    <div className="w-full max-w-[420px] rounded-[20px] bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-300">
                                <Trash2 size={26} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">
                                {translateText('Delete Class?')}
                            </div>
                            <div className="text-[13px] font-bold leading-6 text-slate-500 dark:text-slate-400">
                                {translateText(
                                    'Are you sure you want to remove',
                                )}{' '}
                                <strong>{deleteTarget.name}</strong>?
                                {translateText('This will affect')}{' '}
                                <strong>
                                    {deleteTarget.count}{' '}
                                    {translateText('students')}
                                </strong>{' '}
                                {translateText('and cannot be undone.')}
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                            >
                                {translateText('Cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 rounded-xl bg-red-500 p-3 text-sm font-bold text-white"
                            >
                                {translateText('Yes, Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// Add / Edit Class form
interface FormProps {
    mode: 'add' | 'edit';
    cls?: SchoolClass;
    levels: LevelOption[];
    teachers: TeacherOption[];
    onBack: () => void;
}

function ClassForm({ mode, cls, levels, teachers, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const { translateText } = useAdminTranslation();
    const initialDays = (cls?.days.split(' ').filter(Boolean) ??
        []) as Weekday[];
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        transform,
        setError,
        clearErrors,
    } = useForm({
        level_id: (cls?.levelId ?? null) as number | null,
        teacher_id: (cls?.teacherId ?? null) as number | null,
        name: cls?.name ?? '',
        room: cls?.room ?? '',
        starts_at: cls?.startsAt?.slice(0, 5) ?? '',
        ends_at: cls?.endsAt?.slice(0, 5) ?? '',
        days: initialDays,
        capacity: cls?.capacity ?? 20,
        academic_year: String(new Date().getFullYear()),
        status: cls?.status ?? 'active',
    });

    const selectedLevel = levels.find((level) => level.id === data.level_id);

    const validateClassForm = () => {
        clearErrors('level_id', 'name', 'teacher_id', 'room', 'days');

        if (!data.level_id) {
            setError('level_id', translateText('Please select a level.'));
        }

        if (!data.teacher_id) {
            setError('teacher_id', translateText('Please select a teacher.'));
        }

        if (!data.room.trim()) {
            setError('room', translateText('Please enter a room.'));
        }

        if (data.days.length === 0) {
            setError('days', translateText('Please select at least one day.'));
        }

        return Boolean(
            data.level_id &&
                data.teacher_id &&
                data.room.trim() &&
                data.days.length > 0,
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateClassForm()) {
            return;
        }

        transform((formData) => ({
            ...formData,
            level_id: formData.level_id || null,
            teacher_id: formData.teacher_id || null,
            starts_at: formData.starts_at || null,
            ends_at: formData.ends_at || null,
            capacity: formData.capacity || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEdit
                        ? 'Class updated successfully!'
                        : 'Class added successfully!',
                    {
                        description: isEdit
                            ? `${data.name} has been updated.`
                            : 'New class has been created.',
                    },
                );
                onBack();
            },
        };

        if (isEdit && cls) {
            put(update.url((cls.routeKey ?? cls.id) as never), options);

            return;
        }

        post(store.url(), options);
    };

    const toggleDay = (day: Weekday) => {
        clearErrors('days');
        setData(
            'days',
            data.days.includes(day)
                ? data.days.filter((value) => value !== day)
                : [...data.days, day],
        );
    };

    return (
        <div className="fade-in bg-slate-50 p-6 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
            <form
                className="mx-auto flex min-h-[calc(100dvh-112px)] w-full max-w-[600px] flex-col rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 max-md:min-h-[calc(100dvh-112px)] max-md:p-3"
                onSubmit={submit}
            >
                <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        {isEdit ? <Edit3 size={20} /> : <School size={20} />}
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                            {translateText(
                                isEdit ? 'Edit Class' : 'Add New Class',
                            )}
                        </div>
                        {isEdit && cls && (
                            <div className="text-xs font-extrabold text-slate-400">
                                {cls.name}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div className={`${fieldGroupClass} col-span-full`}>
                        <label className={fieldLabelClass}>
                            {translateText('Level')} *
                        </label>
                        <Select
                            value={data.level_id?.toString() ?? ''}
                            onValueChange={(e) => {
                                clearErrors('level_id', 'name');
                                const level = levels.find(
                                    (item) => item.id === Number(e),
                                );

                                setData((data) => ({
                                    ...data,
                                    level_id: level?.id ?? null,
                                    name: level?.name ?? '',
                                }));
                            }}
                        >
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue
                                    placeholder={translateText(
                                        'Select level...',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((level) => (
                                    <SelectItem
                                        key={level.id}
                                        value={level.id.toString()}
                                    >
                                        {level.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(errors.level_id || errors.name) && (
                            <div className={errorTextClass}>
                                {errors.level_id || errors.name}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Teacher')} *
                        </label>
                        <Select
                            value={data.teacher_id?.toString() ?? ''}
                            onValueChange={(e) => {
                                clearErrors('teacher_id');
                                setData('teacher_id', e ? Number(e) : null);
                            }}
                        >
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue
                                    placeholder={translateText(
                                        'Select teacher...',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => (
                                    <SelectItem
                                        key={teacher.id}
                                        value={teacher.id.toString()}
                                    >
                                        {teacher.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.teacher_id && (
                            <div className={errorTextClass}>
                                {errors.teacher_id}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Room')} *
                        </label>
                        <input
                            className={fieldInputClass}
                            placeholder="e.g. A1"
                            required
                            value={data.room}
                            onChange={(e) => {
                                clearErrors('room');
                                setData('room', e.target.value);
                            }}
                        />
                        {errors.room && (
                            <div className={errorTextClass}>
                                {errors.room}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Start Time')}
                        </label>
                        <input
                            type="time"
                            className={fieldInputClass}
                            value={data.starts_at}
                            onChange={(e) =>
                                setData('starts_at', e.target.value)
                            }
                        />
                        {errors.starts_at && (
                            <div className={errorTextClass}>
                                {errors.starts_at}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('End Time')}
                        </label>
                        <input
                            type="time"
                            className={fieldInputClass}
                            value={data.ends_at}
                            onChange={(e) => setData('ends_at', e.target.value)}
                        />
                        {errors.ends_at && (
                            <div className={errorTextClass}>
                                {errors.ends_at}
                            </div>
                        )}
                    </div>
                    <div className={`${fieldGroupClass} col-span-full`}>
                        <label className={fieldLabelClass}>
                            {translateText('Days')} *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                ] as Weekday[]
                            ).map((day) => (
                                <label
                                    key={day}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${data.days.includes(day) ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-400/50 dark:bg-blue-500/15 dark:text-blue-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.days.includes(day)}
                                        onChange={() => toggleDay(day)}
                                        className="accent-blue-600"
                                    />
                                    {day}
                                </label>
                            ))}
                        </div>
                        {errors.days && (
                            <div className={errorTextClass}>
                                {errors.days}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Max Students')}
                        </label>
                        <input
                            type="number"
                            className={fieldInputClass}
                            value={data.capacity}
                            min={1}
                            max={200}
                            onChange={(e) =>
                                setData('capacity', Number(e.target.value))
                            }
                        />
                        {errors.capacity && (
                            <div className={errorTextClass}>
                                {errors.capacity}
                            </div>
                        )}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Monthly Fee (USD)')}
                        </label>
                        <input
                            type="number"
                            className={fieldInputClass}
                            value={selectedLevel?.monthly_fee ?? ''}
                            min={0}
                            readOnly
                        />
                    </div>
                </div>

                <div className="mt-auto flex gap-3 pt-4 max-md:rounded-[22px] max-md:border max-md:border-slate-200 max-md:bg-white/90 max-md:p-2 max-md:shadow-[0_18px_42px_rgba(15,23,42,0.10)] dark:max-md:border-slate-700 dark:max-md:bg-slate-900/90">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300 max-md:flex-1"
                    >
                        <ArrowLeft size={14} /> {translateText('Cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 p-3 text-sm font-black text-white disabled:opacity-70"
                    >
                        {processing ? (
                            translateText('Saving...')
                        ) : (
                            <>
                                <Check size={14} />
                                {translateText(
                                    isEdit ? 'Update Class' : 'Save Class',
                                )}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
