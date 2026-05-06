import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipImage from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import AdminShell from '@/pages/admin/shell';
import { CLASSES } from '@/pages/admin/data';
import { Badge } from '@/pages/admin/ui';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface WordFile {
    name: string;
    dataUrl: string; // base64 data URL — stored as-is, never converted
}

interface Exam {
    id: number;
    title: string;
    subject: string;
    cls: string;
    date: string;
    duration: number;
    content: string;
    wordFile?: WordFile; // attached Word document (optional)
    createdAt: string;
}

let _uid = 200;
const uid = () => ++_uid;

// ── Seed data ──────────────────────────────────────────────────────────────

const DEFAULT_CONTENT = `
<h1 style="text-align:center">MID-TERM ENGLISH EXAMINATION</h1>
<p style="text-align:center"><strong>Frania English School · Cambodia</strong></p>
<hr>
<p><strong>Subject:</strong> English Grammar &nbsp;&nbsp; <strong>Class:</strong> Intermediate 1 &nbsp;&nbsp; <strong>Date:</strong> _______________ &nbsp;&nbsp; <strong>Time:</strong> 90 minutes</p>
<p><strong>Student Name:</strong> ________________________________________________ &nbsp;&nbsp; <strong>Score:</strong> _______ / 100</p>
<hr>
<h3>📋 Instructions / ការណែនាំ</h3>
<p>Read all questions carefully before answering. Write clearly in the spaces provided. No dictionaries are allowed.</p>
<h2>Part I: Multiple Choice (20 points)</h2>
<p><em>Circle the letter of the best answer. (2 points each)</em></p>
<p>1. Which sentence is grammatically correct?</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;A) She don't like coffee. &nbsp;&nbsp; B) She doesn't like coffee. &nbsp;&nbsp; C) She not like coffee. &nbsp;&nbsp; D) She do not likes coffee.</p>
<p>2. Choose the correct past tense of "go".</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;A) goed &nbsp;&nbsp; B) goes &nbsp;&nbsp; C) went &nbsp;&nbsp; D) going</p>
<h2>Part II: Fill in the Blank (20 points)</h2>
<p><em>Complete each sentence with the correct verb form. (2 points each)</em></p>
<p>1. I _____________ (go) to school every day.</p>
<p>2. She _____________ (study) English for 3 years.</p>
<h2>Part III: Short Answer (30 points)</h2>
<p><em>Answer in complete sentences. (5 points each)</em></p>
<p>1. Describe your daily routine using Present Simple tense.</p>
<p>_______________________________________________</p>
<p>_______________________________________________</p>
<p>_______________________________________________</p>
`;

const SEED: Exam[] = [
    { id: 1, title: 'Mid-Term English Exam', subject: 'English Grammar', cls: 'Intermediate 1', date: '2026-05-15', duration: 90, content: DEFAULT_CONTENT, createdAt: '2026-05-01' },
];

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════

type View = 'list' | 'build' | 'print';

