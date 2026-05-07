import { useEffect, useMemo, useState } from 'react';
import { create as createStudent, destroy, edit as editStudent } from '@/actions/App/Http/Controllers/Backends/StudentController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, FeeTag, KH, Pagination, PBar, ScoreChip } from '@/pages/admin/ui';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';

export interface Grade {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

export interface Student {
    id: number;
    nameKh: string;
    nameEn: string;
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

type OrderKey = 'name-asc' | 'name-desc' | 'attend-desc' | 'attend-asc' | 'score-desc' | 'score-asc' | 'level-asc' | 'fee-asc' | 'province-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A -> Z' },
    { value: 'name-desc', label: 'Name Z -> A' },
    { value: 'attend-desc', label: 'Attendance Highest' },
    { value: 'attend-asc', label: 'Attendance Lowest' },
    { value: 'score-desc', label: 'Score Highest' },
    { value: 'score-asc', label: 'Score Lowest' },
    { value: 'level-asc', label: 'Level' },
    { value: 'fee-asc', label: 'Fee Status' },
    { value: 'province-asc', label: 'Province' },
];

const avg = (student: Student): number =>
    Math.round(Object.values(student.grade).reduce((total, score) => total + score, 0) / 4);

function sortStudents(list: Student[], order: OrderKey): Student[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc': return a.nameEn.localeCompare(b.nameEn);
            case 'name-desc': return b.nameEn.localeCompare(a.nameEn);
            case 'attend-desc': return b.attendance - a.attendance;
            case 'attend-asc': return a.attendance - b.attendance;
            case 'score-desc': return avg(b) - avg(a);
            case 'score-asc': return avg(a) - avg(b);
            case 'level-asc': return a.level.localeCompare(b.level);
            case 'fee-asc': return a.fees.localeCompare(b.fees);
            case 'province-asc': return a.province.localeCompare(b.province);
            default: return 0;
        }
    });
}

export default function StudentsPage({ students }: StudentsPageProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [orderBy, setOrderBy] = useState<OrderKey>('name-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);

    useEffect(() => { setPage(1); }, [search, filter, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = students.filter(student => {
            const matchesSearch = !query
                || student.nameKh.includes(search)
                || student.nameEn.toLowerCase().includes(query)
                || student.province.toLowerCase().includes(query);
            const matchesFilter = filter === 'all'
                || (filter === 'atrisk' && (student.attendance < 70 || student.fees === 'Unpaid'))
                || student.level.toLowerCase().includes(filter.toLowerCase());

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

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Student deleted successfully!', {
                    description: `${deleteTarget.nameEn} has been removed.`,
                });
                if (selected?.id === deleteTarget.id) setSelected(null);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" style={{ maxWidth: 260 }} placeholder="Search students..." />

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[{ id: 'all', l: 'All' }, { id: 'Beginner', l: 'Beginner' }, { id: 'Intermediate', l: 'Intermediate' }, { id: 'Advanced', l: 'Advanced' }, { id: 'atrisk', l: 'At-Risk' }].map(item => (
                            <button key={item.id} onClick={() => setFilter(item.id)}
                                style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderColor: filter === item.id ? '#3b82f6' : '#e2e8f0', background: filter === item.id ? '#eff6ff' : 'white', color: filter === item.id ? '#2563eb' : '#64748b' }}>
                                {item.l}
                            </button>
                        ))}
                    </div>

                    <Link href={createStudent.url()} style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>
                        + Add Student
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { l: 'Total', v: students.length, c: '#3b82f6' },
                        { l: 'Paid', v: students.filter(student => student.fees === 'Paid').length, c: '#10b981' },
                        { l: 'Unpaid', v: students.filter(student => student.fees === 'Unpaid').length, c: '#ef4444' },
                        { l: 'At-Risk', v: students.filter(student => student.attendance < 70 || student.fees === 'Unpaid').length, c: '#f59e0b' },
                    ].map(stat => (
                        <div key={stat.l} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.c }} />
                            <span style={{ fontSize: 11, color: '#64748b' }}>{stat.l}</span>
                            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{stat.v}</span>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <select value={orderBy} onChange={event => setOrderBy(event.target.value as OrderKey)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {ORDER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />
                        <select value={perPage} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size} per page</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <table className="data-table">
                        <thead><tr>
                            <th>Student</th><th>Level</th><th>Class</th><th>Attendance</th>
                            <th>Speaking</th><th>Listening</th><th>Reading</th><th>Writing</th>
                            <th>Fee</th><th>Province</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        Data not found
                                    </td>
                                </tr>
                            ) : paginated.map(student => (
                                <tr key={student.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(student.id === selected?.id ? null : student)}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={student.nameEn} size={34} /><div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{student.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{student.nameEn}</div></div></div></td>
                                    <td><Badge type="blue">{student.level}</Badge></td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{student.cls}</td>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}><PBar value={student.attendance} color={student.attendance >= 80 ? 'green' : 'red'} /><span style={{ fontSize: 12, fontWeight: 700, width: 36, flexShrink: 0, color: student.attendance >= 80 ? '#10b981' : '#ef4444' }}>{student.attendance}%</span></div></td>
                                    <td><ScoreChip score={student.grade.speaking} /></td>
                                    <td><ScoreChip score={student.grade.listening} /></td>
                                    <td><ScoreChip score={student.grade.reading} /></td>
                                    <td><ScoreChip score={student.grade.writing} /></td>
                                    <td><FeeTag status={student.fees} /></td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{student.province}</td>
                                    <td onClick={event => event.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Link href={editStudent.url(student.id)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Edit</Link>
                                            <button onClick={() => setDeleteTarget(student)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length > 0 && (
                        <Pagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </div>

                {selected && (
                    <div className="card fade-in" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', flex: 1 }}>
                                <Avatar name={selected.nameEn} size={64} />
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 2 }}>{selected.nameKh}</KH>
                                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10 }}>{selected.nameEn} / {selected.level}</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <Badge type="blue">{selected.level}</Badge>
                                        <FeeTag status={selected.fees} />
                                        {selected.attendance < 70 && <Badge type="red">Low Attendance</Badge>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <Link href={editStudent.url(selected.id)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Edit</Link>
                                <button onClick={() => setDeleteTarget(selected)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Delete</button>
                            </div>
                        </div>
                        <div style={{ padding: '12px 0', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                            <span>{selected.village}, {selected.province}</span>
                            <span>Attendance: <strong style={{ color: selected.attendance >= 80 ? '#10b981' : '#ef4444' }}>{selected.attendance}%</strong></span>
                            <span>Avg Score: <strong>{avg(selected)}</strong></span>
                        </div>
                    </div>
                )}
            </div>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Student?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Are you sure you want to remove <strong>{deleteTarget.nameEn}</strong>?</div>
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
