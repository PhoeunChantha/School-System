import { store, update } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, KH } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FormEvent, useMemo, useState } from 'react';
import { ClipboardCheck, Edit3, Search } from 'lucide-react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceStudent {
    id: number;
    routeKey?: string;
    code: string;
    nameKh: string;
    nameEn: string;
    province: string;
    photo?: string | null;
}

interface AttendanceClass {
    id: number;
    routeKey?: string;
    name: string;
    students: AttendanceStudent[];
}

interface AttendanceRecordItem {
    id: number;
    routeKey?: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    province: string;
    photo?: string | null;
    status: AttendanceStatus;
    note: string;
}

interface AttendanceSessionItem {
    id: number;
    routeKey?: string;
    schoolClassId: number;
    className: string;
    attendanceDate: string;
    period: string;
    markedAt: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    records: AttendanceRecordItem[];
}

interface AttendanceFormRecord {
    student_id: number;
    routeKey?: string;
    status: AttendanceStatus;
    note: string;
}

interface AttendanceFormData {
    school_class_id: number | null;
    attendance_date: string;
    period: string;
    records: AttendanceFormRecord[];
}

interface MarkAttendancePageProps {
    classes: AttendanceClass[];
    editingSession?: AttendanceSessionItem | null;
    initialClassId?: number | null;
}

const PERIODS = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'full_day', label: 'Full Day' },
];

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string; idleClass: string }[] = [
    {
        value: 'present',
        label: 'Present',
        activeClass: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
        idleClass: 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
    },
    {
        value: 'absent',
        label: 'Absent',
        activeClass: 'border-red-500/35 bg-red-500/15 text-red-600 dark:text-red-300',
        idleClass: 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
    },
    {
        value: 'late',
        label: 'Late',
        activeClass: 'border-amber-500/35 bg-amber-500/15 text-amber-600 dark:text-amber-300',
        idleClass: 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
    },
    {
        value: 'excused',
        label: 'Excused',
        activeClass: 'border-blue-500/35 bg-blue-500/15 text-blue-600 dark:text-blue-300',
        idleClass: 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
    },
];

const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const errorTextClass = 'text-[11px] font-bold text-red-500';

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function periodLabel(period: string): string {
    return PERIODS.find(item => item.value === period)?.label ?? period;
}

