import { store as saveTeacherGrade } from '@/actions/App/Http/Controllers/Backends/TeacherGradeController';
import { teachers as teachersIndex } from '@/routes/admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar, ScoreChip } from '@/pages/admin/ui';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface TeacherInfo {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    subject: string;
}

interface PeriodOption {
    id: number;
    routeKey?: string;
    name: string;
    type: string;
    academicYear: string;
    isCurrent: boolean;
}

interface ClassOption {
    id: number;
    routeKey?: string;
    name: string;
    room: string;
    students: number;
}

interface StudentOption {
    id: number;
    routeKey?: string;
    schoolClassId: number;
    className: string;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    homework: {
        average: number;
        earned: number;
        points: number;
        count: number;
    };
}

interface GradeRecordItem {
    id: number;
    routeKey?: string;
    gradePeriodId: number;
    periodName: string;
    studentId: number;
    schoolClassId: number;
    className: string;
    studentNameKh: string;
    studentNameEn: string;
    studentPhoto: string | null;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    gradedAt: string;
}

interface PageProps {
    teacher: TeacherInfo;
    periods: PeriodOption[];
    classes: ClassOption[];
    students: StudentOption[];
    records: GradeRecordItem[];
    summary: {
        currentPeriodId: number | null;
        classCount: number;
        studentCount: number;
        recordCount: number;
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

type OrderKey = 'name-asc' | 'avg-desc' | 'avg-asc' | 'homework-desc' | 'class-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Student A-Z' },
    { value: 'avg-desc', label: 'Average Highest' },
    { value: 'avg-asc', label: 'Average Lowest' },
    { value: 'homework-desc', label: 'Homework Highest' },
    { value: 'class-asc', label: 'Class' },
];

function averageScore(form: GradeFormData): number {
    return Math.round(((form.speaking + form.listening + form.reading + form.writing) / 4) * 100) / 100;
}

function performance(score: number): { label: string; type: 'green' | 'blue' | 'amber' | 'red' } {
    if (score >= 80) return { label: 'Excellent', type: 'green' };
    if (score >= 65) return { label: 'Good', type: 'blue' };
    if (score >= 50) return { label: 'Average', type: 'amber' };
    return { label: 'Needs Work', type: 'red' };
}

