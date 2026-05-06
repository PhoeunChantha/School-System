import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, avg } from '@/pages/admin/data';
import { KH, Avatar, Badge, PBar, ScoreChip } from '@/pages/admin/ui';
import { toast } from 'sonner';

interface CertType {
    id: string;
    labelKh: string;
    label: string;
    icon: string;
    minAvg: number;
    minAttendance: number;
    color: string;
    bg: string;
}

const CERT_TYPES: CertType[] = [
    { id: 'excellence', labelKh: 'កិត្តិយស',    label: 'Academic Excellence', icon: '🥇', minAvg: 85, minAttendance: 90, color: '#d97706', bg: '#fffbeb' },
    { id: 'merit',      labelKh: 'ល្អប្រសើរ',   label: 'Merit Award',         icon: '🥈', minAvg: 75, minAttendance: 80, color: '#2563eb', bg: '#eff6ff' },
    { id: 'completion', labelKh: 'បញ្ចប់ថ្នាក់', label: 'Course Completion',   icon: '🏆', minAvg: 60, minAttendance: 70, color: '#7c3aed', bg: '#f5f3ff' },
];

function getCertType(student: typeof STUDENTS[0]): CertType | null {
    const a = avg(student);
    for (const ct of CERT_TYPES) {
        if (a >= ct.minAvg && student.attendance >= ct.minAttendance) return ct;
    }
    return null;
}

export default function CertificatesPage() {
    const [filter, setFilter]     = useState<string>('all');
    const [preview, setPreview]   = useState<typeof STUDENTS[0] | null>(null);

    const qualifiedStudents = STUDENTS.map(s => ({ student: s, cert: getCertType(s) }))
        .filter(({ cert }) => cert !== null);

    const displayed = filter === 'all'
        ? qualifiedStudents
        : qualifiedStudents.filter(({ cert }) => cert?.id === filter);

    const handleGenerate = (s: typeof STUDENTS[0], certLabel: string) => {
        toast.success(`Certificate generated!`, { description: `${s.nameEn} — ${certLabel}` });
    };

    const handlePrintAll = () => {
        toast.success('Printing all certificates…', { description: `${qualifiedStudents.length} certificates queued.` });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>🏆 Certificates</div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>វិញ្ញាបនបត្រ · {qualifiedStudents.length} students qualify</KH>
                    </div>
                    <button onClick={handlePrintAll}
                        style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        🖨️ Print All Certificates
                    </button>
                </div>

                {/* Cert type summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                    {CERT_TYPES.map(ct => {
                        const count = qualifiedStudents.filter(({ cert }) => cert?.id === ct.id).length;
                        return (
                            <div key={ct.id} style={{ background: ct.bg, borderRadius: 14, padding: 18, border: `1px solid ${ct.color}30`, cursor: 'pointer' }}
                                onClick={() => setFilter(filter === ct.id ? 'all' : ct.id)}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{ct.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: ct.color, marginBottom: 2 }}>{count}</div>
                                <KH style={{ fontSize: 12, color: ct.color, display: 'block', fontWeight: 700 }}>{ct.labelKh}</KH>
                                <div style={{ fontSize: 11, color: ct.color, opacity: 0.7 }}>{ct.label}</div>
                                <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>≥{ct.minAvg} avg · ≥{ct.minAttendance}% attend</div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ id: 'all', label: `All (${qualifiedStudents.length})` }, ...CERT_TYPES.map(ct => ({ id: ct.id, label: `${ct.icon} ${ct.label}` }))].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderColor: filter === f.id ? '#3b82f6' : '#e2e8f0', background: filter === f.id ? '#eff6ff' : 'white', color: filter === f.id ? '#2563eb' : '#64748b' }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Student cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                    {displayed.map(({ student: s, cert }) => cert && (
                        <div key={s.id} className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <Avatar name={s.nameEn} size={48} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <KH style={{ fontWeight: 800, fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.nameEn}</div>
                                    <Badge type="blue">{s.level}</Badge>
                                </div>
                                <div style={{ fontSize: 28, flexShrink: 0 }}>{cert.icon}</div>
                            </div>

                            <div style={{ background: cert.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                                <KH style={{ fontWeight: 700, fontSize: 12, color: cert.color, display: 'block' }}>{cert.labelKh}</KH>
                                <div style={{ fontSize: 11, color: cert.color }}>{cert.label}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: avg(s) >= 75 ? '#10b981' : '#3b82f6' }}>{avg(s)}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Avg Score</div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: s.attendance >= 80 ? '#10b981' : '#f59e0b' }}>{s.attendance}%</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Attendance</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPreview(s)}
                                    style={{ flex: 1, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                    👁 Preview
                                </button>
                                <button onClick={() => handleGenerate(s, cert.label)}
                                    style={{ flex: 1, background: cert.bg, color: cert.color, border: `1px solid ${cert.color}40`, borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                    🖨️ Print
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {displayed.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>No students match this filter</div>
                    </div>
                )}
            </div>

            {/* Preview modal */}
            {preview && (() => {
                const cert = getCertType(preview);
                return cert && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                        onClick={e => { if (e.target === e.currentTarget) setPreview(null); }}>
                        <div style={{ background: 'white', borderRadius: 20, padding: 0, maxWidth: 560, width: '100%', overflow: 'hidden' }}>
                            {/* Certificate preview */}
                            <div style={{ background: 'linear-gradient(135deg,#1e2940,#2563eb)', padding: '32px 40px', textAlign: 'center', color: 'white' }}>
                                <div style={{ fontSize: 48, marginBottom: 8 }}>{cert.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Certificate of {cert.label}</div>
                                <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>This certifies that</div>
                                <KH style={{ fontSize: 28, fontWeight: 800, display: 'block', marginBottom: 4 }}>{preview.nameKh}</KH>
                                <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 20 }}>{preview.nameEn}</div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>has successfully completed <strong>{preview.level}</strong></div>
                                <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Frania English School · May 2026</div>
                            </div>
                            <div style={{ padding: 24, display: 'flex', gap: 10 }}>
                                <button onClick={() => setPreview(null)}
                                    style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
                                <button onClick={() => { handleGenerate(preview, cert.label); setPreview(null); }}
                                    style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer' }}>🖨️ Print Certificate</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AdminShell>
    );
}
