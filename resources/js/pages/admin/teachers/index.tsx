import { FormEvent, useRef, useState } from 'react';
import { index as lessonPlanIndex } from '@/actions/App/Http/Controllers/Backends/LessonPlanController';
import { destroy, show as showTeacher, store, update } from '@/actions/App/Http/Controllers/Backends/TeacherController';
import AdminShell from '@/pages/admin/shell';
import { KH, Avatar, Badge } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';

interface TeacherSchedule {
    id: number;
    name: string;
    time: string;
    room: string;
    count: number;
    days: string;
}

interface TeacherLesson {
    id: number;
    date: string;
    day: 'Today' | 'Tomorrow';
    title: string;
    className: string;
    room: string;
    time: string;
    objective: string;
    status: 'planned' | 'taught' | 'cancelled';
}

interface Teacher {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    subject: string;
    classes: number;
    students: number;
    phone: string;
    telegramUsername: string | null;
    status: 'active' | 'inactive';
    lessons: TeacherLesson[];
    schedule: TeacherSchedule[];
}

interface TeachersPageProps {
    teachers: Teacher[];
}

export default function TeachersPage({ teachers }: TeachersPageProps) {
    const [view, setView]             = useState<View>('list');
    const [search, setSearch]         = useState('');
    const [editing, setEditing]       = useState<Teacher | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
    const [scheduleTarget, setScheduleTarget] = useState<Teacher | null>(null);

    const handleEdit   = (t: Teacher) => { setEditing(t); setView('edit'); };
    const handleDelete = (t: Teacher) => setDeleteTarget(t);
    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Teacher deleted successfully!', {
                    description: `${deleteTarget.nameEn} has been removed.`,
                });
                setDeleteTarget(null);
            },
        });
    };

    const q = search.toLowerCase();
    const filtered = teachers.filter(t =>
        !q ||
        t.nameKh.includes(search) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.phone.includes(search)
    );

    return (
        <AdminShell>

            {/* List view */}
            {view === 'list' && (
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        {/* Search */}
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="f-input"
                            style={{ maxWidth: 260 }}
                            placeholder="🔍  Search teachers..."
                        />
                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[
                                { l: 'Total',  v: teachers.length, c: '#3b82f6' },
                                { l: 'Active', v: teachers.filter(t => t.status === 'active').length, c: '#10b981' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 10, padding: '8px 14px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />
                                    <span style={{ fontSize: 11, color: '#64748b' }}>{s.l}</span>
                                    <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{s.v}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setView('add')} style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            + Add Teacher
                        </button>
                    </div>

                    {/* Empty state */}
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                            No teachers found for <strong>"{search}"</strong>
                        </div>
                    )}

                    {/* Teacher cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                        {filtered.map(t => (
                            <div key={t.id} className="card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                    <Avatar name={t.nameEn} src={t.photo} size={56} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <KH style={{ fontWeight: 800, fontSize: 16, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameKh}</KH>
                                        <div style={{ fontSize: 13, color: '#64748b' }}>{t.nameEn}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.subject}</div>
                                    </div>
                                    <Badge type={t.status === 'active' ? 'green' : 'gray'}>{t.status}</Badge>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                    {[{ l: 'Classes', v: t.classes, c: '#3b82f6' }, { l: 'Students', v: t.students, c: '#8b5cf6' }].map(s => (
                                        <div key={s.l} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                                    {t.lessons.length > 0 ? t.lessons.slice(0, 2).map(lesson => (
                                        <Link key={lesson.id} href={lessonPlanIndex.url()}
                                            style={{ background: lesson.day === 'Today' ? '#eff6ff' : '#ecfdf5', border: `1px solid ${lesson.day === 'Today' ? '#bfdbfe' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 12px', textDecoration: 'none', display: 'grid', gap: 4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontSize: 11, color: lesson.day === 'Today' ? '#2563eb' : '#047857', fontWeight: 900 }}>{lesson.day} lesson</span>
                                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>{lesson.time || 'No time'}</span>
                                            </div>
                                            <div style={{ color: '#0f172a', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</div>
                                            <div style={{ color: '#64748b', fontSize: 11 }}>{lesson.className} - Room {lesson.room || 'N/A'}</div>
                                        </Link>
                                    )) : (
                                        <Link href={lessonPlanIndex.url()}
                                            style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '10px 12px', textDecoration: 'none', color: '#64748b', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
                                            No lesson planned for today or tomorrow
                                        </Link>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, marginBottom: 12 }}>
                                    <span>📞</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{t.phone}</span>
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Link href={showTeacher.url(t.id)}
                                        style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 12, textDecoration: 'none', textAlign: 'center' }}>
                                        👁 View
                                    </Link>
                                    <button onClick={() => handleEdit(t)}
                                        style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => handleDelete(t)}
                                        style={{ flex: 1, background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add / Edit form */}
            {(view === 'add' || view === 'edit') && (
                <TeacherForm
                    mode={view}
                    teacher={editing ?? undefined}
                    onBack={() => { setView('list'); setEditing(null); }}
                />
            )}

            {/* Schedule modal */}
            {scheduleTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setScheduleTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <Avatar name={scheduleTarget.nameEn} src={scheduleTarget.photo} size={48} />
                            <div>
                                <KH style={{ fontWeight: 800, fontSize: 16, display: 'block' }}>{scheduleTarget.nameKh}</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{scheduleTarget.subject}</div>
                            </div>
                            <button onClick={() => setScheduleTarget(null)} style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b' }}>✕</button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>CLASS SCHEDULE</div>
                            {scheduleTarget.schedule.map(cls => (
                                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8, border: '1px solid #e8edf5' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏫</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{cls.name}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{cls.days}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{cls.time}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Room {cls.room} · {cls.count} students</div>
                                    </div>
                                </div>
                            ))}
                            {scheduleTarget.schedule.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: 13 }}>No classes assigned yet.</div>
                            )}
                        </div>

                        <button onClick={() => setScheduleTarget(null)}
                            style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🗑️</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Remove Teacher?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                Are you sure you want to remove{' '}
                                <KH style={{ fontWeight: 700, color: '#1e293b' }}>{deleteTarget.nameKh}</KH>
                                {' '}({deleteTarget.nameEn})? This action cannot be undone.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Yes, Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// ── Add / Edit Teacher form ──
