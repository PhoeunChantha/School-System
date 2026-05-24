import { create, destroy, downloadLayout, edit, exportMethod, importMethod } from '@/actions/App/Http/Controllers/Backends/AttendanceSessionController';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { router } from '@inertiajs/react';
import { Download, Edit3, FileDown, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type OrderKey = 'date-desc' | 'date-asc' | 'class-asc' | 'present-desc' | 'absent-desc';

interface AttendanceClass {
    id: number;
    routeKey?: string;
    name: string;
    students: { id: number; nameKh: string; nameEn: string; province: string }[];
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
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('attendance.create') || can('attendance.mark');
    const canUpdate = can('attendance.update');
    const canDelete = can('attendance.delete');
    const canImport = can('attendance.import');
    const canExport = can('attendance.export');
    const canDownloadLayout = can('attendance.download-layout');
    const canManageAttendance = canAny(['attendance.update', 'attendance.delete']);
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionItem | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const importFile = (file: File | null) => {
        if (!file) return;
        if (!canImport) return;

        router.post(importMethod.url(), { import_file: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Attendance imported successfully.'),
            onError: () => toast.error('Unable to import attendance. Please check the CSV layout.'),
            onFinish: () => {
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            },
        });
    };

    useEffect(() => { setPage(1); }, [selectedClass, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = sessions.filter(session => {
            const matchesClass = selectedClass === 'all' || session.schoolClassId === selectedClass;
            const matchesSearch = !query
                || session.className.toLowerCase().includes(query)
                || session.attendanceDate.includes(search)
                || periodLabel(session.period).toLowerCase().includes(query)
                || session.markedAt.toLowerCase().includes(query);

            return matchesClass && matchesSearch;
        });

        return sortSessions(base, orderBy);
    }, [orderBy, search, selectedClass, sessions]);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
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
            <div className="attendance-page fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <section className="attendance-mobile-hero">
                    <div>
                        <span>Attendance</span>
                        <strong>{summary.sessionCount} sessions</strong>
                        <p>{summary.presentCount} present · {summary.absentCount} absent</p>
                    </div>
                    {canCreate && (
                        <button type="button" onClick={() => router.visit(create.url())}>
                            <Plus size={17} />
                        </button>
                    )}
                </section>

                <div className="attendance-desktop-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block' }}>Attendance</KH>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Track daily class attendance</div>
                    </div>
                    <div className="attendance-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {canDownloadLayout && (
                            <a href={downloadLayout.url()} className="admin-btn admin-btn-ghost">
                                <Download size={14} /> Layout
                            </a>
                        )}
                        {canImport && (
                            <button type="button" onClick={() => importInputRef.current?.click()} className="admin-btn admin-btn-ghost">
                                <Upload size={14} /> Import
                            </button>
                        )}
                        {canExport && (
                            <a href={exportMethod.url()} className="admin-btn admin-btn-ghost">
                                <FileDown size={14} /> Export
                            </a>
                        )}
                        {canCreate && (
                            <button onClick={() => router.visit(create.url())} className="admin-btn admin-btn-primary">
                                + Mark Attendance
                            </button>
                        )}
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            style={{ display: 'none' }}
                            onChange={event => importFile(event.target.files?.[0] ?? null)}
                        />
                    </div>
                </div>

                <div className="attendance-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Sessions', value: summary.sessionCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Present', value: summary.presentCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Absent', value: summary.absentCount, color: '#ef4444', bg: '#fff1f2' },
                        { label: 'Late', value: summary.lateCount, color: '#f59e0b', bg: '#fffbeb' },
                    ].map(card => (
                        <div key={card.label} className="attendance-summary-card" style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.7, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card attendance-list-card" style={{ overflowX: 'auto' }}>
                    <div className="attendance-controls" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <AdminSelect
                            value={orderBy}
                            onChange={value => setOrderBy(value as OrderKey)}
                            options={ORDER_OPTIONS}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />
                        <AdminSelect
                            value={perPage.toString()}
                            onChange={value => setPerPage(Number(value))}
                            options={[5, 10, 25, 50].map(size => ({ value: size.toString(), label: `${size} per page` }))}
                            style={{ minWidth: 130 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <AdminSelect
                            value={String(selectedClass)}
                            onChange={value => setSelectedClass(value === 'all' ? 'all' : Number(value))}
                            options={[{ value: 'all', label: 'All classes' }, ...classes.map(schoolClass => ({ value: String(schoolClass.id), label: schoolClass.name }))]}
                            style={{ minWidth: 150 }}
                            triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                        />
                        <span className="attendance-result-count" style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" data-role="attendance-search" style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }} placeholder="Search attendance..." />
                    </div>

                    <table className="data-table attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Class</th>
                                <th>Period</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Late</th>
                                <th>Excused</th>
                                {canManageAttendance && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageAttendance ? 8 : 7} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        {search ? <>No attendance found for <strong>"{search}"</strong></> : 'Data not found'}
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
                                    {canManageAttendance && (
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${session.className} ${session.attendanceDate}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((session.routeKey ?? session.id) as never)), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(session), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="attendance-mobile-list">
                        {paginated.length === 0 ? (
                            <div className="attendance-mobile-empty">
                                {search ? <>No attendance found for <strong>"{search}"</strong></> : 'Data not found'}
                            </div>
                        ) : paginated.map((session) => (
                            <article key={session.id} className="attendance-mobile-card">
                                <div className="attendance-mobile-head">
                                    <div>
                                        <span>{session.attendanceDate}</span>
                                        <strong>{session.className}</strong>
                                        <p>{session.markedAt || 'Not marked'}</p>
                                    </div>
                                    <div className="attendance-mobile-head-actions">
                                        <Badge type="blue">{periodLabel(session.period)}</Badge>
                                        {canManageAttendance && (
                                            <RowActions
                                                ariaLabel={`Actions for ${session.className} ${session.attendanceDate}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => router.visit(edit.url((session.routeKey ?? session.id) as never)), hidden: !canUpdate },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(session), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                ]}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="attendance-mobile-meta">
                                    <div className="present"><span>Present</span><strong>{session.presentCount}</strong></div>
                                    <div className="absent"><span>Absent</span><strong>{session.absentCount}</strong></div>
                                    <div className="late"><span>Late</span><strong>{session.lateCount}</strong></div>
                                    <div className="excused"><span>Excused</span><strong>{session.excusedCount}</strong></div>
                                </div>
                            </article>
                        ))}
                    </div>
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
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

