import { FormEvent, useEffect, useMemo, useState } from 'react';
import { destroy, edit, store, update } from '@/routes/admin/lesson-plans';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, Pagination } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

type View = 'list' | 'add' | 'edit';
type FilterKey = 'today' | 'tomorrow' | 'upcoming' | 'all';
type LessonStatus = 'planned' | 'taught' | 'cancelled';
type OrderKey = 'date-asc' | 'date-desc' | 'teacher-asc' | 'class-asc' | 'status-asc';

interface LessonPlan {
    id: number;
    routeKey?: string;
    teacherId: number | null;
    teacher: string;
    teacherPhoto: string | null;
    classId: number | null;
    className: string;
    room: string;
    time: string;
    date: string;
    day: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
}

interface TeacherOption {
    id: number;
    routeKey?: string;
    name: string;
    photo: string | null;
}

interface ClassOption {
    id: number;
    routeKey?: string;
    teacherId: number | null;
    name: string;
    teacher: string;
    room: string;
    time: string;
}

interface Summary {
    today: number;
    tomorrow: number;
    planned: number;
    taught: number;
}

interface LessonPlansPageProps {
    lessonPlans: LessonPlan[];
    teachers: TeacherOption[];
    classes: ClassOption[];
    today: string;
    tomorrow: string;
    summary: Summary;
}

const statusBadge: Record<LessonStatus, 'blue' | 'green' | 'gray'> = {
    planned: 'blue',
    taught: 'green',
    cancelled: 'gray',
};

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-asc', label: 'Date Oldest' },
    { value: 'date-desc', label: 'Date Newest' },
    { value: 'teacher-asc', label: 'Teacher A-Z' },
    { value: 'class-asc', label: 'Class A-Z' },
    { value: 'status-asc', label: 'Status' },
];

function sortLessonPlans(list: LessonPlan[], order: OrderKey): LessonPlan[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-asc': return a.date.localeCompare(b.date);
            case 'date-desc': return b.date.localeCompare(a.date);
            case 'teacher-asc': return a.teacher.localeCompare(b.teacher);
            case 'class-asc': return a.className.localeCompare(b.className);
            case 'status-asc': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });
}

export default function LessonPlansPage({ lessonPlans, teachers, classes, today, tomorrow, summary, openForm = false, editing: initialEditing = null }: LessonPlansPageProps & { openForm?: boolean; editing?: LessonPlan | null }) {
    const [view, setView] = useState<View>(openForm ? (initialEditing ? 'edit' : 'add') : 'list');
    const [filter, setFilter] = useState<FilterKey>('today');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [editing, setEditing] = useState<LessonPlan | null>(initialEditing ?? null);
    const [deleteTarget, setDeleteTarget] = useState<LessonPlan | null>(null);

    useEffect(() => { setPage(1); }, [filter, search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        const base = lessonPlans.filter(lessonPlan => {
            const matchesFilter = filter === 'all'
                || (filter === 'today' && lessonPlan.date === today)
                || (filter === 'tomorrow' && lessonPlan.date === tomorrow)
                || (filter === 'upcoming' && lessonPlan.date >= today);

            const matchesSearch = !query
                || lessonPlan.title.toLowerCase().includes(query)
                || lessonPlan.teacher.toLowerCase().includes(query)
                || lessonPlan.className.toLowerCase().includes(query)
                || lessonPlan.objective.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });

        return sortLessonPlans(base, orderBy);
    }, [lessonPlans, search, filter, today, tomorrow, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lesson plan deleted successfully!', {
                    description: deleteTarget.title,
                });
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            {view === 'list' && (
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                        {[
                            { label: 'Today', value: summary.today, color: '#2563eb' },
                            { label: 'Tomorrow', value: summary.tomorrow, color: '#0f766e' },
                            { label: 'Planned', value: summary.planned, color: '#7c3aed' },
                            { label: 'Taught', value: summary.taught, color: '#16a34a' },
                        ].map(item => (
                            <div key={item.label} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 10, height: 38, borderRadius: 8, background: item.color }} />
                                <div>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
                                    <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 900, lineHeight: 1 }}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                        <Link href="/admin/lesson-plans/create" style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <Plus size={15} /> Add Lesson
                        </Link>
                    </div>

                    <div className="card" style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                            <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                                <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={perPage.toString()} onValueChange={value => setPerPage(Number(value))}>
                                <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filter} onValueChange={value => setFilter(value as FilterKey)}>
                                <SelectTrigger style={{ width: 'auto', minWidth: 130, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                            <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }} placeholder="Search lesson plans..." />
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Lesson Topic</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '44px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                                            {search ? <>No lesson plans found for <strong>"{search}"</strong></> : 'No lesson plans found'}
                                        </td>
                                    </tr>
                                ) : paginated.map(lessonPlan => (
                                    <tr key={lessonPlan.id}>
                                        <td>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>{lessonPlan.date}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{lessonPlan.day}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={lessonPlan.teacher} src={lessonPlan.teacherPhoto} size={34} />
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{lessonPlan.teacher}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{lessonPlan.className}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Room {lessonPlan.room || 'N/A'} - {lessonPlan.time || 'No time'}</div>
                                        </td>
                                        <td style={{ maxWidth: 380 }}>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{lessonPlan.title}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lessonPlan.objective || lessonPlan.content || 'No lesson objective added yet.'}</div>
                                        </td>
                                        <td><Badge type={statusBadge[lessonPlan.status]}>{lessonPlan.status}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <Link href={edit.url((lessonPlan.routeKey ?? lessonPlan.id) as never)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                                                    <Edit3 size={13} /> Edit
                                                </Link>
                                                <button onClick={() => setDeleteTarget(lessonPlan)}
                                                    style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {(view === 'add' || view === 'edit') && (
                <LessonPlanForm
                    mode={view}
                    lessonPlan={editing ?? undefined}
                    teachers={teachers}
                    classes={classes}
                    today={today}
                    onBack={() => { setView('list'); setEditing(null); }}
                />
            )}

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 6 }}>Delete Lesson Plan?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove <strong>{deleteTarget.title}</strong> from the teaching plan.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

