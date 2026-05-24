import {
    destroy,
    downloadLayout as downloadTeacherLayout,
    exportMethod as exportTeachers,
    importMethod as importTeachers,
    show as showTeacher,
    store,
    update,
} from '@/actions/App/Http/Controllers/Backends/TeacherController';
import { index as teacherGrades } from '@/actions/App/Http/Controllers/Backends/TeacherGradeController';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, RowActions, type RowAction } from '@/pages/admin/ui';
import { lessonPlans as lessonPlanIndex } from '@/routes/admin';
import { create as createTeacherLessonPlan } from '@/routes/admin/teachers/lesson-plans';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Camera,
    Check,
    Download,
    Edit3,
    Eye,
    FileDown,
    GraduationCap,
    Phone,
    Plus,
    Save,
    School,
    Trash2,
    Upload,
    User,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type OrderKey =
    | 'name-asc'
    | 'name-desc'
    | 'subject-asc'
    | 'classes-desc'
    | 'students-desc'
    | 'status-asc';

interface TeacherSchedule {
    id: number;
    routeKey?: string;
    name: string;
    time: string;
    room: string;
    count: number;
    days: string;
}

interface TeacherLesson {
    id: number;
    routeKey?: string;
    date: string;
    day: 'Today' | 'Tomorrow';
    title: string;
    className: string;
    room: string;
    time: string;
    objective: string;
    status: 'planned' | 'taught' | 'cancelled';
}

interface Teacher {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    subject: string;
    classes: number;
    students: number;
    phone: string;
    telegramUsername: string | null;
    status: 'active' | 'inactive';
    lessons: TeacherLesson[];
    schedule: TeacherSchedule[];
}

interface TeachersPageProps {
    teachers: Teacher[];
}

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'subject-asc', label: 'Subject' },
    { value: 'classes-desc', label: 'Classes Most' },
    { value: 'students-desc', label: 'Students Most' },
    { value: 'status-asc', label: 'Status' },
];

const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const ghostButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300';
const primaryButtonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const softTileClass = 'rounded-2xl bg-slate-50 p-2 dark:bg-slate-950/70';
const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

function sortTeachers(list: Teacher[], order: OrderKey): Teacher[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc':
                return a.nameEn.localeCompare(b.nameEn);
            case 'name-desc':
                return b.nameEn.localeCompare(a.nameEn);
            case 'subject-asc':
                return a.subject.localeCompare(b.subject);
            case 'classes-desc':
                return b.classes - a.classes;
            case 'students-desc':
                return b.students - a.students;
            case 'status-asc':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });
}

