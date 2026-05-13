import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ExamController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TipImage from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Edit3, FileText, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ExamClassOption {
    id: number;
    name: string;
    room: string;
    studentCount: number;
}

interface ExamItem {
    id: number;
    schoolClassId: number | null;
    className: string;
    title: string;
    subject: string;
    academicYear: string;
    examDate: string;
    durationMinutes: number | null;
    content: string;
    status: 'draft' | 'published' | 'archived';
    resultsCount: number;
    createdAt: string;
}

interface ExamPageProps {
    exams: ExamItem[];
    classes: ExamClassOption[];
    summary: {
        examCount: number;
        draftCount: number;
        publishedCount: number;
        archivedCount: number;
    };
}

interface ExamFormData {
    school_class_id: number | null;
    title: string;
    subject: string;
    academic_year: string;
    exam_date: string;
    duration_minutes: number | null;
    content: string;
    status: 'draft' | 'published' | 'archived';
}

type View = 'list' | 'build' | 'print';
type OrderKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status-asc';

const DEFAULT_CONTENT = `
<h1 style="text-align:center">ENGLISH EXAMINATION</h1>
<p style="text-align:center"><strong>Frania English School</strong></p>
<hr>
<p><strong>Student Name:</strong> ____________________________ <strong>Score:</strong> ____ / 100</p>
<h2>Part I: Multiple Choice</h2>
<p>1. Choose the best answer.</p>
<p>A. Option one &nbsp;&nbsp; B. Option two &nbsp;&nbsp; C. Option three</p>
<h2>Part II: Writing</h2>
<p>Write five sentences about your daily routine.</p>
`;

const emptyForm = (classes: ExamClassOption[]): ExamFormData => ({
    school_class_id: classes[0]?.id ?? null,
    title: 'New Exam',
    subject: '',
    academic_year: new Date().getFullYear().toString(),
    exam_date: '',
    duration_minutes: 60,
    content: DEFAULT_CONTENT,
    status: 'draft',
});

const statusType = {
    draft: 'amber',
    published: 'green',
    archived: 'gray',
} as const;

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Date new-old' },
    { value: 'date-asc', label: 'Date old-new' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
    { value: 'status-asc', label: 'Status A-Z' },
];

function sortExams(exams: ExamItem[], orderBy: OrderKey): ExamItem[] {
    return [...exams].sort((a, b) => {
        if (orderBy === 'date-asc') {
            return (a.examDate || a.createdAt).localeCompare(b.examDate || b.createdAt);
        }

        if (orderBy === 'title-asc') {
            return a.title.localeCompare(b.title);
        }

        if (orderBy === 'title-desc') {
            return b.title.localeCompare(a.title);
        }

        if (orderBy === 'status-asc') {
            return a.status.localeCompare(b.status);
        }

        return (b.examDate || b.createdAt).localeCompare(a.examDate || a.createdAt);
    });
}