interface FormProps { mode: 'add' | 'edit'; teacher?: Teacher; onBack: () => void; }

interface TeacherFormData {
    name_kh: string;
    name_en: string;
    profile_photo: File | null;
    subject: string;
    phone: string;
    telegram_username: string;
    status: 'active' | 'inactive';
    _method?: 'put';
}

function TeacherForm({ mode, teacher, onBack }: FormProps) {
    const isEdit = mode === 'edit';
    const [photoPreview, setPhotoPreview] = useState<string | null>(teacher?.photo ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, transform } = useForm<TeacherFormData>({
        name_kh: teacher?.nameKh ?? '',
        name_en: teacher?.nameEn ?? '',
        profile_photo: null,
        subject: teacher?.subject ?? '',
        phone: teacher?.phone ?? '',
        telegram_username: teacher?.telegramUsername ?? '',
        status: teacher?.status ?? 'active',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            ...(isEdit ? { _method: 'put' as const } : {}),
            subject: formData.subject || null,
            phone: formData.phone || null,
            telegram_username: formData.telegram_username || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Teacher updated successfully!' : 'Teacher added successfully!', {
                    description: isEdit ? `${data.name_en} has been updated.` : 'New teacher has been created.',
                });
                onBack();
            },
        };

        if (isEdit && teacher) {
            post(update.url(teacher.id), options);

            return;
        }

        post(store.url(), options);
    };

    const inputError = (message?: string) => message ? (
        <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{message}</div>
    ) : null;

    return (
        <div className="fade-in" style={{ padding: 24 }}>
            <form className="card" onSubmit={submit} style={{ padding: 28, maxWidth: 600, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {isEdit ? '✏️' : '👩‍🏫'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</div>
                        {isEdit && teacher && <div style={{ fontSize: 12, color: '#94a3b8' }}>{teacher.nameEn}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: 96, height: 96, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0 }}
                        >
                            {photoPreview
                                ? <img src={photoPreview} alt="Teacher profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={36} color="#94a3b8" />
                            }
                            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={12} color="white" />
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                            {data.profile_photo ? data.profile_photo.name : 'Click to upload profile photo'}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            style={{ display: 'none' }}
                            onChange={event => {
                                const file = event.target.files?.[0] ?? null;
                                setData('profile_photo', file);
                                setPhotoPreview(file ? URL.createObjectURL(file) : (teacher?.photo ?? null));
                            }}
                        />
                        {inputError(errors.profile_photo as string | undefined)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">ឈ្មោះ (ខ្មែរ) *</label>
                        <input className="f-input" placeholder="ឧ. គ្រូ វុទ្ធី" value={data.name_kh} onChange={e => setData('name_kh', e.target.value)} />
                        {inputError(errors.name_kh)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">English Name *</label>
                        <input className="f-input" placeholder="e.g. Mr. Vuthy" value={data.name_en} onChange={e => setData('name_en', e.target.value)} />
                        {inputError(errors.name_en)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Subject / មុខវិជ្ជា *</label>
                        <select className="f-input" value={data.subject} onChange={e => setData('subject', e.target.value)}>
                            <option value="">Select subject...</option>
                            {['English Grammar', 'Conversation', 'Writing Skills', 'Listening Skills', 'Reading Comprehension', 'Pronunciation'].map(s => <option key={s}>{s}</option>)}
                        </select>
                        {inputError(errors.subject)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Phone / ទូរស័ព្ទ</label>
                        <input type="tel" className="f-input" placeholder="0xx-xxx-xxx" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        {inputError(errors.phone)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Status / ស្ថានភាព</label>
                        <select className="f-input" value={data.status} onChange={e => setData('status', e.target.value as 'active' | 'inactive')}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {inputError(errors.status)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Telegram Username</label>
                        <input className="f-input" placeholder="@username" value={data.telegram_username} onChange={e => setData('telegram_username', e.target.value)} />
                        {inputError(errors.telegram_username)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>← Cancel</button>
                    <button type="submit" disabled={processing} style={{ flex: 1, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                        {processing ? 'Saving...' : isEdit ? '✓ Update Teacher' : '✓ Save Teacher'}
                    </button>
                </div>
            </form>
        </div>
    );
}
