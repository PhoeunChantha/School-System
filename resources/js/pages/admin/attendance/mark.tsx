import { store, update } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, KH } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FormEvent, useMemo } from 'react';
import { ClipboardCheck, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceStudent {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    province: string;
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
}

const PERIODS = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'full_day', label: 'Full Day' },
];

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; bg: string; border: string }[] = [
    { value: 'present', label: 'Present', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { value: 'absent', label: 'Absent', color: '#dc2626', bg: '#fff1f2', border: '#fecaca' },
    { value: 'late', label: 'Late', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { value: 'excused', label: 'Excused', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
];

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

const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 6,
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function periodLabel(period: string): string {
    return PERIODS.find(item => item.value === period)?.label ?? period;
}

export default function MarkAttendancePage({ classes, editingSession }: MarkAttendancePageProps) {
    const isEdit = !!editingSession;
    const firstClass = classes[0];

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
            <div className="fade-in attendance-mark-page" style={{ padding: 24 }}>
                <form className="attendance-mark-form" onSubmit={submitAttendance} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 1200, margin: '0 auto' }}>
                    <div className="attendance-mark-hero">
                        <div className="attendance-mark-title-row">
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', color: isEdit ? '#2563eb' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isEdit ? <Edit3 size={20} /> : <ClipboardCheck size={20} />}
                            </div>
                            <div>
                                <span>{isEdit ? 'Edit daily attendance' : 'Daily attendance'}</span>
                                <strong>{isEdit ? 'Edit Attendance' : 'Mark Attendance'}</strong>
                                <p>{selectedClassName} - {periodLabel(data.period)}</p>
                            </div>
                        </div>
                        <div className="attendance-mark-count">
                            <span>{data.records.length}</span>
                            <p>students</p>
                        </div>
                    </div>

                    <div className="attendance-mark-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
                        <div className="attendance-mark-field">
                            <label style={labelStyle}>Class *</label>
                            <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => changeClass(Number(val))} disabled={isEdit}>
                                <SelectTrigger className="f-input" style={{ opacity: isEdit ? 0.7 : 1 }}>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(schoolClass => (
                                        <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>{schoolClass.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.school_class_id && <div className="field-error">{errors.school_class_id}</div>}
                        </div>
                        <div className="attendance-mark-field">
                            <label style={labelStyle}>Date *</label>
                            <DatePicker value={data.attendance_date} onChange={value => setData('attendance_date', value)} className="f-input" />
                            {errors.attendance_date && <div className="field-error">{errors.attendance_date}</div>}
                        </div>
                        <div className="attendance-mark-field">
                            <label style={labelStyle}>Period *</label>
                            <Select value={data.period} onValueChange={val => setData('period', val)}>
                                <SelectTrigger className="f-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIODS.map(period => (
                                        <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.period && <div className="field-error">{errors.period}</div>}
                        </div>
                    </div>

                    <div className="attendance-mark-all" style={{ padding: '16px', background: '#f8fafc', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                            <span>Mark all</span>
                            <strong>{modalCounts.present} present / {modalCounts.absent} absent / {modalCounts.late} late / {modalCounts.excused} excused</strong>
                        </div>
                        <div className="attendance-mark-all-buttons">
                            {STATUS_OPTIONS.map(status => (
                                <button className={`attendance-status-pill ${status.value}`} key={status.value} type="button" onClick={() => markAll(status.value)} style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="attendance-mark-list" style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
                        {selectedClassStudents.length === 0 ? (
                            <div className="attendance-mark-empty" style={{ padding: 28, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Data not found</div>
                        ) : selectedClassStudents.map(student => {
                            const record = data.records.find(item => item.student_id === student.id);
                            return (
                                <div className="attendance-mark-row" key={student.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(210px,1fr) minmax(280px,1.4fr) minmax(160px,.8fr)', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #f1f5f9' }}>
                                    <div className="attendance-mark-person" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <Avatar name={student.nameEn} size={34} />
                                        <div style={{ minWidth: 0 }}>
                                            <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{student.nameKh}</KH>
                                            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.nameEn}</div>
                                        </div>
                                    </div>
                                    <div className="attendance-mark-statuses" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
                                        {STATUS_OPTIONS.map(status => {
                                            const active = record?.status === status.value;
                                            return (
                                                <button className={`attendance-status-button ${status.value}${active ? ' active' : ''}`} key={status.value} type="button" onClick={() => setRecordStatus(student.id, status.value)} style={{ minHeight: 34, background: active ? status.bg : 'white', color: active ? status.color : '#64748b', border: `1.5px solid ${active ? status.border : '#e2e8f0'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                    {status.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input className="attendance-mark-note" placeholder="Note" style={{ ...fieldStyle, minHeight: 36, padding: '8px 10px', fontSize: 12 }} value={record?.note ?? ''} onChange={event => setRecordNote(student.id, event.target.value)} />
                                </div>
                            );
                        })}
                    </div>

                    <div className="attendance-mark-actions" style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => router.visit('/admin/attendance')} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        <button disabled={processing || data.records.length === 0} type="submit" style={{ flex: 2, background: processing || data.records.length === 0 ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing || data.records.length === 0 ? 'default' : 'pointer' }}>
                            {processing ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Attendance'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}



