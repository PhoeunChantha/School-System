import { FormEvent, useRef } from 'react';
import { index as homeworkIndex, store, update } from '@/actions/App/Http/Controllers/Backends/HomeworkAssignmentController';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FileText, Upload } from 'lucide-react';

export interface HomeworkClassOption {
    id: number;
    routeKey?: string;
    name: string;
    room: string;
    student_count: number;
}

export interface HomeworkFormData {
    id?: number;
    routeKey?: string;
    school_class_id: number | null;
    title_kh: string;
    title_en: string;
    instructions: string;
    attachment_file: File | null;
    attachment_name?: string;
    attachment_url?: string;
    points: string | number;
    due_on: string;
    academic_year: string;
    status: 'assigned' | 'draft' | 'closed';
    _method?: 'put';
}

interface HomeworkFormPageProps {
    mode: 'create' | 'edit';
    homework?: HomeworkFormData;
    classes: HomeworkClassOption[];
}

const fieldStyle = {
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

const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 6,
};

export default function HomeworkFormPage({ mode, homework, classes }: HomeworkFormPageProps) {
    const isEdit = mode === 'edit';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, transform } = useForm<HomeworkFormData>({
        school_class_id: homework?.school_class_id ?? classes[0]?.id ?? null,
        title_kh: homework?.title_kh ?? '',
        title_en: homework?.title_en ?? '',
        instructions: homework?.instructions ?? '',
        attachment_file: null,
        attachment_name: homework?.attachment_name ?? '',
        attachment_url: homework?.attachment_url ?? '',
        points: homework?.points ?? 100,
        due_on: homework?.due_on ?? '',
        academic_year: homework?.academic_year ?? new Date().getFullYear().toString(),
        status: homework?.status ?? 'assigned',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            ...(isEdit ? { _method: 'put' as const } : {}),
        }));

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success(isEdit ? 'Homework updated.' : 'Homework assigned.'),
        };

        if (isEdit && homework?.id) {
            post(update.url((homework.routeKey ?? homework.id) as never), options);
            return;
        }

        post(store.url(), options);
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
                            {isEdit ? 'Edit Homework' : 'Assign Homework'}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {isEdit ? 'Update class assignment details' : 'Create a new class assignment'}
                        </div>
                    </div>
                    <Link href={homeworkIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                        Cancel
                    </Link>
                </div>

                <form onSubmit={submit} className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Title (Khmer) *</label>
                        <input style={fieldStyle} value={data.title_kh} onChange={event => setData('title_kh', event.target.value)} placeholder="សរសេរចំណងជើងកិច្ចការ" />
                        {errors.title_kh && <div className="field-error">{errors.title_kh}</div>}
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Title (English)</label>
                        <input style={fieldStyle} value={data.title_en} onChange={event => setData('title_en', event.target.value)} placeholder="e.g. Write about family" />
                        {errors.title_en && <div className="field-error">{errors.title_en}</div>}
                    </div>

                    <div>
                        <label style={labelStyle}>Class *</label>
                        <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={val => setData('school_class_id', val ? Number(val) : null)}>
                            <SelectTrigger className="f-input">
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(schoolClass => (
                                    <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                                        {schoolClass.name} {schoolClass.room ? `- ${schoolClass.room}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.school_class_id && <div className="field-error">{errors.school_class_id}</div>}
                    </div>

                    <div>
                        <label style={labelStyle}>Due Date *</label>
                        <DatePicker value={data.due_on} onChange={value => setData('due_on', value)} className="f-input" />
                        {errors.due_on && <div className="field-error">{errors.due_on}</div>}
                    </div>

                    <div>
                        <label style={labelStyle}>Score *</label>
                        <input type="number" min={1} style={fieldStyle} value={data.points} onChange={event => setData('points', event.target.value)} />
                        {errors.points && <div className="field-error">{errors.points}</div>}
                    </div>

                    <div>
                        <label style={labelStyle}>Status *</label>
                        <Select value={data.status} onValueChange={val => setData('status', val as HomeworkFormData['status'])}>
                            <SelectTrigger className="f-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && <div className="field-error">{errors.status}</div>}
                    </div>

                    <div>
                        <label style={labelStyle}>Academic Year</label>
                        <input style={fieldStyle} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} placeholder="2026" />
                        {errors.academic_year && <div className="field-error">{errors.academic_year}</div>}
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Instructions</label>
                        <textarea style={{ ...fieldStyle, minHeight: 130, resize: 'vertical' }} rows={5} value={data.instructions} onChange={event => setData('instructions', event.target.value)} placeholder="Additional instructions..." />
                        {errors.instructions && <div className="field-error">{errors.instructions}</div>}
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Homework File</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '100%', minHeight: 64, background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                        >
                            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {data.attachment_file || data.attachment_name ? <FileText size={18} /> : <Upload size={18} />}
                            </span>
                            <span style={{ minWidth: 0, flex: 1 }}>
                                <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.attachment_file?.name || data.attachment_name || 'Upload homework file'}
                                </span>
                                <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                    PDF, Word, Excel, PowerPoint, JPG, or PNG up to 10MB
                                </span>
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                            style={{ display: 'none' }}
                            onChange={event => setData('attachment_file', event.target.files?.[0] ?? null)}
                        />
                        {data.attachment_url && !data.attachment_file && (
                            <a href={data.attachment_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 8, fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                                View current file
                            </a>
                        )}
                        {errors.attachment_file && <div className="field-error">{errors.attachment_file}</div>}
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                        <Link href={homeworkIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, textDecoration: 'none' }}>
                            Cancel
                        </Link>
                        <button disabled={processing} type="submit" style={{ background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: processing ? 'default' : 'pointer' }}>
                            {isEdit ? 'Save Changes' : 'Assign Homework'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}



