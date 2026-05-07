import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/GradeRecordController';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar, ScoreChip } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface GradePeriodOption {
    id: number;
    name: string;
    type: string;
    academicYear: string;
    isCurrent: boolean;
}

interface GradeStudentOption {
    id: number;
    nameKh: string;
    nameEn: string;
    level: string;
    schoolClassId: number | null;
    className: string;
}

interface GradeClassOption {
    id: number;
    name: string;
}

interface GradeRecordItem {
    id: number;
    gradePeriodId: number;
    periodName: string;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    level: string;
    classId: number | null;
    className: string;
    province: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    gradedAt: string;
}

interface GradesPageProps {
    records: GradeRecordItem[];
    periods: GradePeriodOption[];
    students: GradeStudentOption[];
    classes: GradeClassOption[];
    summary: {
        currentPeriodId: number | null;
        recordCount: number;
        average: number;
        passingCount: number;
        needsWorkCount: number;
    };
}

interface GradeFormData {
    grade_period_id: number | null;
    student_id: number | null;
    school_class_id: number | null;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

type DrawerMode = 'create' | 'edit';
type OrderKey = 'avg-desc' | 'avg-asc' | 'name-asc' | 'class-asc' | 'speaking-desc' | 'listening-desc' | 'reading-desc' | 'writing-desc';
type PerfFilter = 'all' | 'excellent' | 'good' | 'average' | 'poor';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'avg-desc', label: 'Average Highest' },
    { value: 'avg-asc', label: 'Average Lowest' },
    { value: 'name-asc', label: 'Name A -> Z' },
    { value: 'class-asc', label: 'Class' },
    { value: 'speaking-desc', label: 'Speaking High' },
    { value: 'listening-desc', label: 'Listening High' },
    { value: 'reading-desc', label: 'Reading High' },
    { value: 'writing-desc', label: 'Writing High' },
];

function performanceLabel(score: number): { label: string; type: 'green' | 'blue' | 'amber' | 'red' } {
    if (score >= 80) return { label: 'Excellent', type: 'green' };
    if (score >= 65) return { label: 'Good', type: 'blue' };
    if (score >= 50) return { label: 'Average', type: 'amber' };
    return { label: 'Needs Work', type: 'red' };
}

function sortRecords(list: GradeRecordItem[], order: OrderKey): GradeRecordItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'avg-desc': return b.average - a.average;
            case 'avg-asc': return a.average - b.average;
            case 'name-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'speaking-desc': return b.speaking - a.speaking;
            case 'listening-desc': return b.listening - a.listening;
            case 'reading-desc': return b.reading - a.reading;
            case 'writing-desc': return b.writing - a.writing;
            default: return 0;
        }
    });
}

const drawerFieldStyle = {
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

const drawerLabelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 6,
};

