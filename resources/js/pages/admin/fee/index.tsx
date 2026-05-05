import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, PAYMENTS, type Student } from '@/pages/admin/data';
import { KH, Avatar, Badge, FeeTag } from '@/pages/admin/ui';

export default function FeePage() {
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState<Student | null>(null);
    const [method, setMethod] = useState('ABA');
    const [step, setStep] = useState(1);
    const [done, setDone] = useState(false);
    const [screenshot, setScreenshot] = useState(false);

    const filtered = filter === 'all' ? STUDENTS : STUDENTS.filter(s =>
        filter === 'paid' ? s.fees === 'Paid' : filter === 'unpaid' ? s.fees === 'Unpaid' : s.fees === 'Partial'
    );
    const totalCollected = PAYMENTS.filter(p => p.status === 'verified').reduce((a, p) => a + p.amount, 0);

    const openModal = (s: Student) => { setShowModal(s); setStep(1); setDone(false); setScreenshot(false); };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                    {[
                        { lk: 'ប្រមូលបាន', l: 'Collected',    v: `$${totalCollected}`,                              c: '#10b981', bg: '#f0fdf4' },
                        { lk: 'នៅខ្វះ',    l: 'Outstanding',  v: '$450',                                            c: '#f59e0b', bg: '#fffbeb' },
                        { lk: 'ក្បាលគ្រប',  l: 'Paid Count',   v: STUDENTS.filter(s => s.fees === 'Paid').length,   c: '#3b82f6', bg: '#eff6ff' },
                        { lk: 'មិនទាន់',   l: 'Unpaid Count', v: STUDENTS.filter(s => s.fees === 'Unpaid').length,  c: '#ef4444', bg: '#fff1f2' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, borderRadius: 14, padding: 16, border: `1px solid ${s.c}30` }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: s.c, marginBottom: 2 }}>{s.v}</div>
                            <KH style={{ fontSize: 12, color: s.c, display: 'block', opacity: 0.8 }}>{s.lk}</KH>
                            <div style={{ fontSize: 11, color: s.c, opacity: 0.6 }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Student fee table */}
                <div className="card">
                    <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        {[{ id: 'all', l: 'All' }, { id: 'paid', l: 'Paid ✓' }, { id: 'unpaid', l: 'Unpaid ✗' }, { id: 'partial', l: 'Partial ~' }].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: filter === f.id ? '#3b82f6' : '#e2e8f0', background: filter === f.id ? '#eff6ff' : 'white', color: filter === f.id ? '#2563eb' : '#64748b' }}>
                                {f.l}
                            </button>
                        ))}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Level</th><th>Amount</th><th>Status</th><th>Month</th><th>Action</th></tr></thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nameEn} size={32} /><div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div></div></td>
                                        <td><Badge type="blue">{s.level}</Badge></td>
                                        <td><span style={{ fontWeight: 700 }}>${s.amt}</span></td>
                                        <td><FeeTag status={s.fees} /></td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>May 2026</td>
                                        <td>{s.fees !== 'Paid' && <button onClick={() => openModal(s)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ Record</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment history */}
                <div className="card" style={{ padding: 20 }}>
                    <KH style={{ fontWeight: 800, fontSize: 15, display: 'block', marginBottom: 12 }}>ប្រវត្តិការទូទាត់</KH>
                    <table className="data-table">
                        <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {PAYMENTS.map(p => (
                                <tr key={p.id}>
                                    <td><KH style={{ fontWeight: 700, fontSize: 13 }}>{p.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{p.nameEn}</div></td>
                                    <td><span style={{ fontWeight: 700 }}>${p.amount}</span></td>
                                    <td><Badge type="blue">{p.method}</Badge></td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{p.date}</td>
                                    <td><Badge type={p.status === 'verified' ? 'green' : p.status === 'pending' ? 'amber' : 'blue'}>{p.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payment Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(null); }}>
                        <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
                            {!done ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div><KH style={{ fontWeight: 800, fontSize: 18, display: 'block' }}>ទទួលការទូទាត់</KH><div style={{ fontSize: 13, color: '#94a3b8' }}>Record Payment · {showModal.nameEn}</div></div>
                                        <button onClick={() => setShowModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#64748b' }}>✕</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                                        <Avatar name={showModal.nameEn} size={44} />
                                        <div style={{ flex: 1 }}><KH style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>{showModal.nameKh}</KH><div style={{ fontSize: 12, color: '#64748b' }}>{showModal.level}</div></div>
                                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 22, fontWeight: 800 }}>${showModal.amt}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Due</div></div>
                                    </div>

                                    {step === 1 && (
                                        <div>
                                            <div className="f-label" style={{ marginBottom: 10 }}>Payment Method</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                                {[{ id: 'ABA', c: '#ef4444' }, { id: 'ACLEDA', c: '#2563eb' }, { id: 'Wing', c: '#f59e0b' }, { id: 'Cash', c: '#10b981' }].map(m => (
                                                    <button key={m.id} onClick={() => setMethod(m.id)}
                                                        style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${method === m.id ? m.c : '#e2e8f0'}`, background: method === m.id ? m.c + '15' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: method === m.id ? m.c : '#64748b', transition: 'all 0.15s' }}>
                                                        {m.id}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={() => setStep(2)} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>បន្ត → Next</button>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div>
                                            <div className="f-group"><label className="f-label">Amount (USD)</label><input type="number" className="f-input" defaultValue={showModal.amt} /></div>
                                            <div className="f-group"><label className="f-label">Month</label><select className="f-input"><option>May 2026</option><option>June 2026</option></select></div>
                                            {method !== 'Cash' && (
                                                <div className="f-group">
                                                    <label className="f-label">Payment Screenshot</label>
                                                    <div onClick={() => setScreenshot(true)} style={{ border: `2px dashed ${screenshot ? '#10b981' : '#cbd5e1'}`, borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: screenshot ? '#f0fdf4' : '#f8fafc', transition: 'all 0.2s' }}>
                                                        {screenshot ? <><div style={{ fontSize: 32, marginBottom: 6 }}>✅</div><KH style={{ fontWeight: 700, color: '#16a34a', display: 'block' }}>បានបន្ថែម</KH></> : <><div style={{ fontSize: 32, marginBottom: 6 }}>📱</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Upload payment screenshot</div></>}
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                <button onClick={() => setStep(1)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                                                <button onClick={() => setDone(true)} style={{ flex: 2, background: '#10b981', color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans Khmer',sans-serif" }}>✓ Confirm Payment</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                                    <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 4 }}>រួចរាល់!</KH>
                                    <div style={{ color: '#64748b', marginBottom: 20 }}>Payment recorded successfully</div>
                                    <button onClick={() => setShowModal(null)} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
