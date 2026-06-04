import {
    create as createStudent,
    destroy,
    downloadLayout as downloadStudentLayout,
    edit as editStudent,
    exportMethod as exportStudents,
    importMethod as importStudents,
    show as showStudent,
} from '@/actions/App/Http/Controllers/Backends/StudentController';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import {
    AdminSelect,
    Avatar,
    Badge,
    FeeTag,
    KH,
    Pagination,
    PBar,
    RowActions,
    ScoreChip,
} from '@/pages/admin/ui';
import { Link, router } from '@inertiajs/react';
import {
    Download,
    Edit3,
    Eye,
    FileDown,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface Grade {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

export interface Student {
    id: number;
    routeKey?: string;
    code: string | null;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    cls: string;
    attendance: number;
    fees: 'Paid' | 'Unpaid' | 'Partial';
    amt: number;
    grade: Grade;
    village: string;
    province: string;
}

interface StudentsPageProps {
    students: Student[];
}

type OrderKey =
    | 'name-asc'
    | 'name-desc'
    | 'attend-desc'
    | 'attend-asc'
    | 'score-desc'
    | 'score-asc'
    | 'level-asc'
    | 'fee-asc'
    | 'province-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'attend-desc', label: 'Attendance Highest' },
    { value: 'attend-asc', label: 'Attendance Lowest' },
    { value: 'score-desc', label: 'Score Highest' },
    { value: 'score-asc', label: 'Score Lowest' },
    { value: 'level-asc', label: 'Level' },
    { value: 'fee-asc', label: 'Fee Status' },
    { value: 'province-asc', label: 'Province' },
];

const avg = (student: Student): number =>
    Math.round(
        Object.values(student.grade).reduce(
            (total, score) => total + score,
            0,
        ) / 4,
    );

function sortStudents(list: Student[], order: OrderKey): Student[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc':
                return a.nameEn.localeCompare(b.nameEn);
            case 'name-desc':
                return b.nameEn.localeCompare(a.nameEn);
            case 'attend-desc':
                return b.attendance - a.attendance;
            case 'attend-asc':
                return a.attendance - b.attendance;
            case 'score-desc':
                return avg(b) - avg(a);
            case 'score-asc':
                return avg(a) - avg(b);
            case 'level-asc':
                return a.level.localeCompare(b.level);
            case 'fee-asc':
                return a.fees.localeCompare(b.fees);
            case 'province-asc':
                return a.province.localeCompare(b.province);
            default:
                return 0;
        }
    });
}

const mobileCardClass =
    'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition dark:border-slate-700 dark:bg-slate-800/90';
const softTileClass = 'rounded-2xl bg-slate-50 p-2 dark:bg-slate-950/70';
const ghostButtonClass =
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300';
const primaryButtonClass =
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white';
const controlInputClass =
    'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

