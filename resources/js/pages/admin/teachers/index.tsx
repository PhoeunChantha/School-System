import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { lessonPlans as lessonPlanIndex } from '@/routes/admin';
import { create as createTeacherLessonPlan } from '@/routes/admin/teachers/lesson-plans';
import { destroy, downloadLayout as downloadTeacherLayout, exportMethod as exportTeachers, importMethod as importTeachers, show as showTeacher, store, update } from '@/actions/App/Http/Controllers/Backends/TeacherController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { KH, Avatar, Badge, Pagination } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, Check, Download, Edit3, Eye, FileDown, GraduationCap, Phone, School, Trash2, Upload, User, X } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';
type OrderKey = 'name-asc' | 'name-desc' | 'subject-asc' | 'classes-desc' | 'students-desc' | 'status-asc';

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

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'subject-asc', label: 'Subject' },
    { value: 'classes-desc', label: 'Classes Most' },
    { value: 'students-desc', label: 'Students Most' },
    { value: 'status-asc', label: 'Status' },
];

function sortTeachers(list: Teacher[], order: OrderKey): Teacher[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'name-asc': return a.nameEn.localeCompare(b.nameEn);
            case 'name-desc': return b.nameEn.localeCompare(a.nameEn);
            case 'subject-asc': return a.subject.localeCompare(b.subject);
            case 'classes-desc': return b.classes - a.classes;
            case 'students-desc': return b.students - a.students;
            case 'status-asc': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });
}

export default function TeachersPage({ teachers }: TeachersPageProps) {
    const [view, setView]             = useState<View>('list');
    const [search, setSearch]         = useState('');
    const [orderBy, setOrderBy]       = useState<OrderKey>('name-asc');
    const [page, setPage]             = useState(1);
    const [perPage, setPerPage]       = useState(5);
    const [editing, setEditing]       = useState<Teacher | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
    const [scheduleTarget, setScheduleTarget] = useState<Teacher | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

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

    const importFile = (file: File | null) => {
        if (!file) return;

        router.post(importTeachers.url(), { import_file: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Teachers imported successfully.'),
            onError: () => toast.error('Unable to import teachers. Please check the CSV layout.'),
            onFinish: () => {
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            },
        });
    };

    useEffect(() => { setPage(1); }, [search, orderBy, perPage]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = teachers.filter(t =>
            !q ||
            t.nameKh.includes(search) ||
            t.nameEn.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.phone.includes(search)
        );

        return sortTeachers(base, orderBy);
    }, [teachers, search, orderBy]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    return (
        <AdminShell>

            {/* List view */}
            {view === 'list' && (
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <a href={downloadTeacherLayout.url()} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #dbe3ef', borderRadius: 10, padding: '9px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Download size={14} /> Layout
                            </a>
                            <button type="button" onClick={() => importInputRef.current?.click()} style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 10, padding: '9px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Upload size={14} /> Import
                            </button>
                            <a href={exportTeachers.url()} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 10, padding: '9px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <FileDown size={14} /> Export
                            </a>
                            <button onClick={() => setView('add')} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                + Add Teacher
                            </button>
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                style={{ display: 'none' }}
                                onChange={event => importFile(event.target.files?.[0] ?? null)}
                            />
                        </div>
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
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                            <input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                className="f-input"
                                style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                                placeholder="Search teachers..."
                            />
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Subject</th>
                                    <th>Classes</th>
                                    <th>Students</th>
                                    <th>Phone</th>
                                    <th>Lessons</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '44px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                                            {search ? <>No teachers found for <strong>"{search}"</strong></> : 'No teachers found'}
                                        </td>
                                    </tr>
                                ) : paginated.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={t.nameEn} src={t.photo} size={34} />
                                                <div style={{ minWidth: 0 }}>
                                                    <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{t.nameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.nameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{t.subject}</td>
                                        <td style={{ fontWeight: 900, color: '#2563eb' }}>{t.classes}</td>
                                        <td style={{ fontWeight: 900, color: '#7c3aed' }}>{t.students}</td>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#374151', fontSize: 12, fontWeight: 700 }}>
                                                <Phone size={14} color="#64748b" />
                                                {t.phone || '-'}
                                            </span>
                                        </td>
                                        <td style={{ minWidth: 180 }}>
                                            {t.lessons.length === 0 ? (
                                                <span style={{ color: '#94a3b8', fontSize: 12 }}>No lessons</span>
                                            ) : (
                                                <Link href={lessonPlanIndex.url()} style={{ color: '#2563eb', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                                                    {t.lessons[0].title}
                                                    <span style={{ color: '#94a3b8', fontWeight: 700 }}> · {t.lessons[0].day}</span>
                                                </Link>
                                            )}
                                        </td>
                                        <td><Badge type={t.status === 'active' ? 'green' : 'gray'}>{t.status}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <Link href={createTeacherLessonPlan.url(t.id)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 9px', fontWeight: 800, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>Plan</Link>
                                                <Link href={showTeacher.url(t.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 9px', fontWeight: 800, fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Eye size={13} /> View
                                                </Link>
                                                <button onClick={() => handleEdit(t)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontWeight: 800, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Edit3 size={13} /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(t)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontWeight: 800, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                            <button onClick={() => setScheduleTarget(null)} style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>CLASS SCHEDULE</div>
                            {scheduleTarget.schedule.map(cls => (
                                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8, border: '1px solid #e8edf5' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <School size={17} />
                                    </div>
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
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Trash2 size={26} />
                            </div>
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
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', color: isEdit ? '#2563eb' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isEdit ? <Edit3 size={20} /> : <GraduationCap size={20} />}
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
                        <Select value={data.subject} onValueChange={value => setData('subject', value)}>
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select subject..." />
                            </SelectTrigger>
                            <SelectContent>
                                {['English Grammar', 'Conversation', 'Writing Skills', 'Listening Skills', 'Reading Comprehension', 'Pronunciation'].map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {inputError(errors.subject)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Phone / ទូរស័ព្ទ</label>
                        <input type="tel" className="f-input" placeholder="0xx-xxx-xxx" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        {inputError(errors.phone)}
                    </div>
                    <div className="f-group">
                        <label className="f-label">Status / ស្ថានភាព</label>
                        <Select value={data.status} onValueChange={value => setData('status', value as 'active' | 'inactive')}>
                            <SelectTrigger className="f-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {inputError(errors.status)}
                    </div>
                    <div className="f-group" style={{ gridColumn: '1/-1' }}>
                        <label className="f-label">Telegram Username</label>
                        <input className="f-input" placeholder="@username" value={data.telegram_username} onChange={e => setData('telegram_username', e.target.value)} />
                        {inputError(errors.telegram_username)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Cancel</button>
                    <button type="submit" disabled={processing} style={{ flex: 1, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {processing ? 'Saving...' : <><Check size={14} />{isEdit ? 'Update Teacher' : 'Save Teacher'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
