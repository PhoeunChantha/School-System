import { FormEvent, useMemo, useState } from 'react';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/LessonPlanController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { CalendarDays, Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type FilterKey = 'today' | 'tomorrow' | 'upcoming' | 'all';
type LessonStatus = 'planned' | 'taught' | 'cancelled';

interface LessonPlan {
    id: number;
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
    name: string;
    photo: string | null;
}

interface ClassOption {
    id: number;
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

export default function LessonPlansPage({ lessonPlans, teachers, classes, today, tomorrow, summary }: LessonPlansPageProps) {
    const [view, setView] = useState<View>('list');
    const [filter, setFilter] = useState<FilterKey>('today');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<LessonPlan | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LessonPlan | null>(null);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return lessonPlans.filter(lessonPlan => {
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
    }, [lessonPlans, search, filter, today, tomorrow]);

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url(deleteTarget.id), {
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <input value={search} onChange={event => setSearch(event.target.value)} className="f-input" style={{ maxWidth: 260 }} placeholder="Search lesson plans..." />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                                { id: 'today', label: 'Today' },
                                { id: 'tomorrow', label: 'Tomorrow' },
                                { id: 'upcoming', label: 'Upcoming' },
                                { id: 'all', label: 'All' },
                            ].map(item => (
                                <button key={item.id} onClick={() => setFilter(item.id as FilterKey)}
                                    style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 800, borderColor: filter === item.id ? '#2563eb' : '#e2e8f0', background: filter === item.id ? '#eff6ff' : 'white', color: filter === item.id ? '#2563eb' : '#64748b' }}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setEditing(null); setView('add'); }}
                            style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={15} /> Add Lesson
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
                        {filtered.map(lessonPlan => (
                            <div key={lessonPlan.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderTop: `4px solid ${lessonPlan.status === 'taught' ? '#16a34a' : lessonPlan.status === 'cancelled' ? '#94a3b8' : '#2563eb'}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <Avatar name={lessonPlan.teacher} src={lessonPlan.teacherPhoto} size={44} />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                            <Badge type={statusBadge[lessonPlan.status]}>{lessonPlan.status}</Badge>
                                            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{lessonPlan.day} - {lessonPlan.date}</span>
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>{lessonPlan.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{lessonPlan.teacher}</div>
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: 10, padding: 12, display: 'grid', gap: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                                        <strong style={{ color: '#334155' }}>{lessonPlan.className}</strong>
                                        <span style={{ color: '#2563eb', fontWeight: 800 }}>{lessonPlan.time || 'No time'}</span>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Room {lessonPlan.room || 'N/A'}</div>
                                </div>

                                <div style={{ minHeight: 58 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Students learn</div>
                                    <div style={{ color: '#334155', fontSize: 13, lineHeight: 1.55 }}>{lessonPlan.objective || lessonPlan.content || 'No lesson objective added yet.'}</div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                    <button onClick={() => { setEditing(lessonPlan); setView('edit'); }}
                                        style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button onClick={() => setDeleteTarget(lessonPlan)}
                                        style={{ flex: 1, background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="card" style={{ padding: '46px 24px', textAlign: 'center', color: '#64748b' }}>
                            <CalendarDays size={34} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                            <div style={{ fontWeight: 900, color: '#334155', marginBottom: 4 }}>No lesson plans found</div>
                            <div style={{ fontSize: 13 }}>Create a lesson plan for today or tomorrow to show what students will learn.</div>
                        </div>
                    )}
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
            put(update.url(lessonPlan.id), options);

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
                        <select className="f-input" value={data.teacher_id ?? ''} onChange={event => {
                            const teacherId = event.target.value ? Number(event.target.value) : null;
                            setData(values => ({ ...values, teacher_id: teacherId, school_class_id: null }));
                        }}>
                            <option value="">Select teacher...</option>
                            {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                        </select>
                        {inputError(errors.teacher_id)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Class *</label>
                        <select className="f-input" value={data.school_class_id ?? ''} onChange={event => setData('school_class_id', event.target.value ? Number(event.target.value) : null)}>
                            <option value="">Select class...</option>
                            {availableClasses.map(classOption => <option key={classOption.id} value={classOption.id}>{classOption.name} {classOption.time ? `(${classOption.time})` : ''}</option>)}
                        </select>
                        {selectedClass && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Room {selectedClass.room || 'N/A'} - {selectedClass.teacher}</div>}
                        {inputError(errors.school_class_id)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Lesson Date *</label>
                        <input type="date" className="f-input" value={data.lesson_date} onChange={event => setData('lesson_date', event.target.value)} />
                        {inputError(errors.lesson_date)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Status</label>
                        <select className="f-input" value={data.status} onChange={event => setData('status', event.target.value as LessonStatus)}>
                            <option value="planned">Planned</option>
                            <option value="taught">Taught</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
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
