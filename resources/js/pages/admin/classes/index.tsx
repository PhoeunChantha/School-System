import { useState, useEffect, useMemo } from 'react';
import AdminShell from '@/pages/admin/shell';
import { CLASSES as INITIAL_CLASSES, TEACHERS, type SchoolClass } from '@/pages/admin/data';
import { Badge, Pagination } from '@/pages/admin/ui';
import { Link } from '@inertiajs/react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';

// ── Sort options ──────────────────────────────────────────
type OrderKey = 'name-asc' | 'name-desc' | 'teacher-asc' | 'students-desc' | 'students-asc' | 'room-asc';
const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc',      label: 'Name A → Z' },
    { value: 'name-desc',     label: 'Name Z → A' },
    { value: 'teacher-asc',   label: 'Teacher A → Z' },
    { value: 'students-desc', label: 'Students ↓ Most' },
    { value: 'students-asc',  label: 'Students ↑ Least' },
    { value: 'room-asc',      label: 'Room' },
];
function sortClasses(list: SchoolClass[], order: OrderKey): SchoolClass[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc':      return a.name.localeCompare(b.name);
            case 'name-desc':     return b.name.localeCompare(a.name);
            case 'teacher-asc':   return a.teacher.localeCompare(b.teacher);
            case 'students-desc': return b.count - a.count;
            case 'students-asc':  return a.count - b.count;
            case 'room-asc':      return a.room.localeCompare(b.room);
            default:              return 0;
        }
    });
}

