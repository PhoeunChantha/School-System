import { destroy } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import AdminShell from '@/pages/admin/shell';
import { Badge, KH, Pagination } from '@/pages/admin/ui';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type OrderKey = 'date-desc' | 'date-asc' | 'class-asc' | 'present-desc' | 'absent-desc';

interface AttendanceClass {
    id: number;
    name: string;
    students: { id: number; nameKh: string; nameEn: string; province: string }[];
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
    const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionItem | null>(null);

    useEffect(() => { setPage(1); }, [selectedClass, orderBy, perPage]);

    const filtered = useMemo(() => {
        const base = sessions.filter(session => selectedClass === 'all' || session.schoolClassId === selectedClass);

        return sortSessions(base, orderBy);
    }, [orderBy, selectedClass, sessions]);

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

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block' }}>Attendance</KH>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Track daily class attendance</div>
                    </div>
                    <button onClick={() => router.visit('/admin/attendance/mark')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
                                            <button onClick={() => router.visit(`/admin/attendance/mark?edit=${session.id}`)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Edit</button>
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