export default function GradesPage({ records, periods, students, classes, summary }: GradesPageProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(summary.currentPeriodId ?? 'all');
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [performanceFilter, setPerformanceFilter] = useState<PerfFilter>('all');
    const [orderBy, setOrderBy] = useState<OrderKey>('avg-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingRecord, setEditingRecord] = useState<GradeRecordItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GradeRecordItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<GradeFormData>({
        grade_period_id: summary.currentPeriodId ?? periods[0]?.id ?? null,
        student_id: students[0]?.id ?? null,
        school_class_id: students[0]?.schoolClassId ?? null,
        speaking: 0,
        listening: 0,
        reading: 0,
        writing: 0,
    });

    useEffect(() => { setPage(1); }, [selectedPeriod, selectedClass, performanceFilter, orderBy, perPage]);

    const filtered = useMemo(() => {
        const base = records.filter(record => {
            const periodMatches = selectedPeriod === 'all' || record.gradePeriodId === selectedPeriod;
            const classMatches = selectedClass === 'all' || record.classId === selectedClass;
            const perf = performanceLabel(record.average).label.toLowerCase().replace(' ', '-');
            const perfMatches = performanceFilter === 'all'
                || (performanceFilter === 'excellent' && perf === 'excellent')
                || (performanceFilter === 'good' && perf === 'good')
                || (performanceFilter === 'average' && perf === 'average')
                || (performanceFilter === 'poor' && perf === 'needs-work');

            return periodMatches && classMatches && perfMatches;
        });

        return sortRecords(base, orderBy);
    }, [orderBy, performanceFilter, records, selectedClass, selectedPeriod]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const visibleAverage = filtered.length
        ? Math.round((filtered.reduce((total, record) => total + record.average, 0) / filtered.length) * 100) / 100
        : 0;

    const openCreateDrawer = () => {
        const student = students[0];
        reset();
        setData({
            grade_period_id: selectedPeriod === 'all' ? summary.currentPeriodId ?? periods[0]?.id ?? null : selectedPeriod,
            student_id: student?.id ?? null,
            school_class_id: student?.schoolClassId ?? null,
            speaking: 0,
            listening: 0,
            reading: 0,
            writing: 0,
        });
        setEditingRecord(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (record: GradeRecordItem) => {
        setData({
            grade_period_id: record.gradePeriodId,
            student_id: record.studentId,
            school_class_id: record.classId,
            speaking: record.speaking,
            listening: record.listening,
            reading: record.reading,
            writing: record.writing,
        });
        setEditingRecord(record);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingRecord(null);
    };

    const selectStudent = (studentId: number) => {
        const student = students.find(item => item.id === studentId);
        setData(current => ({
            ...current,
            student_id: studentId,
            school_class_id: student?.schoolClassId ?? current.school_class_id,
        }));
    };

    const submitGrade = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Grade updated.' : 'Grade created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingRecord) {
            put(update.url(editingRecord.id), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Grade deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <KH style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'block' }}>Grade Book</KH>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Manage speaking, listening, reading, and writing scores</div>
                    </div>
                    <button onClick={openCreateDrawer} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        + Add Grade
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Records', value: filtered.length, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Average', value: visibleAverage, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Passing', value: filtered.filter(record => record.average >= 50).length, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Needs Work', value: filtered.filter(record => record.average < 50).length, color: '#ef4444', bg: '#fff1f2' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.7, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <select value={perPage} onChange={event => setPerPage(Number(event.target.value))} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size} per page</option>)}
                        </select>
                        <select value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value === 'all' ? 'all' : Number(event.target.value))} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All periods</option>
                            {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                        </select>
                        <select value={selectedClass} onChange={event => setSelectedClass(event.target.value === 'all' ? 'all' : Number(event.target.value))} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All classes</option>
                            {classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                        </select>
                        <select value={performanceFilter} onChange={event => setPerformanceFilter(event.target.value as PerfFilter)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All performance</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="average">Average</option>
                            <option value="poor">Needs Work</option>
                        </select>
                        <select value={orderBy} onChange={event => setOrderBy(event.target.value as OrderKey)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {ORDER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Speaking</th>
                                <th>Listening</th>
                                <th>Reading</th>
                                <th>Writing</th>
                                <th>Average</th>
                                <th>Performance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        Data not found
                                    </td>
                                </tr>
                            ) : paginated.map(record => {
                                const perf = performanceLabel(record.average);
                                return (
                                    <tr key={record.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={record.studentNameEn} size={32} />
                                                <div>
                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{record.studentNameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{record.className || record.level}</td>
                                        <td><ScoreChip score={record.speaking} /></td>
                                        <td><ScoreChip score={record.listening} /></td>
                                        <td><ScoreChip score={record.reading} /></td>
                                        <td><ScoreChip score={record.writing} /></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
                                                <PBar value={record.average} color={record.average >= 75 ? 'green' : record.average >= 50 ? 'blue' : 'red'} />
                                                <span style={{ fontSize: 12, fontWeight: 800, color: record.average >= 75 ? '#10b981' : record.average >= 50 ? '#3b82f6' : '#ef4444', width: 42 }}>{record.average}</span>
                                            </div>
                                        </td>
                                        <td><Badge type={perf.type}>{perf.label}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openEditDrawer(record)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Edit</button>
                                                <button onClick={() => setDeleteTarget(record)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length > 0 && <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>

            <Sheet
                open={drawerMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDrawer();
                    }
                }}
            >
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitGrade} className="flex min-h-full flex-col bg-white">
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create' ? 'Add Grade' : 'Edit Grade'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Create a student score record' : editingRecord?.studentNameEn}
                                </SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={drawerLabelStyle}>Period *</label>
                                <select style={drawerFieldStyle} value={data.grade_period_id ?? ''} onChange={event => setData('grade_period_id', Number(event.target.value) || null)}>
                                    {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                                </select>
                                {errors.grade_period_id && <div className="field-error">{errors.grade_period_id}</div>}
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={drawerLabelStyle}>Student *</label>
                                <select disabled={drawerMode === 'edit'} style={{ ...drawerFieldStyle, opacity: drawerMode === 'edit' ? 0.7 : 1 }} value={data.student_id ?? ''} onChange={event => selectStudent(Number(event.target.value))}>
                                    {students.map(student => <option key={student.id} value={student.id}>{student.nameEn} · {student.className || student.level}</option>)}
                                </select>
                                {errors.student_id && <div className="field-error">{errors.student_id}</div>}
                            </div>
                            {(['speaking', 'listening', 'reading', 'writing'] as const).map(skill => (
                                <div key={skill}>
                                    <label style={drawerLabelStyle}>{skill.charAt(0).toUpperCase() + skill.slice(1)} *</label>
                                    <input type="number" min={0} max={100} style={drawerFieldStyle} value={data[skill]} onChange={event => setData(skill, Math.min(100, Math.max(0, Number(event.target.value))))} />
                                    {errors[skill] && <div className="field-error">{errors[skill]}</div>}
                                </div>
                            ))}
                            </div>

                        <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                            <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer' }}>
                                {drawerMode === 'create' ? 'Save Grade' : 'Save Changes'}
                            </button>
                        </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Grade?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove grade record for <strong>{deleteTarget.studentNameEn}</strong>?</div>
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