export default function ExamPage({ exams, classes, summary }: ExamPageProps) {
    const [view, setView] = useState<View>('list');
    const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
    const [printingExam, setPrintingExam] = useState<ExamItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ExamItem | null>(null);
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);

    const { data, setData, post, put, processing, errors, reset, transform } = useForm<ExamFormData>(emptyForm(classes));

    useEffect(() => { setPage(1); }, [search, orderBy, perPage]);

    const filteredExams = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = exams.filter(exam =>
            !q ||
            exam.title.toLowerCase().includes(q) ||
            exam.subject.toLowerCase().includes(q) ||
            exam.className.toLowerCase().includes(q) ||
            exam.status.toLowerCase().includes(q) ||
            exam.academicYear.toLowerCase().includes(q) ||
            exam.examDate.includes(search)
        );

        return sortExams(filtered, orderBy);
    }, [exams, search, orderBy]);

    const paginatedExams = useMemo(
        () => filteredExams.slice((page - 1) * perPage, page * perPage),
        [filteredExams, page, perPage],
    );

    const openCreate = () => {
        reset();
        setData(emptyForm(classes));
        setEditingExam(null);
        setView('build');
    };

    const openEdit = (exam: ExamItem) => {
        setData({
            school_class_id: exam.schoolClassId,
            title: exam.title,
            subject: exam.subject,
            academic_year: exam.academicYear,
            exam_date: exam.examDate,
            duration_minutes: exam.durationMinutes,
            content: exam.content || DEFAULT_CONTENT,
            status: exam.status,
        });
        setEditingExam(exam);
        setView('build');
    };

    const submitExam = (payload: ExamFormData) => {
        setData(payload);
        transform(() => payload);

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingExam ? 'Exam updated.' : 'Exam created.');
                setView('list');
                setEditingExam(null);
            },
        };

        if (editingExam) {
            put(update.url(editingExam.id), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Exam deleted.');
                setDeleteTarget(null);
            },
        });
    };

    if (view === 'build') {
        return (
            <ExamBuilder
                classes={classes}
                data={data}
                errors={errors}
                processing={processing}
                onBack={() => setView('list')}
                onSave={submitExam}
            />
        );
    }

    if (view === 'print' && printingExam) {
        return <PrintView exam={printingExam} onBack={() => setView('list')} />;
    }

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Exam Management</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Create, save, edit, print, and archive exam papers</div>
                    </div>
                    <button onClick={openCreate} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} />
                        Create Exam
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Exams', value: summary.examCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Drafts', value: summary.draftCount, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Published', value: summary.publishedCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Archived', value: summary.archivedCount, color: '#64748b', bg: '#f8fafc' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 150, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />

                        <Select value={perPage.toString()} onValueChange={value => { setPerPage(Number(value)); setPage(1); }}>
                            <SelectTrigger style={{ width: 'auto', minWidth: 120, padding: '5px 10px', fontSize: 12, height: 'auto' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(size => (
                                    <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                            {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''}
                        </span>

                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="f-input"
                            style={{ width: 260, maxWidth: '100%', marginLeft: 'auto' }}
                            placeholder="Search exams..."
                        />
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExams.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '42px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        {search ? <>No exams found for <strong>"{search}"</strong></> : 'No exams found'}
                                    </td>
                                </tr>
                            ) : paginatedExams.map(exam => (
                                <tr key={exam.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FileText size={17} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{exam.title}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Created {exam.createdAt || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{exam.subject || '-'}</td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{exam.className || 'All classes'}</td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{exam.examDate || '-'}</td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{exam.durationMinutes ? `${exam.durationMinutes} min` : '-'}</td>
                                    <td><Badge type={statusType[exam.status]}>{exam.status}</Badge></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => { setPrintingExam(exam); setView('print'); }} style={actionButton('#f0fdf4', '#16a34a', '#bbf7d0')} title="Print">
                                                <Printer size={14} />
                                            </button>
                                            <button onClick={() => openEdit(exam)} style={actionButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(exam)} style={actionButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredExams.length > 0 && (
                        <Pagination
                            total={filteredExams.length}
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                            showPerPage={false}
                        />
                    )}
                </div>
            </div>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 18, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.16)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: '#1e293b' }}>Delete Exam?</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>"{deleteTarget.title}" will be removed.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function ExamBuilder({
    classes,
    data,
    errors,
    processing,
    onBack,
    onSave,
}: {
    classes: ExamClassOption[];
    data: ExamFormData;
    errors: Partial<Record<keyof ExamFormData, string>>;
    processing: boolean;
    onBack: () => void;
    onSave: (data: ExamFormData) => void;
}) {
    const [meta, setMeta] = useState<ExamFormData>(data);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Color.configure({ types: [TextStyle.name] }),
            TextStyle,
            Highlight.configure({ multicolor: true }),
            TipImage.configure({ inline: true, allowBase64: true }),
        ],
        content: data.content || DEFAULT_CONTENT,
        editorProps: {
            attributes: {
                style: 'min-height:820px;outline:none;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#111;',
            },
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave({ ...meta, content: editor?.getHTML() ?? '' });
    };

    const insertImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    if (!editor) {
        return null;
    }

    return (
        <form onSubmit={submit}>
            <style>{`
                .exam-paper {
                    background: white;
                    max-width: 794px;
                    margin: 0 auto;
                    padding: 56px 68px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.28);
                    min-height: 1122px;
                }
                .exam-paper h1{font-size:22px;font-weight:900;margin:0 0 8px}
                .exam-paper h2{font-size:17px;font-weight:800;margin:20px 0 6px}
                .exam-paper h3{font-size:15px;font-weight:700;margin:16px 0 4px}
                .exam-paper p{margin:4px 0}
                .exam-paper hr{border:none;border-top:2px solid #111;margin:12px 0}
                .exam-paper ul,.exam-paper ol{padding-left:24px;margin:6px 0}
                .exam-paper img{max-width:100%;border:1px solid #ddd;border-radius:4px;margin:4px 0}
                .toolbar-btn{background:white;border:1px solid #e2e8f0;border-radius:7px;padding:6px 9px;cursor:pointer;font-size:13px;font-weight:700;color:#374151}
                .toolbar-btn.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
            `}</style>

            <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={onBack} style={topButton('rgba(255,255,255,0.12)')}>
                    <ArrowLeft size={15} />
                    Back
                </button>
                <input value={meta.title} onChange={event => setMeta(current => ({ ...current, title: event.target.value }))} style={{ minWidth: 220, flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', borderRadius: 8, padding: '8px 10px', fontWeight: 800, outline: 'none' }} />
                <button disabled={processing} type="submit" style={topButton(processing ? '#93c5fd' : '#10b981')}>
                    <Save size={15} />
                    {processing ? 'Saving' : 'Save'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,320px) 1fr', minHeight: 'calc(100vh - 54px)' }}>
                <aside style={{ background: 'white', borderRight: '1px solid #e2e8f0', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Subject" error={errors.subject}>
                        <input value={meta.subject} onChange={event => setMeta(current => ({ ...current, subject: event.target.value }))} style={fieldStyle} />
                    </Field>
                    <Field label="Class" error={errors.school_class_id}>
                        <select value={meta.school_class_id ?? ''} onChange={event => setMeta(current => ({ ...current, school_class_id: Number(event.target.value) || null }))} style={fieldStyle}>
                            <option value="">All classes</option>
                            {classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Exam Date" error={errors.exam_date}>
                        <input type="date" value={meta.exam_date} onChange={event => setMeta(current => ({ ...current, exam_date: event.target.value }))} style={fieldStyle} />
                    </Field>
                    <Field label="Duration" error={errors.duration_minutes}>
                        <input type="number" min={1} max={1000} value={meta.duration_minutes ?? ''} onChange={event => setMeta(current => ({ ...current, duration_minutes: Number(event.target.value) || null }))} style={fieldStyle} />
                    </Field>
                    <Field label="Academic Year" error={errors.academic_year}>
                        <input value={meta.academic_year} onChange={event => setMeta(current => ({ ...current, academic_year: event.target.value }))} style={fieldStyle} />
                    </Field>
                    <Field label="Status" error={errors.status}>
                        <select value={meta.status} onChange={event => setMeta(current => ({ ...current, status: event.target.value as ExamFormData['status'] }))} style={fieldStyle}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </Field>
                    {errors.title && <div className="field-error">{errors.title}</div>}
                    {errors.content && <div className="field-error">{errors.content}</div>}
                </aside>

                <main style={{ background: '#cbd5e1', minWidth: 0 }}>
                    <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className={`toolbar-btn${editor.isActive('bold') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
                        <button type="button" className={`toolbar-btn${editor.isActive('italic') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
                        <button type="button" className={`toolbar-btn${editor.isActive('underline') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
                        <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>List</button>
                        <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
                        <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>Rule</button>
                        <input type="color" defaultValue="#111111" onChange={event => editor.chain().focus().setColor(event.target.value).run()} title="Text color" style={{ width: 34, height: 34, padding: 2, border: '1px solid #e2e8f0', borderRadius: 7 }} />
                        <button type="button" className="toolbar-btn" onClick={() => imageInputRef.current?.click()}>Image</button>
                        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={insertImage} />
                    </div>
                    <div style={{ padding: '30px 16px 60px', overflowX: 'auto' }}>
                        <div className="exam-paper">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </main>
            </div>
        </form>
    );
}

function PrintView({ exam, onBack }: { exam: ExamItem; onBack: () => void }) {
    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #print-root, #print-root * { visibility: visible !important; }
                    #print-root { position: fixed; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                }
                #print-root h1{font-size:22px;font-weight:900;text-align:center;margin:0 0 6px}
                #print-root h2{font-size:16px;font-weight:800;margin:18px 0 4px;border-bottom:1px solid #555;padding-bottom:3px}
                #print-root p{margin:4px 0;font-size:13px;line-height:1.7}
                #print-root img{max-width:100%;page-break-inside:avoid}
            `}</style>
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onBack} style={topButton('rgba(255,255,255,0.12)')}><ArrowLeft size={15} />Back</button>
                <div style={{ flex: 1, color: 'white', fontWeight: 800, fontSize: 15 }}>{exam.title}</div>
                <button onClick={() => window.print()} style={topButton('#2563eb')}><Printer size={15} />Print</button>
            </div>
            <div className="no-print" style={{ paddingTop: 68, background: '#cbd5e1', minHeight: '100vh', paddingBottom: 60 }}>
                <div id="print-root" style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: '52px 64px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: "Georgia,'Times New Roman',serif" }} dangerouslySetInnerHTML={{ __html: exam.content || DEFAULT_CONTENT }} />
            </div>
            <div id="print-root" style={{ display: 'none', fontFamily: "Georgia,'Times New Roman',serif" }} dangerouslySetInnerHTML={{ __html: exam.content || DEFAULT_CONTENT }} />
        </>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{label}</span>
            {children}
            {error && <span className="field-error">{error}</span>}
        </label>
    );
}

function actionButton(background: string, color: string, border: string): React.CSSProperties {
    return {
        background,
        color,
        border: `1px solid ${border}`,
        borderRadius: 7,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

function topButton(background: string): React.CSSProperties {
    return {
        background,
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '8px 13px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
    };
}

const fieldStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 40,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};