export default function MarkAttendancePage({ classes, editingSession, initialClassId }: MarkAttendancePageProps) {
    const isEdit = !!editingSession;
    const firstClass = classes.find(schoolClass => schoolClass.id === initialClassId) ?? classes[0];
    const [studentSearch, setStudentSearch] = useState('');

    const { data, setData, post, put, processing, errors } = useForm<AttendanceFormData>({
        school_class_id: editingSession?.schoolClassId ?? firstClass?.id ?? null,
        attendance_date: editingSession?.attendanceDate ?? today(),
        period: editingSession?.period ?? 'morning',
        records: editingSession?.records?.map(record => ({
            student_id: record.studentId,
            status: record.status,
            note: record.note,
        })) ?? firstClass?.students?.map(student => ({
            student_id: student.id,
            status: 'present',
            note: '',
        })) ?? [],
    });

    const selectedClassStudents = useMemo(
        () => classes.find(schoolClass => schoolClass.id === data.school_class_id)?.students ?? [],
        [classes, data.school_class_id],
    );
    const filteredClassStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();

        if (!query) {
            return selectedClassStudents;
        }

        return selectedClassStudents.filter(student => [
            student.code,
            student.nameKh,
            student.nameEn,
            student.province,
        ].some(value => value.toLowerCase().includes(query)));
    }, [selectedClassStudents, studentSearch]);

    const changeClass = (classId: number) => {
        const schoolClass = classes.find(item => item.id === classId) ?? null;

        setData(current => ({
            ...current,
            school_class_id: classId || null,
            records: schoolClass?.students.map(student => ({
                student_id: student.id,
                status: 'present',
                note: '',
            })) ?? [],
        }));
        setStudentSearch('');
    };

    const setRecordStatus = (studentId: number, status: AttendanceStatus) => {
        setData(current => ({
            ...current,
            records: current.records.map(record => record.student_id === studentId ? { ...record, status } : record),
        }));
    };

    const setRecordNote = (studentId: number, note: string) => {
        setData(current => ({
            ...current,
            records: current.records.map(record => record.student_id === studentId ? { ...record, note } : record),
        }));
    };

    const markAll = (status: AttendanceStatus) => {
        setData(current => ({
            ...current,
            records: current.records.map(record => ({ ...record, status })),
        }));
    };

    const modalCounts = data.records.reduce<Record<AttendanceStatus, number>>((counts, record) => ({
        ...counts,
        [record.status]: counts[record.status] + 1,
    }), { present: 0, absent: 0, late: 0, excused: 0 });
    const selectedClassName = classes.find(schoolClass => schoolClass.id === data.school_class_id)?.name ?? 'No class selected';

    const submitAttendance = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Attendance updated.' : 'Attendance created.');
                router.visit('/admin/attendance');
            },
        };

        if (isEdit && editingSession) {
            put(update.url((editingSession.routeKey ?? editingSession.id) as never), options);
            return;
        }

        post(store.url(), options);
    };

    return (
        <AdminShell>
            <div className="fade-in bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <form className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 md:p-6" onSubmit={submitAttendance}>
                    <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isEdit ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                                {isEdit ? <Edit3 size={20} /> : <ClipboardCheck size={20} />}
                            </div>
                            <div className="min-w-0">
                                <span className="block text-[11px] font-black text-slate-400">{isEdit ? 'Edit daily attendance' : 'Daily attendance'}</span>
                                <strong className="mt-0.5 block truncate text-xl font-black text-slate-900 dark:text-slate-50">{isEdit ? 'Edit Attendance' : 'Mark Attendance'}</strong>
                                <p className="mt-0.5 truncate text-xs font-extrabold text-slate-500 dark:text-slate-300">{selectedClassName} - {periodLabel(data.period)}</p>
                            </div>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]">
                            <span className="text-lg font-black leading-none">{data.records.length}</span>
                            <p className="text-[9px] font-black leading-none">students</p>
                        </div>
                    </div>

                    <div className="grid gap-2 rounded-[22px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/70 md:grid-cols-3">
                        <div className={fieldGroupClass}>
                            <label className={fieldLabelClass}>Class *</label>
                            <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => changeClass(Number(val))} disabled={isEdit}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(schoolClass => (
                                        <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>{schoolClass.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.school_class_id && <div className={errorTextClass}>{errors.school_class_id}</div>}
                        </div>
                        <div className={fieldGroupClass}>
                            <label className={fieldLabelClass}>Date *</label>
                            <DatePicker value={data.attendance_date} onChange={value => setData('attendance_date', value)} className={fieldInputClass} />
                            {errors.attendance_date && <div className={errorTextClass}>{errors.attendance_date}</div>}
                        </div>
                        <div className={fieldGroupClass}>
                            <label className={fieldLabelClass}>Period *</label>
                            <Select value={data.period} onValueChange={val => setData('period', val)}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIODS.map(period => (
                                        <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.period && <div className={errorTextClass}>{errors.period}</div>}
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-700 dark:bg-slate-950/60 md:flex md:items-center md:justify-between">
                        <div>
                            <span className="block text-[11px] font-black uppercase text-slate-400">Mark all</span>
                            <strong className="mt-0.5 block text-xs font-black text-slate-900 dark:text-slate-50">{modalCounts.present} present / {modalCounts.absent} absent / {modalCounts.late} late / {modalCounts.excused} excused</strong>
                        </div>
                        <div className="grid grid-cols-4 gap-2 md:flex md:flex-wrap">
                            {STATUS_OPTIONS.map(status => (
                                <button className={`min-h-9 rounded-xl border px-2 py-2 text-[11px] font-black transition hover:scale-[1.01] ${status.activeClass}`} key={status.value} type="button" onClick={() => markAll(status.value)}>
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2 rounded-[22px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/70 md:grid-cols-[minmax(220px,1fr)_auto] md:items-center">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="Search students in this class"
                                type="search"
                                value={studentSearch}
                                onChange={event => setStudentSearch(event.target.value)}
                            />
                        </label>
                        <div className="text-xs font-black text-slate-500 dark:text-slate-300">
                            {filteredClassStudents.length} of {selectedClassStudents.length} students
                        </div>
                    </div>

                    <div className="grid gap-3 md:overflow-hidden md:rounded-[22px] md:border md:border-slate-200 md:bg-white dark:md:border-slate-700 dark:md:bg-slate-800/70">
                        {selectedClassStudents.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 md:border-0">Data not found</div>
                        ) : filteredClassStudents.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 md:border-0">No students match this search</div>
                        ) : filteredClassStudents.map(student => {
                            const record = data.records.find(item => item.student_id === student.id);
                            return (
                                <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800 md:grid-cols-[minmax(210px,1fr)_minmax(280px,1.4fr)_minmax(160px,.8fr)] md:items-center md:rounded-none md:border-x-0 md:border-t-0 md:shadow-none" key={student.id}>
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <Avatar name={student.nameEn} size={34} src={student.photo} />
                                        <div className="min-w-0">
                                            <KH className="block truncate text-[13px] font-black text-slate-900 dark:text-slate-50">{student.nameKh}</KH>
                                            <div className="truncate text-[11px] font-bold text-slate-400">{student.code ? `${student.code} - ` : ''}{student.nameEn}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                        {STATUS_OPTIONS.map(status => {
                                            const active = record?.status === status.value;
                                            return (
                                                <button className={`min-h-10 rounded-xl border px-2 py-2 text-[11px] font-black transition ${active ? status.activeClass : status.idleClass}`} key={status.value} type="button" onClick={() => setRecordStatus(student.id, status.value)}>
                                                    {status.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="Note" value={record?.note ?? ''} onChange={event => setRecordNote(student.id, event.target.value)} />
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-1 grid grid-cols-[1fr_2fr] gap-2 rounded-[22px] border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 md:border-0 md:bg-transparent md:p-0">
                        <button type="button" onClick={() => router.visit('/admin/attendance')} className="min-h-12 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button>
                        <button disabled={processing || data.records.length === 0} type="submit" className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-900">
                            {processing ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Attendance'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}



