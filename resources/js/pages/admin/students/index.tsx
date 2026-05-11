import { useEffect, useMemo, useState } from 'react';
import { create as createStudent, destroy, edit as editStudent, show as showStudent } from '@/actions/App/Http/Controllers/Backends/StudentController';
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

type OrderKey = 'name-asc' | 'name-desc' | 'attend-desc' | 'attend-asc' | 'score-desc' | 'score-asc' | 'level-asc' | 'fee-asc' | 'province-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A → Z' },
    { value: 'name-desc', label: 'Name Z → A' },
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

/* ─── Responsive styles injected once ─── */
const RESPONSIVE_CSS = `
@media (max-width: 768px) {
    .students-topbar {
        flex-direction: column !important;
        align-items: stretch !important;
    }
    .students-stats {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
    }
    .students-add-btn {
        width: 100% !important;
        text-align: center !important;
        margin-left: 0 !important;
    }
    .students-toolbar {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
    }
    .students-toolbar-row1 {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
    }
    .students-search {
        max-width: 100% !important;
        margin-left: 0 !important;
        width: 100% !important;
    }
    .students-filters {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    /* Card layout for mobile instead of table */
    .students-table-wrap table { display: none !important; }
    .students-card-list { display: flex !important; }
    /* Detail panel */
    .student-detail-header {
        flex-direction: column !important;
    }
    .student-detail-actions {
        width: 100% !important;
        justify-content: stretch !important;
    }
    .student-detail-actions a,
    .student-detail-actions button {
        flex: 1;
        text-align: center;
    }
}
@media (min-width: 769px) {
    .students-card-list { display: none !important; }
    .students-table-wrap table { display: table !important; }
    .students-toolbar-row1 { display: contents; }
    .students-filters { display: contents; }
}
@media (max-width: 480px) {
    .students-stats {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}
`;

function useInjectCSS(css: string) {
    useEffect(() => {
        const id = 'students-responsive-css';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
        return () => { document.getElementById(id)?.remove(); };
    }, []);
}