/* â”€â”€â”€ Mobile card for one student â”€â”€â”€ */
function StudentCard({
    student,
    onSelect,
    selected,
    canShow,
    canUpdate,
    canDelete,
    onDelete,
}: {
    student: Student;
    selected: boolean;
    canShow: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className={`${mobileCardClass} cursor-pointer ${selected ? 'border-blue-300 bg-blue-50/90 dark:border-blue-400/50 dark:bg-blue-500/10' : ''}`}
            onClick={onSelect}
        >
            <div className="mb-3 flex items-center gap-3">
                <Avatar name={student.nameEn} src={student.photo} size={42} />
                <div className="min-w-0 flex-1">
                    <KH className="block truncate text-sm leading-tight font-black text-slate-900 dark:text-slate-50">
                        {student.nameKh}
                    </KH>
                    <div className="truncate text-xs font-extrabold text-slate-400">
                        {student.nameEn}
                    </div>
                    {student.code && (
                        <div className="mt-0.5 truncate text-[11px] font-black text-blue-500 dark:text-blue-300">
                            {student.code}
                        </div>
                    )}
                </div>
                <FeeTag status={student.fees} />
                <div onClick={(e) => e.stopPropagation()}>
                    <RowActions
                        ariaLabel={`Actions for ${student.nameEn}`}
                        actions={[
                            {
                                key: 'view',
                                label: 'View',
                                icon: Eye,
                                href: showStudent.url(
                                    (student.routeKey ?? student.id) as never,
                                ),
                                hidden: !canShow,
                            },
                            {
                                key: 'edit',
                                label: 'Edit',
                                icon: Edit3,
                                href: editStudent.url(
                                    (student.routeKey ?? student.id) as never,
                                ),
                                hidden: !canUpdate,
                            },
                            {
                                key: 'delete',
                                label: 'Delete',
                                icon: Trash2,
                                onSelect: onDelete,
                                variant: 'destructive',
                                separatorBefore: true,
                                hidden: !canDelete,
                            },
                        ]}
                    />
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge type="blue">{student.level}</Badge>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {student.cls}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {student.province}
                </span>
            </div>

            <div className={`${softTileClass} mb-3 flex items-center gap-3`}>
                <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase">
                        Attendance
                    </span>
                    <strong className="block text-base font-black text-slate-900 dark:text-slate-50">
                        {student.attendance}%
                    </strong>
                </div>
                <PBar
                    value={student.attendance}
                    color={student.attendance >= 80 ? 'green' : 'red'}
                />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {(['speaking', 'listening', 'reading', 'writing'] as const).map(
                    (skill) => (
                        <div key={skill} className={softTileClass}>
                            <div className="mb-1 text-center text-[10px] font-black text-slate-400 capitalize">
                                {skill.slice(0, 4)}
                            </div>
                            <ScoreChip score={student.grade[skill]} />
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}

export default function StudentsPage({ students }: StudentsPageProps) {
    const { can, canAny } = useAdminPermissions();
    const canShow = can('students.show');
    const canCreate = can('students.create');
    const canUpdate = can('students.update');
    const canDelete = can('students.delete');
    const canImport = can('students.import');
    const canExport = can('students.export');
    const canDownloadLayout = can('students.download-layout');
    const canManageStudents = canAny([
        'students.show',
        'students.update',
        'students.delete',
    ]);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [orderBy, setOrderBy] = useState<OrderKey>('name-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPage(1);
    }, [search, filter, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = students.filter((student) => {
            const matchesSearch =
                !query ||
                student.nameKh.includes(search) ||
                student.nameEn.toLowerCase().includes(query) ||
                (student.code ?? '').toLowerCase().includes(query) ||
                student.province.toLowerCase().includes(query);
            const matchesFilter =
                filter === 'all' ||
                (filter === 'atrisk' &&
                    (student.attendance < 70 || student.fees === 'Unpaid')) ||
                student.level.toLowerCase().includes(filter.toLowerCase());
            return matchesSearch && matchesFilter;
        });
        return sortStudents(base, orderBy);
    }, [students, search, filter, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

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
                    toast.success('Student deleted successfully!', {
                        description: `${deleteTarget.nameEn} has been removed.`,
                    });
                    if (selected?.id === deleteTarget.id) setSelected(null);
                    setDeleteTarget(null);
                },
            },
        );
    };

    const importFile = (file: File | null) => {
        if (!file) return;
        if (!canImport) return;

        router.post(
            importStudents.url(),
            { import_file: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Students imported successfully.'),
                onError: () =>
                    toast.error(
                        'Unable to import students. Please check the CSV layout.',
                    ),
                onFinish: () => {
                    if (importInputRef.current) {
                        importInputRef.current.value = '';
                    }
                },
            },
        );
    };

    const FILTER_OPTIONS = [
        { id: 'all', l: 'All' },
        { id: 'Beginner', l: 'Beginner' },
        { id: 'Intermediate', l: 'Inter.' },
        { id: 'Advanced', l: 'Advanced' },
        { id: 'atrisk', l: 'At-Risk' },
    ];

    return (
        <AdminShell>
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 fade-in max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] md:gap-5 md:p-6 dark:bg-slate-950 dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <section className="hidden items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] max-md:flex dark:border-slate-700 dark:bg-slate-800/90">
                    <div>
                        <span className="block text-xs font-black text-slate-400">
                            Student directory
                        </span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">
                            {students.length} students
                        </strong>
                    </div>
                    {canCreate && (
                        <Link
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]"
                            href={createStudent.url()}
                        >
                            <Plus size={16} />
                        </Link>
                    )}
                </section>

                <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
                    <div className="flex flex-wrap gap-3 max-md:grid max-md:grid-cols-3 max-md:gap-2">
                        {[
                            {
                                l: 'Paid',
                                v: students.filter((s) => s.fees === 'Paid')
                                    .length,
                                dot: 'bg-emerald-500',
                            },
                            {
                                l: 'Unpaid',
                                v: students.filter((s) => s.fees === 'Unpaid')
                                    .length,
                                dot: 'bg-red-500',
                            },
                            {
                                l: 'At-Risk',
                                v: students.filter(
                                    (s) =>
                                        s.attendance < 70 ||
                                        s.fees === 'Unpaid',
                                ).length,
                                dot: 'bg-amber-500',
                            },
                        ].map((stat) => (
                            <div
                                key={stat.l}
                                className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 max-md:block max-md:px-3 max-md:py-2 dark:border-slate-700 dark:bg-slate-800/90"
                            >
                                <div
                                    className={`mb-1 h-2 w-2 shrink-0 rounded-full max-md:mb-2 ${stat.dot}`}
                                />
                                <span className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                                    {stat.l}
                                </span>
                                <span className="block text-base font-black text-slate-900 dark:text-slate-50">
                                    {stat.v}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2 max-md:w-full max-md:[&>*]:flex-1 max-md:[&>*]:justify-center">
                        {canDownloadLayout && (
                            <a
                                href={downloadStudentLayout.url()}
                                className={ghostButtonClass}
                            >
                                <Download size={14} /> Layout
                            </a>
                        )}
                        {canImport && (
                            <button
                                type="button"
                                onClick={() => importInputRef.current?.click()}
                                className={ghostButtonClass}
                            >
                                <Upload size={14} /> Import
                            </button>
                        )}
                        {canExport && (
                            <a
                                href={exportStudents.url()}
                                className={ghostButtonClass}
                            >
                                <FileDown size={14} /> Export
                            </a>
                        )}
                        {canCreate && (
                            <Link
                                href={createStudent.url()}
                                className={primaryButtonClass}
                            >
                                <Plus size={14} /> Add Student
                            </Link>
                        )}
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

                <div className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur md:static md:mb-0 md:grid md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-0 md:border-b md:border-slate-200 md:bg-white md:p-4 md:shadow-none md:backdrop-blur-none dark:border-slate-700 dark:bg-slate-800/90 dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden text-[11px] font-black text-slate-400 md:inline">
                                Sort by
                            </span>
                            <AdminSelect
                                value={orderBy}
                                onChange={(value) =>
                                    setOrderBy(value as OrderKey)
                                }
                                options={ORDER_OPTIONS}
                                className="min-w-[150px] md:w-[180px]"
                                triggerClassName={controlInputClass}
                            />
                            <div className="hidden h-5 w-px bg-slate-200 md:block" />
                            <AdminSelect
                                value={perPage.toString()}
                                onChange={(value) => {
                                    setPerPage(Number(value));
                                    setPage(1);
                                }}
                                options={[5, 10, 25, 50].map((size) => ({
                                    value: size.toString(),
                                    label: `${size} / page`,
                                }))}
                                className="min-w-[120px] md:w-[140px]"
                                triggerClassName={controlInputClass}
                            />
                            <span className="hidden text-[11px] font-extrabold text-slate-400 md:inline">
                                {filtered.length} result
                                {filtered.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="col-span-2 flex flex-wrap gap-1.5 md:order-3 md:col-span-3 md:border-t md:border-slate-200 md:pt-3 dark:md:border-slate-700">
                            {FILTER_OPTIONS.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-black ${filter === item.id ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-400/50 dark:bg-blue-500/15 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}
                                >
                                    {item.l}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`${controlInputClass} col-span-2 w-full md:order-2 md:col-span-1 md:col-start-3 md:ml-0 md:max-w-none`}
                            placeholder="Search students..."
                        />
                    </div>

                    <div className="hidden md:block">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Level</th>
                                    <th>Class</th>
                                    <th>Attendance</th>
                                    <th>Speaking</th>
                                    <th>Listening</th>
                                    <th>Reading</th>
                                    <th>Writing</th>
                                    <th>Province</th>
                                    {canManageStudents && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={canManageStudents ? 10 : 9}
                                            className="px-6 py-8 text-center text-sm font-bold text-slate-500"
                                        >
                                            Data not found
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setSelected(
                                                    student.id === selected?.id
                                                        ? null
                                                        : student,
                                                )
                                            }
                                        >
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        name={student.nameEn}
                                                        src={student.photo}
                                                        size={34}
                                                    />
                                                    <div>
                                                        <KH className="block text-[13px] font-bold">
                                                            {student.nameKh}
                                                        </KH>
                                                        <div className="text-[11px] text-slate-400">
                                                            {student.nameEn}
                                                        </div>
                                                        {student.code && (
                                                            <div className="mt-0.5 text-[11px] font-black text-blue-500 dark:text-blue-300">
                                                                {student.code}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge type="blue">
                                                    {student.level}
                                                </Badge>
                                            </td>
                                            <td className="text-xs text-slate-500">
                                                {student.cls}
                                            </td>
                                            <td>
                                                <div className="flex min-w-[100px] items-center gap-1.5">
                                                    <PBar
                                                        value={
                                                            student.attendance
                                                        }
                                                        color={
                                                            student.attendance >=
                                                            80
                                                                ? 'green'
                                                                : 'red'
                                                        }
                                                    />
                                                    <span
                                                        className={`w-9 shrink-0 text-xs font-bold ${student.attendance >= 80 ? 'text-emerald-500' : 'text-red-500'}`}
                                                    >
                                                        {student.attendance}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <ScoreChip
                                                    score={
                                                        student.grade.speaking
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <ScoreChip
                                                    score={
                                                        student.grade.listening
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <ScoreChip
                                                    score={
                                                        student.grade.reading
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <ScoreChip
                                                    score={
                                                        student.grade.writing
                                                    }
                                                />
                                            </td>
                                            <td className="text-xs text-slate-500">
                                                {student.province}
                                            </td>
                                            {canManageStudents && (
                                                <td
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <RowActions
                                                        ariaLabel={`Actions for ${student.nameEn}`}
                                                        actions={[
                                                            {
                                                                key: 'view',
                                                                label: 'View',
                                                                icon: Eye,
                                                                href: showStudent.url(
                                                                    (student.routeKey ??
                                                                        student.id) as never,
                                                                ),
                                                                hidden: !canShow,
                                                            },
                                                            {
                                                                key: 'edit',
                                                                label: 'Edit',
                                                                icon: Edit3,
                                                                href: editStudent.url(
                                                                    (student.routeKey ??
                                                                        student.id) as never,
                                                                ),
                                                                hidden: !canUpdate,
                                                            },
                                                            {
                                                                key: 'delete',
                                                                label: 'Delete',
                                                                icon: Trash2,
                                                                onSelect: () =>
                                                                    setDeleteTarget(
                                                                        student,
                                                                    ),
                                                                variant:
                                                                    'destructive',
                                                                separatorBefore: true,
                                                                hidden: !canDelete,
                                                            },
                                                        ]}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 md:hidden">
                        {paginated.length === 0 ? (
                            <div className="py-8 text-center text-sm font-bold text-slate-500">
                                Data not found
                            </div>
                        ) : (
                            paginated.map((student) => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                    selected={selected?.id === student.id}
                                    canShow={canShow}
                                    canUpdate={canUpdate}
                                    canDelete={canDelete}
                                    onSelect={() =>
                                        setSelected(
                                            student.id === selected?.id
                                                ? null
                                                : student,
                                        )
                                    }
                                    onDelete={() => setDeleteTarget(student)}
                                />
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

                <Dialog
                    open={selected !== null}
                    onOpenChange={(open) => !open && setSelected(null)}
                >
                    <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-200 bg-white p-0 text-slate-950 shadow-2xl sm:max-w-3xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
                        {selected && (
                            <>
                                <DialogHeader className="border-b border-slate-100 p-5 text-left dark:border-slate-800">
                                    <div className="flex flex-wrap items-start gap-4 pr-8">
                                        <Avatar
                                            name={selected.nameEn}
                                            src={selected.photo}
                                            size={64}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <DialogTitle asChild>
                                                <KH className="mb-1 block text-2xl font-black tracking-normal text-slate-950 dark:text-slate-50">
                                                    {selected.nameKh}
                                                </KH>
                                            </DialogTitle>
                                            <DialogDescription className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                {selected.nameEn} /{' '}
                                                {selected.level}
                                            </DialogDescription>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Badge type="blue">
                                                    {selected.level}
                                                </Badge>
                                                {selected.attendance < 70 && (
                                                    <Badge type="red">
                                                        Low Attendance
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="grid gap-4 p-5">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                                            <div className="text-[11px] font-black text-slate-400 uppercase">
                                                Attendance
                                            </div>
                                            <div
                                                className={`mt-2 text-3xl font-black ${selected.attendance >= 80 ? 'text-emerald-500' : 'text-red-500'}`}
                                            >
                                                {selected.attendance}%
                                            </div>
                                            <PBar
                                                value={selected.attendance}
                                                color={
                                                    selected.attendance >= 80
                                                        ? 'green'
                                                        : 'red'
                                                }
                                            />
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                                            <div className="text-[11px] font-black text-slate-400 uppercase">
                                                Average Score
                                            </div>
                                            <div className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-50">
                                                {avg(selected)}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                                            <div className="text-[11px] font-black text-slate-400 uppercase">
                                                Location
                                            </div>
                                            <div className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">
                                                {selected.province || 'Unknown'}
                                            </div>
                                            {selected.village && (
                                                <div className="mt-1 text-xs font-bold text-slate-400">
                                                    {selected.village}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        {(
                                            [
                                                'speaking',
                                                'listening',
                                                'reading',
                                                'writing',
                                            ] as const
                                        ).map((skill) => (
                                            <div
                                                key={skill}
                                                className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center dark:border-slate-700 dark:bg-slate-950/70"
                                            >
                                                <div className="mb-2 text-[10px] font-black text-slate-400 uppercase">
                                                    {skill}
                                                </div>
                                                <ScoreChip
                                                    score={
                                                        selected.grade[skill]
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter className="border-t border-slate-100 p-5 sm:justify-between dark:border-slate-800">
                                    <div className="text-xs font-bold text-slate-400">
                                        Class:{' '}
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {selected.cls}
                                        </span>
                                    </div>
                                    <div className="flex w-full gap-2 sm:w-auto">
                                        {canUpdate && (
                                            <Link
                                                href={editStudent.url(
                                                    (selected.routeKey ??
                                                        selected.id) as never,
                                                )}
                                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-center text-[13px] font-bold text-blue-600 no-underline sm:flex-none dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-300"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </Link>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() =>
                                                    setDeleteTarget(selected)
                                                }
                                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-bold text-red-500 sm:flex-none dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-300"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* â”€â”€ Delete confirmation modal â”€â”€ */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDeleteTarget(null);
                    }}
                >
                    <div className="w-full max-w-[420px] rounded-[20px] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">
                                Delete Student?
                            </div>
                            <div className="text-[13px] leading-6 font-bold text-slate-500 dark:text-slate-400">
                                Are you sure you want to remove{' '}
                                <strong>{deleteTarget.nameEn}</strong>? This
                                action cannot be undone.
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                            >
                                <X size={15} /> Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 p-3 text-sm font-bold text-white"
                            >
                                <Trash2 size={15} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
