import { FormEvent, useEffect, useMemo, useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/SchoolClassController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ClipboardCheck, Clock, Edit3, School, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface SchoolClass {
    id: number;
    levelId: number | null;
    teacherId: number | null;
    name: string;
    teacher: string;
    time: string;
    room: string;
    count: number;
    days: string;
    startsAt: string | null;
    endsAt: string | null;
    capacity: number | null;
    monthlyFee: string | null;
    status: 'active' | 'inactive';
}

interface LevelOption {
    id: number;
    name: string;
    monthly_fee: string;
}

interface TeacherOption {
    id: number;
    name_en: string;
}

interface ClassesPageProps {
    classes: SchoolClass[];
    levels: LevelOption[];
    teachers: TeacherOption[];
}

// ── Sort options ──────────────────────────────────────────
type OrderKey = 'name-asc' | 'name-desc' | 'teacher-asc' | 'students-desc' | 'students-asc' | 'room-asc';
const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc',      label: 'Name A-Z' },
    { value: 'name-desc',     label: 'Name Z-A' },
    { value: 'teacher-asc',   label: 'Teacher A-Z' },
    { value: 'students-desc', label: 'Students Most' },
    { value: 'students-asc',  label: 'Students Least' },
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

export default function ClassesPage({ classes, levels, teachers }: ClassesPageProps) {
    const [view, setView]                 = useState<View>('list');
    const [search, setSearch]             = useState('');
    const [editing, setEditing]           = useState<SchoolClass | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
    const [orderBy, setOrderBy]           = useState<OrderKey>('name-asc');
    const [page, setPage]                 = useState(1);
    const [perPage, setPerPage]           = useState(5);

    const handleEdit   = (cls: SchoolClass) => { setEditing(cls); setView('edit'); };
    const handleDelete = (cls: SchoolClass) => setDeleteTarget(cls);
    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Class deleted successfully!', {
                    description: `${deleteTarget.name} has been removed.`,
                });
                setDeleteTarget(null);
            },
        });
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                        <button onClick={() => setView('add')}
                            style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            + Add Class
                        </button>
                    </div>

                    {/* Table */}
                    <div className="card" style={{ overflowX: 'auto' }}>

                            {/* Sort + per-page controls */}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                                <Select value={orderBy} onValueChange={e => setOrderBy(e as OrderKey)}>
                                    <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORDER_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                                <Select value={perPage.toString()} onValueChange={e => { setPerPage(Number(e)); setPage(1); }}>
                                    <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 25, 50].map(n => (
                                            <SelectItem key={n} value={n.toString()}>{n} per page</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                                </span>

                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="f-input"
                                    style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                                    placeholder="Search classes..."
                                />
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
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '44px 16px', color: '#94a3b8', fontSize: 14 }}>
                                                No classes found for <strong>"{search}"</strong>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map(cls => (
                                            <tr key={cls.id}>
                                                <td><span style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</span></td>
                                                <td style={{ fontSize: 13, color: '#64748b' }}>{cls.teacher}</td>
                                                <td><Badge type="blue">{cls.room}</Badge></td>
                                                <td style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={13} />
                                                        {cls.time}
                                                    </span>
                                                </td>
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
                                                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <ClipboardCheck size={13} /> Attendance
                                                        </Link>
                                                        <button onClick={() => handleEdit(cls)}
                                                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <Edit3 size={13} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(cls)}
                                                            style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

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
                </div>
            )}

            {/* ── Add / Edit form ── */}
            {(view === 'add' || view === 'edit') && (
                <ClassForm
                    mode={view}
                    cls={editing ?? undefined}
                    levels={levels}
                    teachers={teachers}
                    onBack={() => { setView('list'); setEditing(null); }}
                />
            )}

            {/* ── Delete confirmation modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Trash2 size={26} />
                            </div>
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
interface FormProps {
    mode: 'add' | 'edit';
    cls?: SchoolClass;
    levels: LevelOption[];
    teachers: TeacherOption[];
    onBack: () => void;
}

function ClassForm({ mode, cls, levels, teachers, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const initialDays = (cls?.days.split(' ').filter(Boolean) ?? []) as Weekday[];
    const { data, setData, post, put, processing, errors, transform } = useForm({
        level_id: (cls?.levelId ?? null) as number | null,
        teacher_id: (cls?.teacherId ?? null) as number | null,
        name: cls?.name ?? '',
        room: cls?.room ?? '',
        starts_at: cls?.startsAt?.slice(0, 5) ?? '',
        ends_at: cls?.endsAt?.slice(0, 5) ?? '',
        days: initialDays,
        capacity: cls?.capacity ?? 20,
        academic_year: String(new Date().getFullYear()),
        status: cls?.status ?? 'active',
    });

    const selectedLevel = levels.find(level => level.id === data.level_id);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            level_id: formData.level_id || null,
            teacher_id: formData.teacher_id || null,
            starts_at: formData.starts_at || null,
            ends_at: formData.ends_at || null,
            capacity: formData.capacity || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Class updated successfully!' : 'Class added successfully!', {
                    description: isEdit ? `${data.name} has been updated.` : 'New class has been created.',
                });
                onBack();
            },
        };

        if (isEdit && cls) {
            put(update.url(cls.id), options);

            return;
        }

        post(store.url(), options);
    };

    const toggleDay = (day: Weekday) => {
        setData('days', data.days.includes(day) ? data.days.filter(value => value !== day) : [...data.days, day]);
    };

    return (
        <div className="fade-in" style={{ padding: 24 }}>
            <form className="card" onSubmit={submit} style={{ padding: 28, maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', color: isEdit ? '#2563eb' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isEdit ? <Edit3 size={20} /> : <School size={20} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{isEdit ? 'Edit Class' : 'Add New Class'}</div>
                        {isEdit && cls && <div style={{ fontSize: 12, color: '#94a3b8' }}>{cls.name}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Class Name / ឈ្មោះថ្នាក់ *</label>
                        <Select
                            value={data.level_id?.toString() ?? ''}
                            onValueChange={e => {
                                const level = levels.find(item => item.id === Number(e));

                                setData(data => ({
                                    ...data,
                                    level_id: level?.id ?? null,
                                    name: level?.name ?? '',
                                }));
                            }}
                        >
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select level..." />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map(level => (
                                    <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.name && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Teacher / គ្រូ *</label>
                        <Select value={data.teacher_id?.toString() ?? ''} onValueChange={e => setData('teacher_id', e ? Number(e) : null)}>
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select teacher..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>{teacher.name_en}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.teacher_id && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.teacher_id}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Room / បន្ទប់ *</label>
                        <input className="f-input" placeholder="e.g. A1" value={data.room} onChange={e => setData('room', e.target.value)} />
                        {errors.room && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.room}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Start Time / ម៉ោងចាប់ផ្ដើម</label>
                        <input type="time" className="f-input" value={data.starts_at} onChange={e => setData('starts_at', e.target.value)} />
                        {errors.starts_at && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.starts_at}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">End Time / ម៉ោងបញ្ចប់</label>
                        <input type="time" className="f-input" value={data.ends_at} onChange={e => setData('ends_at', e.target.value)} />
                        {errors.ends_at && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.ends_at}</div>}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Days / ថ្ងៃ *</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as Weekday[]).map(day => (
                                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1.5px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}>
                                    <input type="checkbox" checked={data.days.includes(day)} onChange={() => toggleDay(day)} style={{ accentColor: '#2563eb' }} />
                                    {day}
                                </label>
                            ))}
                        </div>
                        {errors.days && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.days}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Max Students</label>
                        <input type="number" className="f-input" value={data.capacity} min={1} max={200} onChange={e => setData('capacity', Number(e.target.value))} />
                        {errors.capacity && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.capacity}</div>}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Monthly Fee (USD)</label>
                        <input type="number" className="f-input" value={selectedLevel?.monthly_fee ?? ''} min={0} readOnly />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={onBack}
                        style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> Cancel
                    </button>
                    <button type="submit" disabled={processing}
                        style={{ flex: 1, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {processing ? 'Saving...' : <><Check size={14} />{isEdit ? 'Update Class' : 'Save Class'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