interface LessonPlanFormData {
    teacher_id: number | null;
    school_class_id: number | null;
    lesson_date: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
}

interface FormProps {
    mode: 'add' | 'edit';
    lessonPlan?: LessonPlan;
    teachers: TeacherOption[];
    classes: ClassOption[];
    today: string;
    onBack: () => void;
}

function LessonPlanForm({ mode, lessonPlan, teachers, classes, today, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const { data, setData, post, put, processing, errors, transform } = useForm<LessonPlanFormData>({
        teacher_id: lessonPlan?.teacherId ?? null,
        school_class_id: lessonPlan?.classId ?? null,
        lesson_date: lessonPlan?.date ?? today,
        title: lessonPlan?.title ?? '',
        objective: lessonPlan?.objective ?? '',
        content: lessonPlan?.content ?? '',
        materials: lessonPlan?.materials ?? '',
        homework: lessonPlan?.homework ?? '',
        status: lessonPlan?.status ?? 'planned',
    });

    const availableClasses = data.teacher_id
        ? classes.filter(classOption => classOption.teacherId === data.teacher_id)
        : classes;

    const selectedClass = classes.find(classOption => classOption.id === data.school_class_id);

    const inputError = (message?: string) => message ? <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{message}</div> : null;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            teacher_id: formData.teacher_id || null,
            school_class_id: formData.school_class_id || null,
            objective: formData.objective || null,
            content: formData.content || null,
            materials: formData.materials || null,
            homework: formData.homework || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Lesson plan updated successfully!' : 'Lesson plan created successfully!', {
                    description: data.title,
                });
                onBack();
            },
        };

        if (isEdit && lessonPlan) {
            put(update.url((lessonPlan.routeKey ?? lessonPlan.id) as never), options);

            return;
        }

        post(store.url(), options);
    };

    return (
        <div className="fade-in" style={{ padding: 24 }}>
            <form className="card" onSubmit={submit} style={{ padding: 28, maxWidth: 760, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: isEdit ? '#eff6ff' : '#ecfdf5', color: isEdit ? '#2563eb' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isEdit ? <Edit3 size={20} /> : <Check size={20} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 17, color: '#1e293b' }}>{isEdit ? 'Edit Lesson Plan' : 'Add Lesson Plan'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Plan what lesson students will be taught today or tomorrow.</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="f-group">
                        <label className="f-label">Teacher *</label>
                        <Select value={data.teacher_id ? String(data.teacher_id) : ''} onValueChange={val => {
                            const teacherId = val ? Number(val) : null;
                            setData(values => ({ ...values, teacher_id: teacherId, school_class_id: null }));
                        }}>
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select teacher..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(teacher => <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {inputError(errors.teacher_id)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Class *</label>
                        <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => setData('school_class_id', val ? Number(val) : null)}>
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select class..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.map(classOption => <SelectItem key={classOption.id} value={String(classOption.id)}>{classOption.name} {classOption.time ? `(${classOption.time})` : ''}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {selectedClass && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Room {selectedClass.room || 'N/A'} - {selectedClass.teacher}</div>}
                        {inputError(errors.school_class_id)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Lesson Date *</label>
                        <DatePicker value={data.lesson_date} onChange={value => setData('lesson_date', value)} className="f-input" />
                        {inputError(errors.lesson_date)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Status</label>
                        <Select value={data.status} onValueChange={val => setData('status', val as LessonStatus)}>
                            <SelectTrigger className="f-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="taught">Taught</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        {inputError(errors.status)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Lesson Topic *</label>
                        <input className="f-input" value={data.title} onChange={event => setData('title', event.target.value)} placeholder="e.g. Present Simple Tense" />
                        {inputError(errors.title)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Students Learn / Objective</label>
                        <textarea className="f-input" value={data.objective} onChange={event => setData('objective', event.target.value)} rows={3} placeholder="Students can use present simple positive and negative sentences." />
                        {inputError(errors.objective)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Teaching Content</label>
                        <textarea className="f-input" value={data.content} onChange={event => setData('content', event.target.value)} rows={4} placeholder="Warm-up, explanation, examples, guided practice..." />
                        {inputError(errors.content)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Materials</label>
                        <textarea className="f-input" value={data.materials} onChange={event => setData('materials', event.target.value)} rows={3} placeholder="Workbook page, flashcards, audio..." />
                        {inputError(errors.materials)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Homework</label>
                        <textarea className="f-input" value={data.homework} onChange={event => setData('homework', event.target.value)} rows={3} placeholder="Workbook page 12, exercise A-B..." />
                        {inputError(errors.homework)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={processing} style={{ flex: 1, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
                        {processing ? 'Saving...' : isEdit ? 'Update Lesson Plan' : 'Save Lesson Plan'}
                    </button>
                </div>
            </form>
        </div>
    );
}



