import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, CLASSES, type Student, avg } from '@/pages/admin/data';
import { KH, Avatar, PBar, Badge, FeeTag, ScoreChip } from '@/pages/admin/ui';
import { toast } from 'sonner';

type View = 'list' | 'add' | 'edit';

export default function StudentsPage() {
    const [view, setView]           = useState<View>('list');
    const [search, setSearch]       = useState('');
    const [filter, setFilter]       = useState('all');
    const [selected, setSelected]   = useState<Student | null>(null);
    const [editing, setEditing]     = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [students, setStudents]   = useState<Student[]>(STUDENTS);

    const handleEdit = (s: Student) => { setEditing(s); setView('edit'); };
    const handleDelete = (s: Student) => setDeleteTarget(s);
    const confirmDelete = () => {
        if (deleteTarget) {
            setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
            if (selected?.id === deleteTarget.id) setSelected(null);
        }
        setDeleteTarget(null);
    };

    return (
        <AdminShell>
            {view === 'list' && (
                <StudentsList
                    students={students}
                    search={search} setSearch={setSearch}
                    filter={filter} setFilter={setFilter}
                    selected={selected} setSelected={setSelected}
                    onAdd={() => setView('add')}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            {view === 'add' && (
                <StudentForm mode="add" onBack={() => setView('list')} />
            )}
            {view === 'edit' && editing && (
                <StudentForm mode="edit" student={editing} onBack={() => setView('list')} />
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🗑️</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Student?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                Are you sure you want to remove{' '}
                                <KH style={{ fontWeight: 700, color: '#1e293b' }}>{deleteTarget.nameKh}</KH>
                                {' '}({deleteTarget.nameEn})? This action cannot be undone.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                Cancel
                            </button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

// ── Students list ──
interface ListProps {
    students: Student[];
    search: string; setSearch: (v: string) => void;
    filter: string; setFilter: (v: string) => void;
    selected: Student | null; setSelected: (s: Student | null) => void;
    onAdd: () => void;
    onEdit: (s: Student) => void;
    onDelete: (s: Student) => void;
}
function StudentsList({ students, search, setSearch, filter, setFilter, selected, setSelected, onAdd, onEdit, onDelete }: ListProps) {
    const filtered = students.filter(s => {
        const ms = !search || s.nameKh.includes(search) || s.nameEn.toLowerCase().includes(search.toLowerCase());
        const mf = filter === 'all'
            || (filter === 'atrisk' && (s.attendance < 70 || s.fees === 'Unpaid'))
            || s.level.toLowerCase().includes(filter.toLowerCase());
        return ms && mf;
    });

    return (
        <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} className="f-input"
                    style={{ maxWidth: 280 }} placeholder="🔍  ស្វែងរក / Search students..." />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[{ id: 'all', l: 'All' }, { id: 'Beginner', l: 'Beginner' }, { id: 'Intermediate', l: 'Intermediate' }, { id: 'Advanced', l: 'Advanced' }, { id: 'atrisk', l: '⚠ At-Risk' }].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: filter === f.id ? '#3b82f6' : '#e2e8f0', background: filter === f.id ? '#eff6ff' : 'white', color: filter === f.id ? '#2563eb' : '#64748b' }}>
                            {f.l}
                        </button>
                    ))}
                </div>
                <button onClick={onAdd} style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    + Add Student
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                    { l: 'Total',   v: students.length,                                                        c: '#3b82f6' },
                    { l: 'Paid',    v: students.filter(s => s.fees === 'Paid').length,                         c: '#10b981' },
                    { l: 'Unpaid',  v: students.filter(s => s.fees === 'Unpaid').length,                       c: '#ef4444' },
                    { l: 'At-Risk', v: students.filter(s => s.attendance < 70 || s.fees === 'Unpaid').length,  c: '#f59e0b' },
                ].map((st, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', border: '1px solid #e8edf5', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.c }} />
                        <span style={{ fontSize: 11, color: '#64748b' }}>{st.l}</span>
                        <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{st.v}</span>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>Student / សិស្ស</th><th>Level</th><th>Class</th><th>Attendance</th>
                        <th>Speaking</th><th>Listening</th><th>Reading</th><th>Writing</th>
                        <th>Fee</th><th>Province</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {filtered.map(s => (
                            <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(s === selected ? null : s)}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nameEn} size={34} /><div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div></div></td>
                                <td><Badge type="blue">{s.level}</Badge></td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{s.cls}</td>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} /><span style={{ fontSize: 12, fontWeight: 700, width: 36, flexShrink: 0, color: s.attendance >= 80 ? '#10b981' : '#ef4444' }}>{s.attendance}%</span></div></td>
                                <td><ScoreChip score={s.grade.speaking} /></td>
                                <td><ScoreChip score={s.grade.listening} /></td>
                                <td><ScoreChip score={s.grade.reading} /></td>
                                <td><ScoreChip score={s.grade.writing} /></td>
                                <td><FeeTag status={s.fees} /></td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{s.province}</td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => onEdit(s)}
                                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                            ✏️ Edit
                                        </button>
                                        <button onClick={() => onDelete(s)}
                                            style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail panel */}
            {selected && (
                <div className="card fade-in" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', flex: 1 }}>
                            <Avatar name={selected.nameEn} size={64} />
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 2 }}>{selected.nameKh}</KH>
                                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10 }}>{selected.nameEn} · {selected.level}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <Badge type="blue">{selected.level}</Badge>
                                    <FeeTag status={selected.fees} />
                                    {selected.attendance < 70 && <Badge type="red">⚠ Low Attendance</Badge>}
                                </div>
                            </div>
                        </div>
                        {/* Action buttons in detail panel */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => onEdit(selected)}
                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                ✏️ Edit
                            </button>
                            <button onClick={() => onDelete(selected)}
                                style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, minWidth: 240, marginBottom: 16 }}>
                        {[{ sk: 'Speaking', skKh: 'និយាយ', v: selected.grade.speaking }, { sk: 'Listening', skKh: 'ស្ដាប់', v: selected.grade.listening }, { sk: 'Reading', skKh: 'អាន', v: selected.grade.reading }, { sk: 'Writing', skKh: 'សរសេរ', v: selected.grade.writing }].map(skill => (
                            <div key={skill.sk} style={{ background: '#f8fafc', borderRadius: 10, padding: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <KH style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{skill.skKh}</KH>
                                    <ScoreChip score={skill.v} />
                                </div>
                                <PBar value={skill.v} color={skill.v >= 75 ? 'green' : skill.v >= 50 ? 'blue' : 'amber'} />
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '12px 0', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                        <span>📍 {selected.village}, {selected.province}</span>
                        <span>📋 Attendance: <strong style={{ color: selected.attendance >= 80 ? '#10b981' : '#ef4444' }}>{selected.attendance}%</strong></span>
                        <span>⭐ Avg Score: <strong>{avg(selected)}</strong></span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Add / Edit Student form ──
interface FormProps {
    mode: 'add' | 'edit';
    student?: Student;
    onBack: () => void;
}
function StudentForm({ mode, student, onBack }: FormProps) {
    const [step, setStep] = useState(1);
    const isEdit = mode === 'edit';

    const handleSave = () => {
        toast.success(isEdit ? 'Student updated successfully!' : 'Student added successfully!', {
            description: isEdit ? `${student?.nameEn} has been updated.` : 'New student has been enrolled.',
        });
        onBack();
    };

    return (
        <div className="fade-in" style={{ padding: 24 }}>
            <div className="card" style={{ padding: 28, maxWidth: 640, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {isEdit ? '✏️' : '➕'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>
                            {isEdit ? 'Edit Student' : 'Add New Student'}
                        </div>
                        {isEdit && student && (
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{student.nameEn}</div>
                        )}
                    </div>
                </div>

                {/* Steps indicator */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                    {[1, 2, 3].map((n, i) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= n ? '#2563eb' : '#f1f5f9', color: step >= n ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, transition: 'all 0.2s' }}>{n}</div>
                                <div style={{ fontSize: 10, color: step === n ? '#2563eb' : '#94a3b8', fontWeight: 700, fontFamily: "'Noto Sans Khmer',sans-serif", whiteSpace: 'nowrap' }}>{['ឈ្មោះ', 'ថ្នាក់', 'គ្រួសារ'][i]}</div>
                            </div>
                            {i < 2 && <div style={{ flex: 1, height: 2, background: step > n ? '#2563eb' : '#f1f5f9', margin: '0 8px', marginBottom: 20, transition: 'all 0.2s' }} />}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                            <div style={{ width: 88, height: 88, borderRadius: '50%', border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <div style={{ fontSize: 28 }}>📷</div>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Upload Photo</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="f-group"><label className="f-label">ឈ្មោះ (ខ្មែរ) *</label><input className="f-input" placeholder="ឧ. សុខ ដារា" defaultValue={student?.nameKh} /></div>
                            <div className="f-group"><label className="f-label">English Name *</label><input className="f-input" placeholder="e.g. Sokh Dara" defaultValue={student?.nameEn} /></div>
                            <div className="f-group"><label className="f-label">Date of Birth</label><input type="date" className="f-input" defaultValue="2012-01-01" /></div>
                            <div className="f-group"><label className="f-label">Gender / ភេទ</label><select className="f-input"><option>Male / ប្រុស</option><option>Female / ស្រី</option></select></div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="f-group"><label className="f-label">Level / កម្រិត *</label>
                                <select className="f-input" defaultValue={student?.level}>
                                    {['Beginner 1', 'Beginner 2', 'Intermediate 1', 'Intermediate 2', 'Advanced 1', 'Advanced 2'].map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="f-group"><label className="f-label">Class / ថ្នាក់ *</label>
                                <select className="f-input" defaultValue={student?.cls}>
                                    {CLASSES.map(c => <option key={c.id}>{c.name} ({c.time})</option>)}
                                </select>
                            </div>
                            <div className="f-group"><label className="f-label">Monthly Fee (USD)</label><input type="number" className="f-input" defaultValue={student?.amt ?? 25} /></div>
                            <div className="f-group"><label className="f-label">Scholarship</label><select className="f-input"><option>None</option><option>% Discount</option><option>Fixed $</option></select></div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="f-group"><label className="f-label">Province / ខេត្ត</label>
                                <select className="f-input" defaultValue={student?.province}>
                                    <option value="">Select...</option>
                                    {['Phnom Penh', 'Prey Veng', 'Kampong Cham', 'Kampong Thom', 'Kandal', 'Siem Reap'].map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="f-group"><label className="f-label">District / ស្រុក</label><input className="f-input" placeholder="District name..." /></div>
                            <div className="f-group"><label className="f-label">Commune / ឃុំ</label><input className="f-input" placeholder="Commune name..." /></div>
                            <div className="f-group"><label className="f-label">Village / ភូមិ</label><input className="f-input" placeholder="Village name..." defaultValue={student?.village} /></div>
                            <div className="f-group"><label className="f-label">Parent Phone / ទូរស័ព្ទ</label><input type="tel" className="f-input" placeholder="0xx-xxx-xxx" /></div>
                            <div className="f-group"><label className="f-label">Telegram Username</label><input className="f-input" placeholder="@username" /></div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>← Cancel</button>
                    {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer' }}>← Back</button>}
                    {step < 3
                        ? <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>បន្ត → Next</button>
                        : <button onClick={handleSave} style={{ flex: 2, background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                            {isEdit ? '✓ Update Student' : '✓ រក្សាទុក / Save'}
                          </button>
                    }
                </div>
            </div>
        </div>
    );
}
