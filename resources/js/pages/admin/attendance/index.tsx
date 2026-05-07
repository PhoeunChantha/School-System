import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type ModalMode = 'create' | 'edit';
type OrderKey = 'date-desc' | 'date-asc' | 'class-asc' | 'present-desc' | 'absent-desc';

interface AttendanceStudent {
    id: number;
    nameKh: string;
    nameEn: string;
    province: string;
}

interface AttendanceClass {
    id: number;
    name: string;
    students: AttendanceStudent[];
}

interface AttendanceRecordItem {
    id: number;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    province: string;
    status: AttendanceStatus;
    note: string;
}

interface AttendanceSessionItem {
    id: number;
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
    status: AttendanceStatus;
    note: string;
}

interface AttendanceFormData {
    school_class_id: number | null;
    attendance_date: string;
    period: string;
    records: AttendanceFormRecord[];
}

interface AttendancePageProps {
    sessions: AttendanceSessionItem[];
    classes: AttendanceClass[];
    summary: {
        sessionCount: number;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        excusedCount: number;
    };
}

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'class-asc', label: 'Class A -> Z' },
    { value: 'present-desc', label: 'Present Most' },
    { value: 'absent-desc', label: 'Absent Most' },
];

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

function sortSessions(list: AttendanceSessionItem[], order: OrderKey): AttendanceSessionItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc': return b.attendanceDate.localeCompare(a.attendanceDate);
            case 'date-asc': return a.attendanceDate.localeCompare(b.attendanceDate);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'present-desc': return b.presentCount - a.presentCount;
            case 'absent-desc': return b.absentCount - a.absentCount;
            default: return 0;
        }
    });
}

