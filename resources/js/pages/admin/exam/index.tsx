import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { CLASSES } from '@/pages/admin/data';
import { KH, Badge } from '@/pages/admin/ui';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

type QuestionType = 'mc' | 'tf' | 'fill' | 'short' | 'essay';

interface MCOption { id: string; text: string; }

interface Question {
    id: number;
    type: QuestionType;
    text: string;
    points: number;
    options: MCOption[]; // for mc
    lines: number;       // for short / essay
}

interface ExamSection {
    id: number;
    title: string;
    instructions: string;
    questions: Question[];
}

interface Exam {
    id: number;
    title: string;
    subject: string;
    cls: string;
    date: string;
    duration: number;
    totalPoints: number;
    instructions: string;
    sections: ExamSection[];
    createdAt: string;
}

// ── Static seed data ───────────────────────────────────────────────────────

const SEED_EXAMS: Exam[] = [
    {
        id: 1,
        title: 'Mid-Term English Exam',
        subject: 'English Grammar',
        cls: 'Intermediate 1',
        date: '2026-05-15',
        duration: 90,
        totalPoints: 100,
        instructions: 'Read all questions carefully before answering. Write clearly in the spaces provided. No dictionaries are allowed.',
        createdAt: '2026-05-01',
        sections: [
            {
                id: 1,
                title: 'Part I: Multiple Choice',
                instructions: 'Circle the best answer for each question. (2 points each)',
                questions: [
                    { id: 1, type: 'mc', text: 'Which sentence is grammatically correct?', points: 2, options: [{ id: 'A', text: 'She don\'t like coffee.' }, { id: 'B', text: 'She doesn\'t like coffee.' }, { id: 'C', text: 'She not like coffee.' }, { id: 'D', text: 'She do not likes coffee.' }], lines: 0 },
                    { id: 2, type: 'mc', text: 'Choose the correct past tense form of "go".', points: 2, options: [{ id: 'A', text: 'goed' }, { id: 'B', text: 'goes' }, { id: 'C', text: 'went' }, { id: 'D', text: 'going' }], lines: 0 },
                ],
            },
            {
                id: 2,
                title: 'Part II: Fill in the Blank',
                instructions: 'Complete each sentence with the correct word. (2 points each)',
                questions: [
                    { id: 3, type: 'fill', text: 'I ________ (go) to school every day.', points: 2, options: [], lines: 0 },
                    { id: 4, type: 'fill', text: 'She ________ (study) English for 3 years.', points: 2, options: [], lines: 0 },
                ],
            },
            {
                id: 3,
                title: 'Part III: Short Answer',
                instructions: 'Answer the following questions in complete sentences. (5 points each)',
                questions: [
                    { id: 5, type: 'short', text: 'Describe your daily routine using Present Simple tense.', points: 5, options: [], lines: 4 },
                ],
            },
        ],
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<QuestionType, string> = {
    mc: 'Multiple Choice',
    tf: 'True / False',
    fill: 'Fill in Blank',
    short: 'Short Answer',
    essay: 'Essay',
};

const TYPE_COLORS: Record<QuestionType, string> = {
    mc: 'blue', tf: 'green', fill: 'amber', short: 'purple', essay: 'gray',
};

let nextId = 100;
const uid = () => ++nextId;

function newQuestion(type: QuestionType): Question {
    return {
        id: uid(), type, text: '', points: type === 'essay' ? 20 : type === 'short' ? 5 : 2,
        options: type === 'mc' ? [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }] : type === 'tf' ? [{ id: 'T', text: 'True' }, { id: 'F', text: 'False' }] : [],
        lines: type === 'essay' ? 10 : type === 'short' ? 4 : 0,
    };
}

function countPoints(exam: Exam) {
    return exam.sections.reduce((sum, sec) => sum + sec.questions.reduce((s, q) => s + q.points, 0), 0);
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════

type View = 'list' | 'build' | 'print';

export default function ExamPage() {
    const [view, setView]     = useState<View>('list');
    const [exams, setExams]   = useState<Exam[]>(SEED_EXAMS);
    const [current, setCurrent] = useState<Exam | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

    const openNew = () => {
        const e: Exam = {
            id: uid(), title: '', subject: '', cls: '', date: '', duration: 60,
            totalPoints: 100, instructions: '', createdAt: new Date().toISOString().slice(0, 10),
            sections: [{ id: uid(), title: 'Part I', instructions: '', questions: [] }],
        };
        setCurrent(e); setView('build');
    };

    const openEdit = (e: Exam) => { setCurrent(JSON.parse(JSON.stringify(e))); setView('build'); };
    const openPrint = (e: Exam) => { setCurrent(e); setView('print'); };

    const saveExam = (e: Exam) => {
        setExams(prev => prev.some(x => x.id === e.id) ? prev.map(x => x.id === e.id ? e : x) : [...prev, e]);
        toast.success('Exam saved!', { description: e.title });
        setView('list');
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            setExams(prev => prev.filter(e => e.id !== deleteTarget.id));
            toast.success('Exam deleted.');
        }
        setDeleteTarget(null);
    };

    if (view === 'build' && current) return <ExamBuilder exam={current} onSave={saveExam} onBack={() => setView('list')} />;
    if (view === 'print' && current) return <PrintView exam={current} onBack={() => setView('list')} />;

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>📄 Exam Management</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Create and print exam papers</div>
                    </div>
                    <button onClick={openNew} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        + Create Exam
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { l: 'Total Exams',   v: exams.length,                                                      c: '#3b82f6' },
                        { l: 'Total Questions', v: exams.reduce((s, e) => s + e.sections.reduce((ss, sec) => ss + sec.questions.length, 0), 0), c: '#8b5cf6' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />
                            <span style={{ fontSize: 11, color: '#64748b' }}>{s.l}</span>
                            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{s.v}</span>
                        </div>
                    ))}
                </div>

                {/* Exam list */}
                {exams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No exams yet</div>
                        <div style={{ fontSize: 13 }}>Click "+ Create Exam" to design your first exam paper.</div>
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr>
                                <th>Title</th><th>Subject</th><th>Class</th><th>Date</th><th>Duration</th><th>Questions</th><th>Points</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {exams.map(e => {
                                    const qCount = e.sections.reduce((s, sec) => s + sec.questions.length, 0);
                                    const pts = countPoints(e);
                                    return (
                                        <tr key={e.id}>
                                            <td><div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{e.title || <span style={{ color: '#94a3b8' }}>Untitled</span>}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{e.sections.length} section{e.sections.length !== 1 ? 's' : ''}</div></td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{e.subject || '—'}</td>
                                            <td><Badge type="blue">{e.cls || '—'}</Badge></td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{e.date || '—'}</td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{e.duration} min</td>
                                            <td><span style={{ fontWeight: 700 }}>{qCount}</span></td>
                                            <td><span style={{ fontWeight: 700, color: '#2563eb' }}>{pts}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => openPrint(e)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🖨️ Print</button>
                                                    <button onClick={() => openEdit(e)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>✏️ Edit</button>
                                                    <button onClick={() => setDeleteTarget(e)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Delete Exam?</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>"{deleteTarget.title || 'Untitled'}" will be permanently removed.</div>
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

// ══════════════════════════════════════════════════════════════════════════
// EXAM BUILDER
// ══════════════════════════════════════════════════════════════════════════

function ExamBuilder({ exam: init, onSave, onBack }: { exam: Exam; onSave: (e: Exam) => void; onBack: () => void }) {
    const [exam, setExam] = useState<Exam>(init);
    const [expandedQ, setExpandedQ] = useState<number | null>(null);
    const [addingType, setAddingType] = useState<{ sectionId: number } | null>(null);

    const setMeta = (field: keyof Exam, val: string | number) =>
        setExam(prev => ({ ...prev, [field]: val }));

    const updateSection = (sid: number, field: keyof ExamSection, val: string) =>
        setExam(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, [field]: val } : s) }));

    const addSection = () =>
        setExam(prev => ({ ...prev, sections: [...prev.sections, { id: uid(), title: `Part ${prev.sections.length + 1}`, instructions: '', questions: [] }] }));

    const removeSection = (sid: number) =>
        setExam(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sid) }));

    const addQuestion = (sid: number, type: QuestionType) => {
        const q = newQuestion(type);
        setExam(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, questions: [...s.questions, q] } : s) }));
        setExpandedQ(q.id);
        setAddingType(null);
    };

    const updateQuestion = (sid: number, qid: number, patch: Partial<Question>) =>
        setExam(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, questions: s.questions.map(q => q.id === qid ? { ...q, ...patch } : q) } : s) }));

    const removeQuestion = (sid: number, qid: number) =>
        setExam(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, questions: s.questions.filter(q => q.id !== qid) } : s) }));

    const updateOption = (sid: number, qid: number, optId: string, text: string) =>
        setExam(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sid ? { ...s, questions: s.questions.map(q => q.id === qid ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, text } : o) } : q) } : s) }));

    const totalPts = countPoints(exam);
    const totalQ = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);

    return (
        <AdminShell>
            <style>{`
                .exam-paper { background: white; max-width: 860px; margin: 0 auto; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 12px; }
                .q-card { border: 1.5px solid #e2e8f0; border-radius: 10px; background: white; margin-bottom: 10px; overflow: hidden; }
                .q-card:hover { border-color: #bfdbfe; }
                .q-card.active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
            `}</style>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto' }}>

                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>{exam.id === init.id && !init.title ? 'New Exam' : (exam.title || 'Untitled Exam')}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{totalQ} questions · {totalPts} points total</div>
                    </div>
                    <button onClick={() => onSave(exam)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        ✓ Save Exam
                    </button>
                </div>

                {/* Exam header fields */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#374151', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📋</span> Exam Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="f-group" style={{ gridColumn: '1/-1' }}>
                            <label className="f-label">Exam Title *</label>
                            <input className="f-input" style={{ fontSize: 15, fontWeight: 700 }} placeholder="e.g. Mid-Term English Exam" value={exam.title} onChange={e => setMeta('title', e.target.value)} />
                        </div>
                        <div className="f-group">
                            <label className="f-label">Subject / មុខវិជ្ជា</label>
                            <input className="f-input" placeholder="e.g. English Grammar" value={exam.subject} onChange={e => setMeta('subject', e.target.value)} />
                        </div>
                        <div className="f-group">
                            <label className="f-label">Class / ថ្នាក់</label>
                            <select className="f-input" value={exam.cls} onChange={e => setMeta('cls', e.target.value)}>
                                <option value="">Select class...</option>
                                {CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="f-group">
                            <label className="f-label">Exam Date / ថ្ងៃប្រឡង</label>
                            <input type="date" className="f-input" value={exam.date} onChange={e => setMeta('date', e.target.value)} />
                        </div>
                        <div className="f-group">
                            <label className="f-label">Duration (minutes) / រយៈពេល</label>
                            <input type="number" className="f-input" value={exam.duration} min={10} max={300} onChange={e => setMeta('duration', Number(e.target.value))} />
                        </div>
                        <div className="f-group" style={{ gridColumn: '1/-1' }}>
                            <label className="f-label">General Instructions / ការណែនាំ</label>
                            <textarea className="f-input" rows={3} placeholder="e.g. Read all questions carefully. No dictionaries allowed..." value={exam.instructions} onChange={e => setMeta('instructions', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Sections */}
                {exam.sections.map((sec, si) => (
                    <div key={sec.id} className="card" style={{ padding: 24 }}>
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div className="f-group" style={{ marginBottom: 0 }}>
                                    <label className="f-label">Section Title</label>
                                    <input className="f-input" placeholder="e.g. Part I: Multiple Choice" value={sec.title} onChange={e => updateSection(sec.id, 'title', e.target.value)} />
                                </div>
                                <div className="f-group" style={{ marginBottom: 0 }}>
                                    <label className="f-label">Section Instructions (optional)</label>
                                    <input className="f-input" placeholder="e.g. Circle the best answer. (2 pts each)" value={sec.instructions} onChange={e => updateSection(sec.id, 'instructions', e.target.value)} />
                                </div>
                            </div>
                            {exam.sections.length > 1 && (
                                <button onClick={() => removeSection(sec.id)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, marginTop: 18, flexShrink: 0 }}>Remove Section</button>
                            )}
                        </div>

                        {/* Questions */}
                        {sec.questions.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13, border: '2px dashed #e2e8f0', borderRadius: 10, marginBottom: 12 }}>
                                No questions yet — add one below.
                            </div>
                        )}

                        {sec.questions.map((q, qi) => {
                            const isOpen = expandedQ === q.id;
                            let globalNum = 0;
                            for (let s = 0; s < si; s++) globalNum += exam.sections[s].questions.length;
                            globalNum += qi + 1;

                            return (
                                <div key={q.id} className={`q-card${isOpen ? ' active' : ''}`}>
                                    {/* Question header row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isOpen ? '#f8faff' : 'white' }}
                                        onClick={() => setExpandedQ(isOpen ? null : q.id)}>
                                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e2940', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{globalNum}</div>
                                        <Badge type={TYPE_COLORS[q.type] as 'blue' | 'green' | 'amber' | 'purple' | 'gray'}>{TYPE_LABELS[q.type]}</Badge>
                                        <div style={{ flex: 1, fontSize: 13, color: q.text ? '#1e293b' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {q.text || 'Click to edit question...'}
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                                        <button onClick={ev => { ev.stopPropagation(); removeQuestion(sec.id, q.id); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>×</button>
                                    </div>

                                    {/* Expanded editor */}
                                    {isOpen && (
                                        <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                                                <div>
                                                    <label className="f-label">Question Text *</label>
                                                    <textarea className="f-input" rows={2} placeholder="Type your question here..." value={q.text}
                                                        onChange={e => updateQuestion(sec.id, q.id, { text: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="f-label">Points</label>
                                                    <input type="number" className="f-input" style={{ width: 70 }} min={1} max={100} value={q.points}
                                                        onChange={e => updateQuestion(sec.id, q.id, { points: Number(e.target.value) })} />
                                                </div>
                                            </div>

                                            {/* MC options */}
                                            {q.type === 'mc' && (
                                                <div>
                                                    <label className="f-label">Answer Options</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                        {q.options.map(opt => (
                                                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#3b82f6', flexShrink: 0 }}>{opt.id}</div>
                                                                <input className="f-input" style={{ flex: 1 }} placeholder={`Option ${opt.id}`} value={opt.text}
                                                                    onChange={e => updateOption(sec.id, q.id, opt.id, e.target.value)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fill / Short / Essay: lines */}
                                            {(q.type === 'short' || q.type === 'essay') && (
                                                <div>
                                                    <label className="f-label">Answer Lines (for print)</label>
                                                    <input type="number" className="f-input" style={{ maxWidth: 100 }} min={1} max={30} value={q.lines}
                                                        onChange={e => updateQuestion(sec.id, q.id, { lines: Number(e.target.value) })} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add question */}
                        {addingType?.sectionId === sec.id ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                {(['mc', 'tf', 'fill', 'short', 'essay'] as QuestionType[]).map(t => (
                                    <button key={t} onClick={() => addQuestion(sec.id, t)}
                                        style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#374151', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#2563eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; }}>
                                        {TYPE_LABELS[t]}
                                    </button>
                                ))}
                                <button onClick={() => setAddingType(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}>✕ Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setAddingType({ sectionId: sec.id })}
                                style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 8, border: '2px dashed #bfdbfe', background: '#f8faff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
                                + Add Question
                            </button>
                        )}
                    </div>
                ))}

                {/* Add section */}
                <button onClick={addSection}
                    style={{ padding: '10px', borderRadius: 10, border: '2px dashed #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                    + Add Section / Part
                </button>

                {/* Bottom save */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
                    <button onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => onSave(exam)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✓ Save Exam</button>
                </div>
            </div>
        </AdminShell>
    );
} 

// ══════════════════════════════════════════════════════════════════════════
// PRINT VIEW
// ══════════════════════════════════════════════════════════════════════════

function PrintView({ exam, onBack }: { exam: Exam; onBack: () => void }) {
    const totalPts = countPoints(exam);
    let globalQ = 0;

    const doPrint = () => window.print();

    return (
        <>
            {/* Print-specific CSS */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #exam-print-root, #exam-print-root * { visibility: visible !important; }
                    #exam-print-root { position: fixed; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                }
                .answer-line { border-bottom: 1px solid #555; margin-bottom: 8px; height: 22px; }
                .mc-option { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
                .mc-circle { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #333; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
            `}</style>

            {/* Controls (hidden when printing) */}
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#1e2940', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                <div style={{ flex: 1, color: 'white', fontWeight: 700, fontSize: 15 }}>🖨️ Print Preview — {exam.title}</div>
                <button onClick={doPrint} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                    🖨️ Print / Save PDF
                </button>
            </div>

            {/* A4 Paper */}
            <div style={{ paddingTop: 60, background: '#e2e8f0', minHeight: '100vh', paddingBottom: 60 }} className="no-print-bg">
                <div id="exam-print-root" style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: '48px 56px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', fontFamily: "'Times New Roman', Georgia, serif" }}>

                    {/* School header */}
                    <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Frania English School · Cambodia</div>
                        <div style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{exam.title || 'EXAM'}</div>
                        <div style={{ fontSize: 13 }}>
                            {exam.subject && <span style={{ marginRight: 24 }}>Subject: <strong>{exam.subject}</strong></span>}
                            {exam.cls && <span style={{ marginRight: 24 }}>Class: <strong>{exam.cls}</strong></span>}
                            {exam.date && <span style={{ marginRight: 24 }}>Date: <strong>{exam.date}</strong></span>}
                            {exam.duration > 0 && <span>Time: <strong>{exam.duration} minutes</strong></span>}
                        </div>
                    </div>

                    {/* Student info row */}
                    <div style={{ display: 'flex', gap: 32, marginBottom: 16, fontSize: 13 }}>
                        <div style={{ flex: 2 }}>Name: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', minWidth: 200 }}>&nbsp;</span></div>
                        <div style={{ flex: 1 }}>Score: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', minWidth: 60 }}>&nbsp;</span> / {totalPts}</div>
                    </div>

                    {/* Instructions */}
                    {exam.instructions && (
                        <div style={{ border: '1px solid #333', padding: '10px 14px', marginBottom: 20, fontSize: 13, background: '#fafafa' }}>
                            <strong>Instructions:</strong> {exam.instructions}
                        </div>
                    )}

                    {/* Sections */}
                    {exam.sections.map(sec => (
                        <div key={sec.id} style={{ marginBottom: 24 }}>
                            {/* Section title */}
                            <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', borderBottom: '1.5px solid #000', paddingBottom: 4, marginBottom: sec.instructions ? 4 : 14 }}>
                                {sec.title}
                            </div>
                            {sec.instructions && (
                                <div style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 12, color: '#333' }}>
                                    ({sec.instructions})
                                </div>
                            )}

                            {/* Questions */}
                            {sec.questions.map(q => {
                                globalQ++;
                                return (
                                    <div key={q.id} style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
                                        {/* Question text */}
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
                                            <span style={{ fontWeight: 700, minWidth: 24 }}>{globalQ}.</span>
                                            <span style={{ flex: 1 }}>{q.text || <em style={{ color: '#888' }}>(no question text)</em>}</span>
                                            <span style={{ fontSize: 11, color: '#555', flexShrink: 0, fontStyle: 'italic' }}>({q.points} pt{q.points !== 1 ? 's' : ''})</span>
                                        </div>

                                        {/* MC options */}
                                        {q.type === 'mc' && (
                                            <div style={{ marginLeft: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                                                {q.options.map(opt => (
                                                    <div key={opt.id} className="mc-option">
                                                        <span className="mc-circle">{opt.id}</span>
                                                        <span style={{ fontSize: 13 }}>{opt.text || `Option ${opt.id}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* True/False */}
                                        {q.type === 'tf' && (
                                            <div style={{ marginLeft: 32, display: 'flex', gap: 32, fontSize: 13 }}>
                                                <div className="mc-option"><span style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #333', marginRight: 6 }} />True</div>
                                                <div className="mc-option"><span style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #333', marginRight: 6 }} />False</div>
                                            </div>
                                        )}

                                        {/* Fill in the blank — already has _____ in question text */}
                                        {q.type === 'fill' && (
                                            <div style={{ marginLeft: 32, fontSize: 12, color: '#555', fontStyle: 'italic' }}>
                                                (Write the answer in the blank above.)
                                            </div>
                                        )}

                                        {/* Short / Essay answer lines */}
                                        {(q.type === 'short' || q.type === 'essay') && (
                                            <div style={{ marginLeft: 32, marginTop: 4 }}>
                                                {Array.from({ length: q.lines }).map((_, li) => (
                                                    <div key={li} className="answer-line" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Footer */}
                    <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1.5px solid #000', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                        <span>Frania English School — {exam.date}</span>
                        <span>Total: {totalPts} points</span>
                    </div>
                </div>
            </div>
        </>
    );
}