export default function ExamPage() {
    const [view, setView]       = useState<View>('list');
    const [exams, setExams]     = useState<Exam[]>(SEED);
    const [current, setCurrent] = useState<Exam | null>(null);
    const [delTarget, setDelTarget] = useState<Exam | null>(null);

    const openNew = () => {
        setCurrent({ id: uid(), title: 'New Exam', subject: '', cls: '', date: '', duration: 60, content: DEFAULT_CONTENT, createdAt: new Date().toISOString().slice(0, 10) });
        setView('build');
    };
    const openEdit  = (e: Exam) => { setCurrent(JSON.parse(JSON.stringify(e))); setView('build'); };
    const openPrint = (e: Exam) => { setCurrent(e); setView('print'); };

    const save = (e: Exam) => {
        setExams(p => p.some(x => x.id === e.id) ? p.map(x => x.id === e.id ? e : x) : [...p, e]);
        toast.success('Exam saved!', { description: e.title });
        setView('list');
    };
    const confirmDel = () => {
        if (delTarget) { setExams(p => p.filter(e => e.id !== delTarget.id)); toast.success('Exam deleted.'); }
        setDelTarget(null);
    };

    if (view === 'build' && current) return <ExamBuilder exam={current} onSave={save} onBack={() => setView('list')} />;
    if (view === 'print' && current) return <PrintView exam={current} onBack={() => setView('list')} />;

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>📄 Exam Management</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Create and print exam papers</div>
                    </div>
                    <button onClick={openNew} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Create Exam</button>
                </div>

                {exams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>No exams yet</div>
                        <div style={{ fontSize: 13 }}>Click "+ Create Exam" to design your first exam.</div>
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Subject</th><th>Class</th><th>Date</th><th>Duration</th><th>Word File</th><th>Actions</th></tr></thead>
                            <tbody>
                                {exams.map(e => (
                                    <tr key={e.id}>
                                        <td><div style={{ fontWeight: 700, fontSize: 13 }}>{e.title}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Created {e.createdAt}</div></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{e.subject || '—'}</td>
                                        <td><Badge type="blue">{e.cls || '—'}</Badge></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{e.date || '—'}</td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{e.duration} min</td>
                                        <td>
                                            {e.wordFile ? (
                                                <a href={e.wordFile.dataUrl} download={e.wordFile.name}
                                                    style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    📄 {e.wordFile.name}
                                                </a>
                                            ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openPrint(e)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🖨️ Print</button>
                                                <button onClick={() => openEdit(e)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>✏️ Edit</button>
                                                <button onClick={() => setDelTarget(e)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {delTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDelTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
                            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Delete Exam?</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>"{delTarget.title}" will be permanently removed.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDelTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDel} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// EXAM BUILDER — Word-like document editor
// ══════════════════════════════════════════════════════════════════════════

function ExamBuilder({ exam: init, onSave, onBack }: { exam: Exam; onSave: (e: Exam) => void; onBack: () => void }) {
    const [meta, setMeta] = useState({ title: init.title, subject: init.subject, cls: init.cls, date: init.date, duration: init.duration });
    const [showMeta, setShowMeta] = useState(false);
    const [showDraw, setShowDraw] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef  = useRef<HTMLInputElement>(null);

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
        content: init.content || DEFAULT_CONTENT,
        editorProps: {
            attributes: { style: 'min-height:900px;outline:none;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#111;' },
        },
    });

    const handleSave = () => {
        onSave({ ...init, ...meta, content: editor?.getHTML() ?? '', wordFile });
    };

    const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        const reader = new FileReader();
        reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const insertDrawing = useCallback((dataUrl: string) => {
        editor?.chain().focus().setImage({ src: dataUrl }).run();
        setShowDraw(false);
    }, [editor]);

    const [wordFile, setWordFile] = useState<WordFile | undefined>(init.wordFile);

    const attachDocx = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setWordFile({ name: file.name, dataUrl: reader.result as string });
            toast.success('Word file attached!', { description: file.name });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    if (!editor) return null;

    return (
        <>
            <style>{`
                .tiptap-wrap { background:#808080; min-height:100vh; padding: 32px 0 60px; }
                /* A4 = 794px wide × 1122px tall at 96dpi.
                   Paper has 60px top+bottom padding so content area ≈ 1002px.
                   We show a gray page-break band every 1122px using background-image. */
                .tiptap-paper {
                    background: white;
                    max-width: 794px;
                    margin: 0 auto;
                    padding: 60px 72px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.35);
                    /* Page-break guide lines */
                    background-image: repeating-linear-gradient(
                        to bottom,
                        white          0px,
                        white          1121px,
                        #808080        1121px,
                        #808080        1169px,
                        white          1169px
                    );
                }
                .tiptap-paper h1{font-size:22px;font-weight:900;margin:0 0 8px}
                .tiptap-paper h2{font-size:17px;font-weight:800;margin:20px 0 6px}
                .tiptap-paper h3{font-size:15px;font-weight:700;margin:16px 0 4px}
                .tiptap-paper p{margin:4px 0}
                .tiptap-paper hr{border:none;border-top:2px solid #111;margin:12px 0}
                .tiptap-paper ul,.tiptap-paper ol{padding-left:24px;margin:6px 0}
                .tiptap-paper img{max-width:100%;border:1px solid #ddd;border-radius:4px;margin:4px 0}
                .tiptap-paper [data-type="highlight"]{background:#fef08a}
                .toolbar-btn{background:none;border:1px solid transparent;borderRadius:5px;padding:4px 7px;cursor:pointer;fontSize:13px;fontWeight:700;color:#374151;transition:all 0.12s}
                .toolbar-btn:hover{background:#f1f5f9;border-color:#e2e8f0}
                .toolbar-btn.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
                .toolbar-divider{width:1px;background:#e2e8f0;margin:0 6px;align-self:stretch}
            `}</style>

            {/* Fixed top bar */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#1e2940', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <div style={{ flex: 1, color: 'white', fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {meta.title || 'Untitled Exam'}</div>
                <button onClick={() => setShowMeta(m => !m)} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>⚙️ Details</button>
                <button onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 7, padding: '7px 18px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>✓ Save</button>
            </div>

            {/* Exam details panel */}
            {showMeta && (
                <div style={{ position: 'fixed', top: 48, right: 0, width: 320, zIndex: 49, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', padding: 20, borderLeft: '1px solid #e2e8f0', height: 'calc(100vh - 48px)', overflowY: 'auto' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: '#1e293b' }}>Exam Details</div>
                    {([
                        { k: 'title',    l: 'Title',           type: 'text',   ph: 'Exam title' },
                        { k: 'subject',  l: 'Subject',         type: 'text',   ph: 'e.g. English Grammar' },
                        { k: 'date',     l: 'Date',            type: 'date',   ph: '' },
                        { k: 'duration', l: 'Duration (mins)', type: 'number', ph: '60' },
                    ] as { k: keyof typeof meta; l: string; type: string; ph: string }[]).map(f => (
                        <div className="f-group" key={f.k}>
                            <label className="f-label">{f.l}</label>
                            <input className="f-input" type={f.type} placeholder={f.ph} value={String(meta[f.k])}
                                onChange={e => setMeta(p => ({ ...p, [f.k]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
                        </div>
                    ))}
                    <div className="f-group">
                        <label className="f-label">Class</label>
                        <select className="f-input" value={meta.cls} onChange={e => setMeta(p => ({ ...p, cls: e.target.value }))}>
                            <option value="">Select...</option>
                            {CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Formatting toolbar */}
            <div style={{ position: 'fixed', top: 48, left: 0, right: showMeta ? 320 : 0, zIndex: 48, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>

                {/* Undo / Redo */}
                <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</button>
                <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</button>
                <div className="toolbar-divider" />

                {/* Heading */}
                <select style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: '#374151' }}
                    value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : '0'}
                    onChange={e => {
                        const v = Number(e.target.value);
                        if (v === 0) editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: v as 1|2|3 }).run();
                    }}>
                    <option value="0">Normal</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>
                <div className="toolbar-divider" />

                {/* Text style */}
                <button className={`toolbar-btn${editor.isActive('bold') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><strong>B</strong></button>
                <button className={`toolbar-btn${editor.isActive('italic') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><em>I</em></button>
                <button className={`toolbar-btn${editor.isActive('underline') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></button>
                <button className={`toolbar-btn${editor.isActive('strike') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></button>
                <div className="toolbar-divider" />

                {/* Text align */}
                {(['left','center','right','justify'] as const).map(a => (
                    <button key={a} className={`toolbar-btn${editor.isActive({ textAlign: a }) ? ' active' : ''}`}
                        onClick={() => editor.chain().focus().setTextAlign(a).run()} title={`Align ${a}`}>
                        {a === 'left' ? '⬅' : a === 'center' ? '↔' : a === 'right' ? '➡' : '☰'}
                    </button>
                ))}
                <div className="toolbar-divider" />

                {/* Lists */}
                <button className={`toolbar-btn${editor.isActive('bulletList') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">• —</button>
                <button className={`toolbar-btn${editor.isActive('orderedList') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">1. —</button>
                <div className="toolbar-divider" />

                {/* Color */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>A</span>
                    <input type="color" defaultValue="#111111" style={{ width: 28, height: 28, padding: 2, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
                        onChange={e => editor.chain().focus().setColor(e.target.value).run()} title="Text Color" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>H</span>
                    <input type="color" defaultValue="#fef08a" style={{ width: 28, height: 28, padding: 2, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
                        onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} title="Highlight" />
                </div>
                <div className="toolbar-divider" />

                {/* HR */}
                <button className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">― ―</button>
                <div className="toolbar-divider" />

                {/* Insert Image */}
                <button className="toolbar-btn" onClick={() => imageInputRef.current?.click()} title="Upload Image" style={{ color: '#059669' }}>🖼 Image</button>
                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={insertImage} />

                {/* Attach Word file */}
                <button className="toolbar-btn" onClick={() => docxInputRef.current?.click()} title="Attach a Word document (.docx)" style={{ color: '#2563eb' }}>
                    📎 {wordFile ? wordFile.name : 'Attach Word File'}
                </button>
                {wordFile && (
                    <a href={wordFile.dataUrl} download={wordFile.name}
                        style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, textDecoration: 'none', padding: '4px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}
                        title="Download attached Word file">
                        ⬇ Download
                    </a>
                )}
                {wordFile && (
                    <button onClick={() => { setWordFile(undefined); toast.success('Attachment removed.'); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700 }} title="Remove attachment">
                        ✕
                    </button>
                )}
                <input ref={docxInputRef} type="file" accept=".docx,.doc" style={{ display: 'none' }} onChange={attachDocx} />

                {/* Drawing */}
                <button className="toolbar-btn" onClick={() => setShowDraw(true)} title="Drawing / Shapes" style={{ color: '#7c3aed' }}>✏️ Draw</button>
            </div>

            {/* Document body */}
            <div className="tiptap-wrap" style={{ paddingTop: 96, paddingBottom: 60, marginRight: showMeta ? 320 : 0 }}>
                <div className="tiptap-paper">
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Drawing modal */}
            {showDraw && <DrawingModal onInsert={insertDrawing} onClose={() => setShowDraw(false)} />}
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// DRAWING MODAL — freehand + shapes
// ══════════════════════════════════════════════════════════════════════════

type DrawTool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow' | 'text';

const DRAW_TOOLS: { id: DrawTool; label: string; icon: string }[] = [
    { id: 'pen',    label: 'Pen',       icon: '✏️' },
    { id: 'eraser', label: 'Eraser',    icon: '⬜' },
    { id: 'line',   label: 'Line',      icon: '╱' },
    { id: 'rect',   label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle',    icon: '○' },
    { id: 'arrow',  label: 'Arrow',     icon: '→' },
];

function DrawingModal({ onInsert, onClose }: { onInsert: (dataUrl: string) => void; onClose: () => void }) {
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const [tool, setTool]         = useState<DrawTool>('pen');
    const [color, setColor]       = useState('#111111');
    const [lineW, setLineW]       = useState(2);
    const drawingRef  = useRef(false);
    const startRef    = useRef({ x: 0, y: 0 });
    const snapshotRef = useRef<ImageData | null>(null);

    // Clear to white on mount
    useEffect(() => {
        const c = canvasRef.current!;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
    }, []);

    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current!.getBoundingClientRect();
        const scaleX = canvasRef.current!.width / r.width;
        const scaleY = canvasRef.current!.height / r.height;
        return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
    };

    const onDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = canvasRef.current!.getContext('2d')!;
        const pos = getPos(e);
        startRef.current = pos;
        snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        drawingRef.current = true;

        if (tool === 'pen' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };

    const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const ctx = canvasRef.current!.getContext('2d')!;
        const pos = getPos(e);
        const { x: sx, y: sy } = startRef.current;

        ctx.lineWidth = tool === 'eraser' ? lineW * 4 : lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

        if (tool === 'pen' || tool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else {
            // For shapes: restore snapshot then draw
            ctx.putImageData(snapshotRef.current!, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;

            if (tool === 'line') {
                ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else if (tool === 'rect') {
                ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - sx) / 2;
                const ry = Math.abs(pos.y - sy) / 2;
                const cx2 = sx + (pos.x - sx) / 2;
                const cy2 = sy + (pos.y - sy) / 2;
                ctx.ellipse(cx2, cy2, rx, ry, 0, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (tool === 'arrow') {
                const dx = pos.x - sx; const dy = pos.y - sy;
                const angle = Math.atan2(dy, dx);
                const headLen = 16;
                ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        }
    };

    const onUp = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        const ctx = canvasRef.current!.getContext('2d')!;
        if (tool === 'pen' || tool === 'eraser') ctx.closePath();
        snapshotRef.current = null;
    };

    const clearCanvas = () => {
        const c = canvasRef.current!;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
    };

    const doInsert = () => onInsert(canvasRef.current!.toDataURL('image/png'));

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', maxWidth: 860, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

                {/* Modal header */}
                <div style={{ background: '#1e2940', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: 15, flex: 1 }}>✏️ Drawing Canvas</div>
                    <button onClick={clearCanvas} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 7, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>🗑️ Clear</button>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 7, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✕ Cancel</button>
                    <button onClick={doInsert} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 7, padding: '6px 16px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>↑ Insert into Exam</button>
                </div>

                {/* Toolbar */}
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Tools */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {DRAW_TOOLS.map(t => (
                            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                                style={{ padding: '6px 10px', borderRadius: 7, border: `2px solid ${tool === t.id ? '#3b82f6' : '#e2e8f0'}`, background: tool === t.id ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: tool === t.id ? '#2563eb' : '#374151' }}>
                                {t.icon}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />

                    {/* Color + stroke */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Color</span>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)}
                            style={{ width: 32, height: 32, padding: 2, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }} />

                        {/* Quick colors */}
                        {['#111111','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6'].map(c => (
                            <button key={c} onClick={() => setColor(c)}
                                style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '3px solid #3b82f6' : '2px solid white', outline: color === c ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }} />
                        ))}
                    </div>

                    <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Size</span>
                        <input type="range" min={1} max={20} value={lineW} onChange={e => setLineW(Number(e.target.value))}
                            style={{ width: 80 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 20 }}>{lineW}px</span>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ background: '#f1f5f9', padding: 16 }}>
                    <canvas ref={canvasRef} width={780} height={440}
                        style={{ display: 'block', background: 'white', cursor: tool === 'eraser' ? 'crosshair' : 'crosshair', border: '1px solid #e2e8f0', borderRadius: 8, width: '100%', touchAction: 'none' }}
                        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// PRINT VIEW
// ══════════════════════════════════════════════════════════════════════════

function PrintView({ exam, onBack }: { exam: Exam; onBack: () => void }) {
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
                #print-root h3{font-size:14px;font-weight:700;margin:14px 0 3px}
                #print-root p{margin:4px 0;font-size:13px;line-height:1.7}
                #print-root hr{border:none;border-top:2px solid #000;margin:10px 0}
                #print-root ul,#print-root ol{padding-left:22px;margin:5px 0;font-size:13px}
                #print-root img{max-width:100%;page-break-inside:avoid}
                #print-root mark{background:#fef08a}
            `}</style>

            {/* Controls */}
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#1e2940', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                <div style={{ flex: 1, color: 'white', fontWeight: 700, fontSize: 15 }}>🖨️ Print Preview — {exam.title}</div>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                    🖨️ Print / Save as PDF
                </button>
            </div>

            {/* Paper */}
            <div className="no-print" style={{ paddingTop: 60, background: '#cbd5e1', minHeight: '100vh', paddingBottom: 60 }}>
                <div id="print-root" style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: '52px 64px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: "Georgia,'Times New Roman',serif" }}
                    dangerouslySetInnerHTML={{ __html: exam.content }} />
            </div>

            {/* Print-only paper (no outer wrapper) */}
            <div id="print-root" style={{ display: 'none', fontFamily: "Georgia,'Times New Roman',serif", padding: '0' }}
                dangerouslySetInnerHTML={{ __html: exam.content }} />
        </>
    );
}