/* ─── Mobile card for one student ─── */
function StudentCard({ student, onSelect, selected, onEdit, onDelete }: {
    student: Student;
    selected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            onClick={onSelect}
            style={{
                background: selected ? '#eff6ff' : 'white',
                border: `1.5px solid ${selected ? '#bfdbfe' : '#e8edf5'}`,
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
            }}
        >
            {/* Top row: avatar + name + fee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Avatar name={student.nameEn} src={student.photo} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <KH style={{ fontWeight: 700, fontSize: 14, display: 'block', lineHeight: 1.3 }}>{student.nameKh}</KH>
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.nameEn}</div>
                </div>
                <FeeTag status={student.fees} />
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <Badge type="blue">{student.level}</Badge>
                <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px' }}>{student.cls}</span>
                <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px' }}>{student.province}</span>
            </div>

            {/* Attendance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', width: 72, flexShrink: 0 }}>Attendance</span>
                <PBar value={student.attendance} color={student.attendance >= 80 ? 'green' : 'red'} />
                <span style={{ fontSize: 12, fontWeight: 700, color: student.attendance >= 80 ? '#10b981' : '#ef4444', width: 36, flexShrink: 0 }}>{student.attendance}%</span>
            </div>

            {/* Scores grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
                {(['speaking', 'listening', 'reading', 'writing'] as const).map(skill => (
                    <div key={skill} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, textTransform: 'capitalize' }}>{skill.slice(0, 4)}</div>
                        <ScoreChip score={student.grade[skill]} />
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                <Link
                    href={showStudent.url(student.id)}
                    style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                >
                    View
                </Link>
                <Link
                    href={editStudent.url(student.id)}
                    style={{ flex: 1, textAlign: 'center', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                >
                    Edit
                </Link>
                <button
                    onClick={onDelete}
                    style={{ flex: 1, background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, padding: '7px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default function StudentsPage({ students }: StudentsPageProps) {
    useInjectCSS(RESPONSIVE_CSS);

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

    const FILTER_OPTIONS = [
        { id: 'all', l: 'All' },
        { id: 'Beginner', l: 'Beginner' },
        { id: 'Intermediate', l: 'Inter.' },
        { id: 'Advanced', l: 'Advanced' },
        { id: 'atrisk', l: 'At-Risk' },
    ];

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Top bar: stats + add button ── */}
                <div className="students-topbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="students-stats" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                            { l: 'Total', v: students.length, c: '#3b82f6' },
                            { l: 'Paid', v: students.filter(s => s.fees === 'Paid').length, c: '#10b981' },
                            { l: 'Unpaid', v: students.filter(s => s.fees === 'Unpaid').length, c: '#ef4444' },
                            { l: 'At-Risk', v: students.filter(s => s.attendance < 70 || s.fees === 'Unpaid').length, c: '#f59e0b' },
                        ].map(stat => (
                            <div key={stat.l} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 auto' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.c, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: '#64748b' }}>{stat.l}</span>
                                <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{stat.v}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href={createStudent.url()}
                        className="students-add-btn"
                        style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                        + Add Student
                    </Link>
                </div>

                {/* ── Table card ── */}
                <div className="card" style={{ overflowX: 'auto' }}>

                    {/* Toolbar */}
                    <div className="students-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>

                        {/* Row 1 on mobile: sort + per-page + result count */}
                        <div className="students-toolbar-row1" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                            <select
                                value={orderBy}
                                onChange={e => setOrderBy(e.target.value as OrderKey)}
                                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                            >
                                {ORDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />
                            <select
                                value={perPage}
                                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                            >
                                {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size} / page</option>)}
                            </select>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Filters */}
                        <div className="students-filters" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {FILTER_OPTIONS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id)}
                                    style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', borderColor: filter === item.id ? '#3b82f6' : '#e2e8f0', background: filter === item.id ? '#eff6ff' : 'white', color: filter === item.id ? '#2563eb' : '#64748b' }}
                                >
                                    {item.l}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="f-input students-search"
                            style={{ maxWidth: 260, marginLeft: 'auto' }}
                            placeholder="Search students..."
                        />
                    </div>

                    {/* ── Desktop table ── */}
                    <div className="students-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th><th>Level</th><th>Class</th><th>Attendance</th>
                                    <th>Speaking</th><th>Listening</th><th>Reading</th><th>Writing</th>
                                    <th>Fee</th><th>Province</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} style={{ padding: '34px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                            Data not found
                                        </td>
                                    </tr>
                                ) : paginated.map(student => (
                                    <tr key={student.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(student.id === selected?.id ? null : student)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={student.nameEn} src={student.photo} size={34} />
                                                <div>
                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{student.nameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{student.nameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><Badge type="blue">{student.level}</Badge></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{student.cls}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                                                <PBar value={student.attendance} color={student.attendance >= 80 ? 'green' : 'red'} />
                                                <span style={{ fontSize: 12, fontWeight: 700, width: 36, flexShrink: 0, color: student.attendance >= 80 ? '#10b981' : '#ef4444' }}>{student.attendance}%</span>
                                            </div>
                                        </td>
                                        <td><ScoreChip score={student.grade.speaking} /></td>
                                        <td><ScoreChip score={student.grade.listening} /></td>
                                        <td><ScoreChip score={student.grade.reading} /></td>
                                        <td><ScoreChip score={student.grade.writing} /></td>
                                        <td><FeeTag status={student.fees} /></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{student.province}</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <Link href={showStudent.url(student.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>View</Link>
                                                <Link href={editStudent.url(student.id)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Edit</Link>
                                                <button onClick={() => setDeleteTarget(student)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Mobile card list ── */}
                    <div
                        className="students-card-list"
                        style={{ display: 'none', flexDirection: 'column', gap: 12, padding: '12px 16px' }}
                    >
                        {paginated.length === 0 ? (
                            <div style={{ padding: '34px 0', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                Data not found
                            </div>
                        ) : paginated.map(student => (
                            <StudentCard
                                key={student.id}
                                student={student}
                                selected={selected?.id === student.id}
                                onSelect={() => setSelected(student.id === selected?.id ? null : student)}
                                onEdit={() => {}}
                                onDelete={() => setDeleteTarget(student)}
                            />
                        ))}
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

                {/* ── Selected student detail panel ── */}
                {selected && (
                    <div className="card fade-in" style={{ padding: 20 }}>
                        <div
                            className="student-detail-header"
                            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', flex: 1 }}>
                                <Avatar name={selected.nameEn} src={selected.photo} size={56} />
                                <div style={{ flex: 1, minWidth: 180 }}>
                                    <KH style={{ fontWeight: 800, fontSize: 20, display: 'block', marginBottom: 2 }}>{selected.nameKh}</KH>
                                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{selected.nameEn} / {selected.level}</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <Badge type="blue">{selected.level}</Badge>
                                        <FeeTag status={selected.fees} />
                                        {selected.attendance < 70 && <Badge type="red">Low Attendance</Badge>}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="student-detail-actions"
                                style={{ display: 'flex', gap: 8, flexShrink: 0 }}
                            >
                                <Link href={editStudent.url(selected.id)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Edit</Link>
                                <button onClick={() => setDeleteTarget(selected)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Delete</button>
                            </div>
                        </div>

                        {/* Score grid on detail panel */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 12 }}>
                            {(['speaking', 'listening', 'reading', 'writing'] as const).map(skill => (
                                <div key={skill} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #e8edf5' }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize', marginBottom: 6 }}>{skill}</div>
                                    <ScoreChip score={selected.grade[skill]} />
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '12px 0', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                            <span>{selected.village}, {selected.province}</span>
                            <span>Attendance: <strong style={{ color: selected.attendance >= 80 ? '#10b981' : '#ef4444' }}>{selected.attendance}%</strong></span>
                            <span>Avg Score: <strong>{avg(selected)}</strong></span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete confirmation modal ── */}
            {deleteTarget && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
                >
                    <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Student?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                                Are you sure you want to remove <strong>{deleteTarget.nameEn}</strong>? This action cannot be undone.
                            </div>
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