export default function AttendancePage({ sessions, classes, summary }: AttendancePageProps) {
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [modalMode, setModalMode] = useState<ModalMode | null>(null);
    const [editingSession, setEditingSession] = useState<AttendanceSessionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionItem | null>(null);

    const firstClass = classes[0];

    const { data, setData, post, put, processing, errors, reset } = useForm<AttendanceFormData>({
        school_class_id: firstClass?.id ?? null,
        attendance_date: today(),
        period: 'morning',
        records: firstClass?.students.map(student => ({
            student_id: student.id,
            status: 'present',
            note: '',
        })) ?? [],
    });

    useEffect(() => { setPage(1); }, [selectedClass, orderBy, perPage]);

    const filtered = useMemo(() => {
        const base = sessions.filter(session => selectedClass === 'all' || session.schoolClassId === selectedClass);

        return sortSessions(base, orderBy);
    }, [orderBy, selectedClass, sessions]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const selectedClassStudents = useMemo(
        () => classes.find(schoolClass => schoolClass.id === data.school_class_id)?.students ?? [],
        [classes, data.school_class_id],
    );

    const openCreateModal = () => {
        const schoolClass = selectedClass === 'all'
            ? firstClass
            : classes.find(item => item.id === selectedClass) ?? firstClass;

        reset();
        setData({
            school_class_id: schoolClass?.id ?? null,
            attendance_date: today(),
            period: 'morning',
            records: schoolClass?.students.map(student => ({
                student_id: student.id,
                status: 'present',
                note: '',
            })) ?? [],
        });
        setEditingSession(null);
        setModalMode('create');
    };

    const openEditModal = (session: AttendanceSessionItem) => {
        setData({
            school_class_id: session.schoolClassId,
            attendance_date: session.attendanceDate,
            period: session.period,
            records: session.records.map(record => ({
                student_id: record.studentId,
                status: record.status,
                note: record.note,
            })),
        });
        setEditingSession(session);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingSession(null);
    };

    const changeClass = (classId: number) => {
        const schoolClass = classes.find(item => item.id === classId);

        setData(current => ({
            ...current,
            school_class_id: classId,
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

    const submitAttendance = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(modalMode === 'edit' ? 'Attendance updated.' : 'Attendance created.');
                closeModal();
            },
        };

        if (modalMode === 'edit' && editingSession) {
            put(update.url(editingSession.id), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Attendance deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const modalCounts = data.records.reduce<Record<AttendanceStatus, number>>((counts, record) => ({
        ...counts,
        [record.status]: counts[record.status] + 1,
    }), { present: 0, absent: 0, late: 0, excused: 0 });

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block' }}>Attendance</KH>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Track daily class attendance</div>
                    </div>
                    <button onClick={openCreateModal} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        + Mark Attendance
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Sessions', value: summary.sessionCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Present', value: summary.presentCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Absent', value: summary.absentCount, color: '#ef4444', bg: '#fff1f2' },
                        { label: 'Late', value: summary.lateCount, color: '#f59e0b', bg: '#fffbeb' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.7, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <select value={orderBy} onChange={event => setOrderBy(event.target.value as OrderKey)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {ORDER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />
                        <select value={perPage} onChange={event => setPerPage(Number(event.target.value))} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size} per page</option>)}
                        </select>
                        <select value={selectedClass} onChange={event => setSelectedClass(event.target.value === 'all' ? 'all' : Number(event.target.value))} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All classes</option>
                            {classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Class</th>
                                <th>Period</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Late</th>
                                <th>Excused</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        Data not found
                                    </td>
                                </tr>
                            ) : paginated.map(session => (
                                <tr key={session.id}>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{session.attendanceDate}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{session.markedAt || 'Not marked'}</div>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{session.className}</td>
                                    <td><Badge type="blue">{periodLabel(session.period)}</Badge></td>
                                    <td style={{ color: '#16a34a', fontWeight: 900 }}>{session.presentCount}</td>
                                    <td style={{ color: '#dc2626', fontWeight: 900 }}>{session.absentCount}</td>
                                    <td style={{ color: '#d97706', fontWeight: 900 }}>{session.lateCount}</td>
                                    <td style={{ color: '#2563eb', fontWeight: 900 }}>{session.excusedCount}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(session)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Edit</button>
                                            <button onClick={() => setDeleteTarget(session)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            <Dialog
                open={modalMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl">
                    {modalMode && (
                        <form onSubmit={submitAttendance} className="bg-white">
                            <DialogHeader className="border-b border-slate-200 px-6 py-5">
                                <DialogTitle className="text-lg font-black text-slate-800">
                                    {modalMode === 'create' ? 'Mark Attendance' : 'Edit Attendance'}
                                </DialogTitle>
                                <DialogDescription>
                                    {modalMode === 'create' ? 'Create a class attendance session' : `${editingSession?.className} on ${editingSession?.attendanceDate}`}
                                </DialogDescription>
                            </DialogHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Class *</label>
                                    <select disabled={modalMode === 'edit'} style={{ ...fieldStyle, opacity: modalMode === 'edit' ? 0.7 : 1 }} value={data.school_class_id ?? ''} onChange={event => changeClass(Number(event.target.value))}>
                                        {classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                                    </select>
                                    {errors.school_class_id && <div className="field-error">{errors.school_class_id}</div>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Date *</label>
                                    <input type="date" style={fieldStyle} value={data.attendance_date} onChange={event => setData('attendance_date', event.target.value)} />
                                    {errors.attendance_date && <div className="field-error">{errors.attendance_date}</div>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Period *</label>
                                    <select style={fieldStyle} value={data.period} onChange={event => setData('period', event.target.value)}>
                                        {PERIODS.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}
                                    </select>
                                    {errors.period && <div className="field-error">{errors.period}</div>}
                                </div>
                            </div>

                            <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>Mark all</span>
                                {STATUS_OPTIONS.map(status => (
                                    <button key={status.value} type="button" onClick={() => markAll(status.value)} style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                        {status.label}
                                    </button>
                                ))}
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                                    {modalCounts.present} present / {modalCounts.absent} absent / {modalCounts.late} late
                                </span>
                            </div>

                            <div style={{ padding: '0 24px 24px' }}>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                                    {selectedClassStudents.length === 0 ? (
                                        <div style={{ padding: 28, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Data not found</div>
                                    ) : selectedClassStudents.map(student => {
                                        const record = data.records.find(item => item.student_id === student.id);
                                        return (
                                            <div key={student.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(210px,1fr) minmax(280px,1.4fr) minmax(160px,.8fr)', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                    <Avatar name={student.nameEn} size={34} />
                                                    <div style={{ minWidth: 0 }}>
                                                        <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{student.nameKh}</KH>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.nameEn}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
                                                    {STATUS_OPTIONS.map(status => {
                                                        const active = record?.status === status.value;
                                                        return (
                                                            <button key={status.value} type="button" onClick={() => setRecordStatus(student.id, status.value)} style={{ minHeight: 34, background: active ? status.bg : 'white', color: active ? status.color : '#64748b', border: `1.5px solid ${active ? status.border : '#e2e8f0'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                                {status.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <input placeholder="Note" style={{ ...fieldStyle, minHeight: 36, padding: '8px 10px', fontSize: 12 }} value={record?.note ?? ''} onChange={event => setRecordNote(student.id, event.target.value)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeModal} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button disabled={processing || data.records.length === 0} type="submit" style={{ flex: 2, background: processing || data.records.length === 0 ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing || data.records.length === 0 ? 'default' : 'pointer' }}>
                                    {modalMode === 'create' ? 'Save Attendance' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Attendance?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove attendance for <strong>{deleteTarget.className}</strong> on <strong>{deleteTarget.attendanceDate}</strong>?</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