export default function TeacherGradesPage({ teacher, periods, classes, students, records, summary }: PageProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(summary.currentPeriodId ?? periods[0]?.id ?? 'all');
    const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('name-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [editingStudent, setEditingStudent] = useState<StudentOption | null>(students[0] ?? null);

    const currentRecord = useMemo(() => {
        if (!editingStudent || selectedPeriod === 'all') return null;

        return records.find(record => record.studentId === editingStudent.id && record.gradePeriodId === selectedPeriod) ?? null;
    }, [editingStudent, records, selectedPeriod]);

    const { data, setData, post, processing, errors } = useForm<GradeFormData>({
        grade_period_id: selectedPeriod === 'all' ? summary.currentPeriodId ?? periods[0]?.id ?? null : selectedPeriod,
        student_id: editingStudent?.id ?? null,
        school_class_id: editingStudent?.schoolClassId ?? null,
        speaking: currentRecord?.speaking ?? 0,
        listening: currentRecord?.listening ?? 0,
        reading: currentRecord?.reading ?? 0,
        writing: currentRecord?.writing ?? 0,
    });

    useEffect(() => { setPage(1); }, [selectedPeriod, selectedClass, search, orderBy, perPage]);

    useEffect(() => {
        if (!editingStudent) return;

        const periodId = selectedPeriod === 'all' ? summary.currentPeriodId ?? periods[0]?.id ?? null : selectedPeriod;
        const record = periodId
            ? records.find(item => item.studentId === editingStudent.id && item.gradePeriodId === periodId)
            : null;

        setData({
            grade_period_id: periodId,
            student_id: editingStudent.id,
            school_class_id: editingStudent.schoolClassId,
            speaking: record?.speaking ?? 0,
            listening: record?.listening ?? 0,
            reading: record?.reading ?? 0,
            writing: record?.writing ?? 0,
        });
    }, [editingStudent, periods, records, selectedPeriod, setData, summary.currentPeriodId]);

    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        const periodId = selectedPeriod === 'all' ? null : selectedPeriod;

        return students
            .filter(student => {
                const classMatches = selectedClass === 'all' || student.schoolClassId === selectedClass;
                const searchMatches = !query
                    || student.nameKh.includes(search)
                    || student.nameEn.toLowerCase().includes(query)
                    || student.className.toLowerCase().includes(query)
                    || student.level.toLowerCase().includes(query);

                return classMatches && searchMatches;
            })
            .map(student => ({
                student,
                record: records.find(record => record.studentId === student.id && (!periodId || record.gradePeriodId === periodId)) ?? null,
            }))
            .sort((a, b) => {
                const averageA = a.record?.average ?? 0;
                const averageB = b.record?.average ?? 0;

                switch (orderBy) {
                    case 'avg-desc': return averageB - averageA;
                    case 'avg-asc': return averageA - averageB;
                    case 'homework-desc': return b.student.homework.average - a.student.homework.average;
                    case 'class-asc': return a.student.className.localeCompare(b.student.className);
                    case 'name-asc':
                    default: return a.student.nameEn.localeCompare(b.student.nameEn);
                }
            });
    }, [orderBy, records, search, selectedClass, selectedPeriod, students]);

    const paginated = useMemo(() => rows.slice((page - 1) * perPage, page * perPage), [page, perPage, rows]);

    const startEdit = (student: StudentOption) => {
        setEditingStudent(student);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(saveTeacherGrade.url((teacher.routeKey ?? teacher.id) as never), {
            preserveScroll: true,
            onSuccess: () => toast.success('Student score saved.'),
        });
    };

    const inputError = (message?: string) => message ? <div className="field-error">{message}</div> : null;
    const selectedAverage = averageScore(data);
    const selectedPerformance = performance(selectedAverage);

    return (
        <AdminShell>
            <div className="fade-in teacher-score-page" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="teacher-score-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Link href={teachersIndex.url()} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #dbe3ef', borderRadius: 10, padding: '9px 12px', fontWeight: 800, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> Teachers
                    </Link>
                    <Avatar name={teacher.nameEn} src={teacher.photo} size={42} />
                    <div>
                        <KH style={{ display: 'block', color: '#1e293b', fontSize: 18, fontWeight: 900 }}>{teacher.nameKh}</KH>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{teacher.nameEn} Â· {teacher.subject || 'Teacher scores'}</div>
                    </div>
                </div>

                <div className="teacher-score-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 16 }}>
                        <div style={{ color: '#2563eb', fontSize: 24, fontWeight: 900 }}>{summary.classCount}</div>
                        <div style={{ color: '#2563eb', opacity: 0.75, fontSize: 11 }}>Classes</div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 16 }}>
                        <div style={{ color: '#16a34a', fontSize: 24, fontWeight: 900 }}>{summary.studentCount}</div>
                        <div style={{ color: '#16a34a', opacity: 0.75, fontSize: 11 }}>Students</div>
                    </div>
                    <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 14, padding: 16 }}>
                        <div style={{ color: '#6366f1', fontSize: 24, fontWeight: 900 }}>{summary.recordCount}</div>
                        <div style={{ color: '#6366f1', opacity: 0.75, fontSize: 11 }}>Current Scores</div>
                    </div>
                </div>

                <form className="card teacher-score-form" onSubmit={submit} style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, alignItems: 'end' }}>
                    <div className="teacher-score-form-header" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div className="teacher-score-title" style={{ fontWeight: 900, color: '#1e293b' }}>Manage Student Score</div>
                        {editingStudent && (
                            <div className="teacher-score-student" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={editingStudent.nameEn} src={editingStudent.photo} size={30} />
                                <div>
                                    <KH style={{ display: 'block', fontWeight: 800, color: '#1e293b', fontSize: 12 }}>{editingStudent.nameKh}</KH>
                                    <div style={{ color: '#94a3b8', fontSize: 11 }}>{editingStudent.nameEn} Â· {editingStudent.className}</div>
                                </div>
                            </div>
                        )}
                        <div className="teacher-score-summary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {editingStudent && (
                                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>
                                    Homework {editingStudent.homework.count > 0 ? `${editingStudent.homework.average}%` : 'Pending'}
                                </span>
                            )}
                            <Badge type={selectedPerformance.type}>{selectedPerformance.label}</Badge>
                            <strong style={{ color: '#1e293b' }}>{selectedAverage}</strong>
                        </div>
                    </div>

                    {(['speaking', 'listening', 'reading', 'writing'] as const).map(skill => (
                        <div className="f-group teacher-score-field" key={skill}>
                            <label className="f-label">{skill.charAt(0).toUpperCase() + skill.slice(1)}</label>
                            <input className="f-input" type="number" min={0} max={100} value={data[skill]} onChange={event => setData(skill, Math.min(100, Math.max(0, Number(event.target.value))))} />
                            {inputError(errors[skill])}
                        </div>
                    ))}

                    <button className="teacher-score-save" type="submit" disabled={processing || !editingStudent} style={{ minHeight: 44, background: processing || !editingStudent ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 900, cursor: processing || !editingStudent ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <Save size={16} /> Save
                    </button>
                    <div style={{ gridColumn: '1 / -1' }}>
                        {inputError(errors.student_id)}
                        {inputError(errors.school_class_id)}
                        {inputError(errors.grade_period_id)}
                    </div>
                </form>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div className="teacher-score-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}><SelectValue /></SelectTrigger>
                            <SelectContent>{ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(perPage)} onValueChange={value => setPerPage(Number(value))}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}><SelectValue /></SelectTrigger>
                            <SelectContent>{[5, 10, 25, 50].map(size => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(selectedPeriod)} onValueChange={value => setSelectedPeriod(value === 'all' ? 'all' : Number(value))}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All periods</SelectItem>
                                {periods.map(period => <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={String(selectedClass)} onValueChange={value => setSelectedClass(value === 'all' ? 'all' : Number(value))}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All classes</SelectItem>
                                {classes.map(schoolClass => <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>{schoolClass.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{rows.length} result{rows.length !== 1 ? 's' : ''}</span>
                        <div className="teacher-score-search" style={{ marginLeft: 'auto', position: 'relative', width: 280, maxWidth: '100%' }}>
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" style={{ width: '100%', paddingLeft: 36 }} placeholder="Search students..." />
                        </div>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Homework</th>
                                <th>Speaking</th>
                                <th>Listening</th>
                                <th>Reading</th>
                                <th>Writing</th>
                                <th>Average</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ padding: '34px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                                        {search ? <>No students found for <strong>"{search}"</strong></> : 'No students found'}
                                    </td>
                                </tr>
                            ) : paginated.map(({ student, record }) => {
                                const score = record?.average ?? 0;
                                const perf = record ? performance(score) : null;

                                return (
                                    <tr key={student.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={student.nameEn} src={student.photo} size={34} />
                                                <div>
                                                    <KH style={{ display: 'block', color: '#1e293b', fontWeight: 800, fontSize: 13 }}>{student.nameKh}</KH>
                                                    <div style={{ color: '#94a3b8', fontSize: 11 }}>{student.nameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{student.className}</td>
                                        <td>
                                            {student.homework.count > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                                                    <PBar value={student.homework.average} color={student.homework.average >= 75 ? 'green' : student.homework.average >= 50 ? 'blue' : 'red'} />
                                                    <div style={{ minWidth: 56 }}>
                                                        <strong style={{ color: student.homework.average >= 75 ? '#10b981' : student.homework.average >= 50 ? '#2563eb' : '#ef4444', fontSize: 12 }}>{student.homework.average}%</strong>
                                                        <div style={{ color: '#94a3b8', fontSize: 10 }}>{student.homework.earned}/{student.homework.points}</div>
                                                    </div>
                                                </div>
                                            ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>No score</span>}
                                        </td>
                                        <td>{record ? <ScoreChip score={record.speaking} /> : '-'}</td>
                                        <td>{record ? <ScoreChip score={record.listening} /> : '-'}</td>
                                        <td>{record ? <ScoreChip score={record.reading} /> : '-'}</td>
                                        <td>{record ? <ScoreChip score={record.writing} /> : '-'}</td>
                                        <td>
                                            {record ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
                                                    <PBar value={score} color={score >= 75 ? 'green' : score >= 50 ? 'blue' : 'red'} />
                                                    <strong style={{ color: score >= 75 ? '#10b981' : score >= 50 ? '#2563eb' : '#ef4444', fontSize: 12 }}>{score}</strong>
                                                </div>
                                            ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>Not scored</span>}
                                        </td>
                                        <td>{perf ? <Badge type={perf.type}>{perf.label}</Badge> : <Badge type="gray">Pending</Badge>}</td>
                                        <td>
                                            <button type="button" onClick={() => startEdit(student)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                <Save size={13} /> Score
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {rows.length > 0 && <Pagination total={rows.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />}
                </div>
            </div>
        </AdminShell>
    );
}



