import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { HOMEWORK, CLASSES } from '@/pages/admin/data';
import { KH, PBar, Badge } from '@/pages/admin/ui';

type Tab = 'list' | 'add';

export default function HomeworkPage() {
    const [tab, setTab] = useState<Tab>('list');
    const [saved, setSaved] = useState(false);

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {([{ id: 'list', l: 'Homework List' }, { id: 'add', l: '+ Assign New' }] as { id: Tab; l: string }[]).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', borderColor: tab === t.id ? '#3b82f6' : '#e2e8f0', background: tab === t.id ? '#eff6ff' : 'white', color: tab === t.id ? '#2563eb' : '#64748b' }}>
                            {t.l}
                        </button>
                    ))}
                </div>

                {tab === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {HOMEWORK.map(hw => (
                            <div key={hw.id} className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                    <div>
                                        <KH style={{ fontWeight: 700, fontSize: 16, display: 'block', marginBottom: 2 }}>{hw.titleKh}</KH>
                                        <div style={{ fontSize: 13, color: '#64748b' }}>{hw.titleEn}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{hw.cls} · Due {hw.due}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{hw.done}/{hw.total}</span>
                                        <Badge type={hw.done === hw.total ? 'green' : 'blue'}>submitted</Badge>
                                    </div>
                                </div>
                                <PBar value={hw.done} max={hw.total} color={hw.done / hw.total >= 0.8 ? 'green' : 'blue'} height={8} />
                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748b' }}>👁 View Submissions</button>
                                    <button style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>✏️ Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'add' && (
                    <div className="card" style={{ padding: 28, maxWidth: 560 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="f-group" style={{ gridColumn: '1/-1' }}><label className="f-label">Title (Khmer) *</label><input className="f-input" placeholder="ឧ. សរសេរអំពីគ្រួសារ" /></div>
                            <div className="f-group"><label className="f-label">Title (English)</label><input className="f-input" placeholder="e.g. Write about family" /></div>
                            <div className="f-group"><label className="f-label">Class *</label><select className="f-input">{CLASSES.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
                            <div className="f-group"><label className="f-label">Due Date *</label><input type="date" className="f-input" /></div>
                            <div className="f-group"><label className="f-label">Points</label><input type="number" className="f-input" defaultValue={100} /></div>
                            <div className="f-group" style={{ gridColumn: '1/-1' }}><label className="f-label">Instructions</label><textarea className="f-input" rows={3} placeholder="Additional instructions..." /></div>
                        </div>
                        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                            style={{ background: saved ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s', fontFamily: "'Noto Sans Khmer',sans-serif" }}>
                            {saved ? '✓ Assigned!' : '📝 ចែករំលែក / Assign Homework'}
                        </button>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