export default function TeachersPage({ teachers }: TeachersPageProps) {
    const { can, canAny } = useAdminPermissions();
    const { translateText } = useAdminTranslation();
    const canShow = can('teachers.show');
    const canCreate = can('teachers.create');
    const canUpdate = can('teachers.update');
    const canDelete = can('teachers.delete');
    const canImport = can('teachers.import');
    const canExport = can('teachers.export');
    const canDownloadLayout = can('teachers.download-layout');
    const canCreateLessonPlan = can('teacher-lesson-plans.create');
    const canViewTeacherGrades = can('teacher-grades.view');
    const canManageTeachers = canAny([
        'teachers.show',
        'teachers.update',
        'teachers.delete',
        'teacher-lesson-plans.create',
        'teacher-grades.view',
    ]);
    const [view, setView] = useState<View>('list');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('name-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [editing, setEditing] = useState<Teacher | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
    const [scheduleTarget, setScheduleTarget] = useState<Teacher | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = (t: Teacher) => {
        if (!canUpdate) {
            return;
        }

        setEditing(t);
        setView('edit');
    };
    const handleDelete = (t: Teacher) => {
        if (!canDelete) {
            return;
        }

        setDeleteTarget(t);
    };
    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(
            destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Teacher deleted successfully!', {
                        description: `${deleteTarget.nameEn} has been removed.`,
                    });
                    setDeleteTarget(null);
                },
            },
        );
    };

    const importFile = (file: File | null) => {
        if (!file) return;
        if (!canImport) return;

        router.post(
            importTeachers.url(),
            { import_file: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Teachers imported successfully.'),
                onError: () =>
                    toast.error(
                        'Unable to import teachers. Please check the CSV layout.',
                    ),
                onFinish: () => {
                    if (importInputRef.current) {
                        importInputRef.current.value = '';
                    }
                },
            },
        );
    };

    useEffect(() => {
        setPage(1);
    }, [search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = teachers.filter(
            (t) =>
                !q ||
                t.nameKh.includes(search) ||
                t.nameEn.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q) ||
                t.phone.includes(search),
        );

        return sortTeachers(base, orderBy);
    }, [teachers, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const teacherActions = (t: Teacher): RowAction[] => {
        const key = (t.routeKey ?? t.id) as never;
        return [
            { key: 'plan', label: translateText('Plan'), icon: School, href: createTeacherLessonPlan.url(key), hidden: !canCreateLessonPlan },
            { key: 'scores', label: translateText('Score management'), icon: Save, href: teacherGrades.url(key), hidden: !canViewTeacherGrades },
            { key: 'view', label: translateText('View'), icon: Eye, href: showTeacher.url(key), hidden: !canShow },
            { key: 'edit', label: translateText('Edit'), icon: Edit3, onSelect: () => handleEdit(t), hidden: !canUpdate },
            { key: 'delete', label: translateText('Delete'), icon: Trash2, onSelect: () => handleDelete(t), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
        ];
    };

    return (
        <AdminShell>
            {/* List view */}
            {view === 'list' && (
                <div className="fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                    <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                        <div>
                            <span className="block text-xs font-black text-slate-400">Teacher directory</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{teachers.length} teachers</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">
                                {teachers.filter((teacher) => teacher.status === 'active').length} active
                                {' '}·{' '}
                                {teachers.reduce((total, teacher) => total + teacher.students, 0)} students
                            </p>
                        </div>
                        {canCreate && (
                            <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]" type="button" onClick={() => setView('add')}>
                                <Plus size={17} />
                            </button>
                        )}
                    </section>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="ml-auto flex flex-wrap items-center gap-2 max-md:w-full max-md:[&>*]:flex-1 max-md:[&>*]:justify-center">
                            {canDownloadLayout && <a
                                href={downloadTeacherLayout.url()}
                                className={ghostButtonClass}
                            >
                                <Download size={14} /> Layout
                            </a>}
                            {canImport && <button
                                type="button"
                                onClick={() => importInputRef.current?.click()}
                                className={ghostButtonClass}
                            >
                                <Upload size={14} /> Import
                            </button>}
                            {canExport && <a
                                href={exportTeachers.url()}
                                className={ghostButtonClass}
                            >
                                <FileDown size={14} /> Export
                            </a>}
                          
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                className="hidden"
                                onChange={(event) =>
                                    importFile(event.target.files?.[0] ?? null)
                                }
                            />
                        </div>
                    </div>

                    <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-b md:shadow-none">
                            <span className="hidden text-[11px] font-black text-slate-400 md:inline">
                                Sort by
                            </span>
                            <Select
                                value={orderBy}
                                onValueChange={(value) =>
                                    setOrderBy(value as OrderKey)
                                }
                            >
                                <SelectTrigger className={`${controlInputClass} min-w-[150px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={perPage.toString()}
                                onValueChange={(value) =>
                                    setPerPage(Number(value))
                                }
                            >
                                <SelectTrigger className={`${controlInputClass} min-w-[120px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={size.toString()}
                                        >
                                            {size} per page
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="hidden text-[11px] font-extrabold text-slate-400 md:inline">
                                {filtered.length} result
                                {filtered.length !== 1 ? 's' : ''}
                            </span>
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className={`${controlInputClass} col-span-2 w-full md:ml-auto md:max-w-[260px]`}
                                data-role="teachers-search"
                                placeholder="Search teachers..."
                            />
                        </div>

                        <table className="data-table hidden md:table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Subject</th>
                                    <th>Classes</th>
                                    <th>Students</th>
                                    <th>Phone</th>
                                    <th>Lessons</th>
                                    <th>Status</th>
                                    {canManageTeachers && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-11 text-center text-sm text-slate-400"
                                        >
                                            {search ? (
                                                <>
                                                    No teachers found for{' '}
                                                    <strong>"{search}"</strong>
                                                </>
                                            ) : (
                                                'No teachers found'
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((t) => (
                                        <tr key={t.id}>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        name={t.nameEn}
                                                        src={t.photo}
                                                        size={34}
                                                    />
                                                    <div className="min-w-0">
                                                        <KH
                                                            className="block text-[13px] font-black"
                                                        >
                                                            {t.nameKh}
                                                        </KH>
                                                        <div className="text-[11px] text-slate-400">
                                                            {t.nameEn}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="text-xs font-bold text-slate-500"
                                            >
                                                {t.subject}
                                            </td>
                                            <td
                                                className="font-black text-blue-600"
                                            >
                                                {t.classes}
                                            </td>
                                            <td
                                                className="font-black text-slate-700 dark:text-slate-200"
                                            >
                                                {t.students}
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <Phone
                                                        size={14}
                                                        color="#64748b"
                                                    />
                                                    {t.phone || '-'}
                                                </span>
                                            </td>
                                            <td className="min-w-[180px]">
                                                {t.lessons.length === 0 ? (
                                                    <span className="text-xs text-slate-400">
                                                        No lessons
                                                    </span>
                                                ) : (
                                                    <Link
                                                        href={lessonPlanIndex.url()}
                                                        className="text-xs font-black text-blue-600 no-underline dark:text-blue-300"
                                                    >
                                                        {t.lessons[0].title}
                                                        <span className="font-bold text-slate-400">
                                                            {' '}
                                                            - {t.lessons[0].day}
                                                        </span>
                                                    </Link>
                                                )}
                                            </td>
                                            <td>
                                                <Badge
                                                    type={
                                                        t.status === 'active'
                                                            ? 'green'
                                                            : 'gray'
                                                    }
                                                >
                                                    {t.status}
                                                </Badge>
                                            </td>
                                            {canManageTeachers && (
                                            <td>
                                                <RowActions
                                                    ariaLabel={`Actions for ${t.nameEn}`}
                                                    actions={teacherActions(t)}
                                                />
                                            </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="grid gap-3 md:hidden">
                            {paginated.length === 0 ? (
                                <div className="py-8 text-center text-sm font-bold text-slate-500">
                                    {search ? (
                                        <>
                                            No teachers found for{' '}
                                            <strong>"{search}"</strong>
                                        </>
                                    ) : (
                                        'No teachers found'
                                    )}
                                </div>
                            ) : (
                                paginated.map((t) => (
                                    <article key={t.id} className={mobileCardClass}>
                                        <div className="mb-3 flex items-start gap-3">
                                            <Avatar name={t.nameEn} src={t.photo} size={42} />
                                            <div className="min-w-0 flex-1">
                                                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{t.nameKh}</KH>
                                                <span className="block truncate text-xs font-extrabold text-slate-400">{t.nameEn}</span>
                                            </div>
                                            <Badge type={t.status === 'active' ? 'green' : 'gray'}>{t.status}</Badge>
                                            {canManageTeachers && (
                                                <RowActions ariaLabel={`Actions for ${t.nameEn}`} actions={teacherActions(t)} />
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                [translateText('Subject'), t.subject || '-'],
                                                [translateText('Classes'), t.classes],
                                                [translateText('Students'), t.students],
                                                [translateText('Phone'), t.phone || '-'],
                                            ].map(([label, value]) => (
                                                <div key={String(label)} className={softTileClass}>
                                                    <span className="block text-[10px] font-black uppercase text-slate-400">{label}</span>
                                                    <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{value}</strong>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                                            {t.lessons.length > 0 ? (
                                                <Link href={lessonPlanIndex.url()} className="text-xs font-black text-blue-600 no-underline dark:text-blue-300">
                                                    {t.lessons[0].title}
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">No lessons</span>
                                            )}
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
                <TeacherForm
                    mode={view}
                    teacher={editing ?? undefined}
                    onBack={() => {
                        setView('list');
                        setEditing(null);
                    }}
                />
            )}

            {/* Schedule modal */}
            {scheduleTarget && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget)
                            setScheduleTarget(null);
                    }}
                >
                    <div className="w-full max-w-[480px] rounded-[20px] bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:bg-slate-800">
                        <div className="mb-5 flex items-center gap-3.5">
                            <Avatar
                                name={scheduleTarget.nameEn}
                                src={scheduleTarget.photo}
                                size={48}
                            />
                            <div>
                                <KH className="block text-base font-black text-slate-900 dark:text-slate-50">
                                    {scheduleTarget.nameKh}
                                </KH>
                                <div className="text-xs font-bold text-slate-400">
                                    {scheduleTarget.subject}
                                </div>
                            </div>
                            <button
                                onClick={() => setScheduleTarget(null)}
                                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="mb-2.5 text-xs font-black text-slate-500 dark:text-slate-400">
                                CLASS SCHEDULE
                            </div>
                            {scheduleTarget.schedule.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-950/70"
                                >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                        <School size={17} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[13px] font-bold text-slate-900 dark:text-slate-50">
                                            {cls.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {cls.days}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-xs font-bold text-blue-500">
                                            {cls.time}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Room {cls.room} - {cls.count}{' '}
                                            students
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {scheduleTarget.schedule.length === 0 && (
                                <div className="p-5 text-center text-[13px] text-slate-400">
                                    No classes assigned yet.
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setScheduleTarget(null)}
                            className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
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
                                Remove Teacher?
                            </div>
                            <div className="text-[13px] font-bold leading-6 text-slate-500 dark:text-slate-400">
                                Are you sure you want to remove{' '}
                                <KH
                                    className="font-bold text-slate-900 dark:text-slate-50"
                                >
                                    {deleteTarget.nameKh}
                                </KH>{' '}
                                ({deleteTarget.nameEn})? This action cannot be
                                undone.
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 rounded-xl bg-red-500 p-3 text-sm font-bold text-white"
                            >
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// Add / Edit Teacher form
interface FormProps {
    mode: 'add' | 'edit';
    teacher?: Teacher;
    onBack: () => void;
}

interface TeacherFormData {
    name_kh: string;
    name_en: string;
    profile_photo: File | null;
    subject: string;
    phone: string;
    telegram_username: string;
    status: 'active' | 'inactive';
    _method?: 'put';
}

function TeacherForm({ mode, teacher, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const { translateText } = useAdminTranslation();
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        teacher?.photo ?? null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, transform } =
        useForm<TeacherFormData>({
            name_kh: teacher?.nameKh ?? '',
            name_en: teacher?.nameEn ?? '',
            profile_photo: null,
            subject: teacher?.subject ?? '',
            phone: teacher?.phone ?? '',
            telegram_username: teacher?.telegramUsername ?? '',
            status: teacher?.status ?? 'active',
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform((formData) => ({
            ...formData,
            ...(isEdit ? { _method: 'put' as const } : {}),
            subject: formData.subject || null,
            phone: formData.phone || null,
            telegram_username: formData.telegram_username || null,
        }));

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    isEdit
                        ? 'Teacher updated successfully!'
                        : 'Teacher added successfully!',
                    {
                        description: isEdit
                            ? `${data.name_en} has been updated.`
                            : 'New teacher has been created.',
                    },
                );
                onBack();
            },
        };

        if (isEdit && teacher) {
            post(
                update.url((teacher.routeKey ?? teacher.id) as never),
                options,
            );

            return;
        }

        post(store.url(), options);
    };

    const inputError = (message?: string) =>
        message ? (
            <div className="mt-1 text-[11px] font-bold text-red-500">
                {message}
            </div>
        ) : null;

    return (
        <div className="fade-in bg-slate-50 p-6 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
            <form
                className="mx-auto w-full max-w-[600px] rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
                onSubmit={submit}
            >
                {/* Header */}
                <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        {isEdit ? (
                            <Edit3 size={20} />
                        ) : (
                            <GraduationCap size={20} />
                        )}
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                            {translateText(
                                isEdit ? 'Edit Teacher' : 'Add New Teacher',
                            )}
                        </div>
                        {isEdit && teacher && (
                            <div className="text-xs font-extrabold text-slate-400">
                                {teacher.nameEn}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div className="col-span-full mb-1 flex flex-col items-center gap-2.5 rounded-[22px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/90">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-950"
                        >
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Teacher profile preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User size={36} color="#94a3b8" />
                            )}
                            <div className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-blue-600">
                                <Camera size={12} color="white" />
                            </div>
                        </div>
                        <div className="text-center text-xs font-extrabold text-slate-400">
                            {data.profile_photo
                                ? data.profile_photo.name
                                : translateText(
                                      'Click to upload profile photo',
                                  )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setData('profile_photo', file);
                                setPhotoPreview(
                                    file
                                        ? URL.createObjectURL(file)
                                        : (teacher?.photo ?? null),
                                );
                            }}
                        />
                        {inputError(errors.profile_photo as string | undefined)}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Khmer Name')} *
                        </label>
                        <input
                            className={fieldInputClass}
                            placeholder={translateText('e.g. Teacher Vuthy')}
                            value={data.name_kh}
                            onChange={(e) => setData('name_kh', e.target.value)}
                        />
                        {inputError(errors.name_kh)}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('English Name')} *
                        </label>
                        <input
                            className={fieldInputClass}
                            placeholder="e.g. Mr. Vuthy"
                            value={data.name_en}
                            onChange={(e) => setData('name_en', e.target.value)}
                        />
                        {inputError(errors.name_en)}
                    </div>
                    <div className={`${fieldGroupClass} col-span-full`}>
                        <label className={fieldLabelClass}>
                            {translateText('Subject')} *
                        </label>
                        <Select
                            value={data.subject}
                            onValueChange={(value) => setData('subject', value)}
                        >
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue
                                    placeholder={translateText(
                                        'Select subject...',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    'English Grammar',
                                    'Conversation',
                                    'Writing Skills',
                                    'Listening Skills',
                                    'Reading Comprehension',
                                    'Pronunciation',
                                ].map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {translateText(s)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {inputError(errors.subject)}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Phone')}
                        </label>
                        <input
                            type="tel"
                            className={fieldInputClass}
                            placeholder="0xx-xxx-xxx"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        {inputError(errors.phone)}
                    </div>
                    <div className={fieldGroupClass}>
                        <label className={fieldLabelClass}>
                            {translateText('Status')}
                        </label>
                        <Select
                            value={data.status}
                            onValueChange={(value) =>
                                setData(
                                    'status',
                                    value as 'active' | 'inactive',
                                )
                            }
                        >
                            <SelectTrigger className={fieldInputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">
                                    {translateText('Active')}
                                </SelectItem>
                                <SelectItem value="inactive">
                                    {translateText('Inactive')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {inputError(errors.status)}
                    </div>
                    <div className={`${fieldGroupClass} col-span-full`}>
                        <label className={fieldLabelClass}>
                            {translateText('Telegram Username')}
                        </label>
                        <input
                            className={fieldInputClass}
                            placeholder="@username"
                            value={data.telegram_username}
                            onChange={(e) =>
                                setData('telegram_username', e.target.value)
                            }
                        />
                        {inputError(errors.telegram_username)}
                    </div>
                </div>

                <div className="mt-4 flex gap-3 max-md:sticky max-md:bottom-[74px] max-md:z-10 max-md:rounded-[22px] max-md:border max-md:border-slate-200 max-md:bg-white/90 max-md:p-2 max-md:shadow-[0_18px_42px_rgba(15,23,42,0.14)] max-md:backdrop-blur dark:max-md:border-slate-700 dark:max-md:bg-slate-900/90">
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
                                    isEdit ? 'Update Teacher' : 'Save Teacher',
                                )}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
