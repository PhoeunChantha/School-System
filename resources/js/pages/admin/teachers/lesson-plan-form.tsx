import { FormEvent } from 'react';
import { store } from '@/routes/admin/teachers/lesson-plans';
import { teachers as teachersIndex } from '@/routes/admin';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, KH } from '@/pages/admin/ui';
import { Link, useForm } from '@inertiajs/react';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { BookOpen, Check, List, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';

type LessonStatus = 'planned' | 'taught' | 'cancelled';

interface Teacher {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    subject: string;
}

interface ClassOption {
    id: number;
    routeKey?: string;
    name: string;
    room: string;
    time: string;
}

interface TeacherLessonPlanFormProps {
    teacher: Teacher;
    classes: ClassOption[];
    today: string;
}

interface LessonPlanFormData {
    teacher_id: number;
    routeKey?: string;
    school_class_id: number | null;
    lesson_date: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
}

export default function TeacherLessonPlanForm({ teacher, classes, today }: TeacherLessonPlanFormProps) {
    const { data, setData, post, processing, errors, transform } = useForm<LessonPlanFormData>({
        teacher_id: teacher.id,
        school_class_id: classes[0]?.id ?? null,
        lesson_date: today,
        title: '',
        objective: '',
        content: '',
        materials: '',
        homework: '',
        status: 'planned',
    });

    const selectedClass = classes.find(classOption => classOption.id === data.school_class_id);
    const inputError = (message?: string) => message ? <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{message}</div> : null;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
            teacher_id: teacher.id,
            school_class_id: formData.school_class_id || null,
            objective: formData.objective || null,
            content: formData.content || null,
            materials: formData.materials || null,
            homework: formData.homework || null,
        }));

        post(store.url((teacher.routeKey ?? teacher.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lesson plan created successfully.', {
                    description: teacher.nameEn,
                });
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24 }}>
                <form className="card teacher-lesson-form-card" onSubmit={submit}>
                    <div className="teacher-lesson-header">
                        <Avatar name={teacher.nameEn} src={teacher.photo} size={52} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <KH style={{ display: 'block', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{teacher.nameKh}</KH>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 800 }}>{teacher.nameEn}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{teacher.subject}</div>
                        </div>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={20} />
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e8edf5', background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#334155', marginBottom: 4 }}>Create Lesson Plan For This Teacher</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                            The teacher is fixed. Choose one of their assigned classes and complete the lesson details.
                        </div>
                    </div>

                    <div className="teacher-lesson-form-grid">
                        <div className="f-group">
                            <label className="f-label">Class *</label>
                            <Select value={data.school_class_id ? String(data.school_class_id) : ''} onValueChange={value => setData('school_class_id', Number(value) || null)}>
                                <SelectTrigger className="f-input">
                                    <SelectValue placeholder="Select class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(classOption => (
                                        <SelectItem key={classOption.id} value={String(classOption.id)}>
                                            {classOption.name} {classOption.time ? `(${classOption.time})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedClass && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Room {selectedClass.room || 'N/A'}</div>}
                            {classes.length === 0 && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>This teacher has no active classes yet.</div>}
                            {inputError(errors.school_class_id)}
                        </div>

                        <div className="f-group">
                            <label className="f-label">Lesson Date *</label>
                            <DatePicker value={data.lesson_date} onChange={value => setData('lesson_date', value)} className="f-input" />
                            {inputError(errors.lesson_date)}
                        </div>

                        <div className="f-group">
                            <label className="f-label">Status</label>
                            <Select value={data.status} onValueChange={value => setData('status', value as LessonStatus)}>
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

                        <div className="f-group teacher-lesson-wide">
                            <label className="f-label">Lesson Topic *</label>
                            <input className="f-input" value={data.title} onChange={event => setData('title', event.target.value)} placeholder="e.g. Present Simple Tense" />
                            {inputError(errors.title)}
                        </div>

                        <div className="f-group teacher-lesson-wide">
                            <label className="f-label">Students Learn / Objective</label>
                            <RichTextEditor value={data.objective} onChange={value => setData('objective', value)} placeholder="Students can use the target language in short conversations." />
                            {inputError(errors.objective)}
                        </div>

                        <div className="f-group teacher-lesson-wide">
                            <label className="f-label">Teaching Content</label>
                            <RichTextEditor value={data.content} onChange={value => setData('content', value)} placeholder="Warm-up, presentation, guided practice, production..." minHeight={150} />
                            {inputError(errors.content)}
                        </div>

                        <div className="f-group">
                            <label className="f-label">Materials</label>
                            <textarea className="f-input" value={data.materials} onChange={event => setData('materials', event.target.value)} rows={3} placeholder="Workbook, flashcards, audio..." />
                            {inputError(errors.materials)}
                        </div>

                        <div className="f-group">
                            <label className="f-label">Homework</label>
                            <textarea className="f-input" value={data.homework} onChange={event => setData('homework', event.target.value)} rows={3} placeholder="Workbook page 12, exercise A-B..." />
                            {inputError(errors.homework)}
                        </div>
                    </div>

                    <div className="teacher-lesson-actions">
                        <Link href={teachersIndex.url()} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 800, cursor: 'pointer', textDecoration: 'none' }}>
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing || classes.length === 0} style={{ flex: 1, background: processing || classes.length === 0 ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 900, fontSize: 14, cursor: processing || classes.length === 0 ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Check size={16} />
                            {processing ? 'Saving...' : 'Save Lesson Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}

function RichTextEditor({
    value,
    onChange,
    placeholder,
    minHeight = 126,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    minHeight?: number;
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight.configure({ multicolor: true }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'teacher-rich-text-content',
                style: `min-height:${minHeight}px;`,
                'data-placeholder': placeholder,
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.isEmpty ? '' : editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    const buttonClass = (active = false) => `teacher-editor-button${active ? ' active' : ''}`;

    return (
        <div className="teacher-rich-text">
            <div className="teacher-rich-text-toolbar">
                <button type="button" className={buttonClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <strong>B</strong>
                </button>
                <button type="button" className={buttonClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <em>I</em>
                </button>
                <button type="button" className={buttonClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <u>U</u>
                </button>
                <button type="button" className={buttonClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list">
                    <List size={15} />
                </button>
                <button type="button" className={buttonClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">
                    <ListOrdered size={15} />
                </button>
                <button type="button" className={buttonClass(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    Left
                </button>
                <button type="button" className={buttonClass(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    Center
                </button>
                <button type="button" className={buttonClass(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef3c7' }).run()}>
                    Mark
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}