export default function ClassesPage() {
    const [view, setView]                 = useState<View>('list');
    const [classes, setClasses]           = useState<SchoolClass[]>(INITIAL_CLASSES);
    const [search, setSearch]             = useState('');
    const [editing, setEditing]           = useState<SchoolClass | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
    const [orderBy, setOrderBy]           = useState<OrderKey>('name-asc');
    const [page, setPage]                 = useState(1);
    const [perPage, setPerPage]           = useState(5);

    const handleEdit   = (cls: SchoolClass) => { setEditing(cls); setView('edit'); };
    const handleDelete = (cls: SchoolClass) => setDeleteTarget(cls);
    const confirmDelete = () => {
        if (deleteTarget) setClasses(prev => prev.filter(c => c.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    useEffect(() => { setPage(1); }, [search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = classes.filter(c =>
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.teacher.toLowerCase().includes(q) ||
            c.room.toLowerCase().includes(q) ||
            c.days.toLowerCase().includes(q)
        );
        return sortClasses(base, orderBy);
    }, [classes, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>

            {/* ── List view ── */}
            {view === 'list' && (
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="f-input"
                            style={{ maxWidth: 260 }}
                            placeholder="🔍  Search classes..."
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[
                                { l: 'Total',    v: classes.length,                              c: '#3b82f6' },
                                { l: 'Students', v: classes.reduce((a, c) => a + c.count, 0),   c: '#8b5cf6' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 10, padding: '8px 14px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />
                                    <span style={{ fontSize: 11, color: '#64748b' }}>{s.l}</span>
                                    <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{s.v}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setView('add')}
                            style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            + Add Class
                        </button>
                    </div>

                    {/* Empty state */}
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                            No classes found for <strong>"{search}"</strong>
                        </div>
                    )}

                    {/* Table */}
                    {filtered.length > 0 && (
                        <div className="card" style={{ overflowX: 'auto' }}>

                            {/* Sort + per-page controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                                <select value={orderBy} onChange={e => setOrderBy(e.target.value as OrderKey)}
                                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                    {ORDER_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                    {[5, 10, 25, 50].map(n => (
                                        <option key={n} value={n}>{n} per page</option>
                                    ))}
                                </select>

                                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <table className="data-table">
                                <thead><tr>
                                    <th>Class / ថ្នាក់</th>
                                    <th>Teacher</th>
                                    <th>Room</th>
                                    <th>Schedule</th>
                                    <th>Days</th>
                                    <th>Students</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {paginated.map(cls => (
                                        <tr key={cls.id}>
                                            <td><span style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</span></td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{cls.teacher}</td>
                                            <td><Badge type="blue">{cls.room}</Badge></td>
                                            <td style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>🕐 {cls.time}</td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{cls.days}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontWeight: 700 }}>{cls.count}</span>
                                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>students</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <Link href="/admin/attendance"
                                                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                                        📋 Attendance
                                                    </Link>
                                                    <button onClick={() => handleEdit(cls)}
                                                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                        ✏️ Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(cls)}
                                                        style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                total={filtered.length}
                                page={page}
                                perPage={perPage}
                                onPageChange={setPage}
                                onPerPageChange={setPerPage}
                                showPerPage={false}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Add / Edit form ── */}
            {(view === 'add' || view === 'edit') && (
                <ClassForm
                    mode={view}
                    cls={editing ?? undefined}
                    onBack={() => { setView('list'); setEditing(null); }}
                />
            )}

            {/* ── Delete confirmation modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🗑️</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Class?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                Are you sure you want to remove <strong>{deleteTarget.name}</strong>?
                                This will affect <strong>{deleteTarget.count} students</strong> and cannot be undone.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)}
                                style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// ── Add / Edit Class form ─────────────────────────────────
interface FormProps { mode: 'add' | 'edit'; cls?: SchoolClass; onBack: () => void; }

function ClassForm({ mode, cls, onBack }: FormProps) {
    const isEdit = mode === 'edit';

    const handleSave = () => {
        toast.success(isEdit ? 'Class updated successfully!' : 'Class added successfully!', {
            description: isEdit ? `${cls?.name} has been updated.` : 'New class has been created.',
        });
        onBack();
    };

    return (
        <div className="fade-in" style={{ padding: 24 }}>
            <div className="card" style={{ padding: 28, maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {isEdit ? '✏️' : '🏫'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{isEdit ? 'Edit Class' : 'Add New Class'}</div>
                        {isEdit && cls && <div style={{ fontSize: 12, color: '#94a3b8' }}>{cls.name}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Class Name / ឈ្មោះថ្នាក់ *</label>
                        <select className="f-input" defaultValue={cls?.name}>
                            <option value="">Select level...</option>
                            {['Beginner 1', 'Beginner 2', 'Intermediate 1', 'Intermediate 2', 'Advanced 1', 'Advanced 2'].map(l => (
                                <option key={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Teacher / គ្រូ *</label>
                        <select className="f-input" defaultValue={cls?.teacher}>
                            <option value="">Select teacher...</option>
                            {TEACHERS.map(t => <option key={t.id}>{t.nameEn}</option>)}
                        </select>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Room / បន្ទប់ *</label>
                        <input className="f-input" placeholder="e.g. A1" defaultValue={cls?.room} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Start Time / ម៉ោងចាប់ផ្ដើម</label>
                        <input type="time" className="f-input" defaultValue="07:30" />
                    </div>
                    <div className="f-group">
                        <label className="f-label">End Time / ម៉ោងបញ្ចប់</label>
                        <input type="time" className="f-input" defaultValue="09:00" />
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Days / ថ្ងៃ *</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1.5px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}>
                                    <input type="checkbox" defaultChecked={cls?.days.includes(day)} style={{ accentColor: '#2563eb' }} />
                                    {day}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="f-group">
                        <label className="f-label">Max Students</label>
                        <input type="number" className="f-input" defaultValue={cls?.count ?? 20} min={1} max={50} />
                    </div>
                    <div className="f-group">
                        <label className="f-label">Monthly Fee (USD)</label>
                        <input type="number" className="f-input" defaultValue={25} min={0} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button onClick={onBack}
                        style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>
                        ← Cancel
                    </button>
                    <button onClick={handleSave}
                        style={{ flex: 1, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                        {isEdit ? '✓ Update Class' : '✓ Save Class'}
                    </button>
                </div>
            </div>
        </div>
    );
}
