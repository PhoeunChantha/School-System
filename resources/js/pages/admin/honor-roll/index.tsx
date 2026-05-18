import { useState } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, CLASSES, avg, type Student } from '@/pages/admin/data';
import { KH, Avatar, AdminSelect } from '@/pages/admin/ui';
import { Printer, Trophy } from 'lucide-react';

// â”€â”€ Medal config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MEDALS = [
    {
        rank: 1,
        outerA: '#fde68a', outerB: '#f59e0b', outerC: '#d97706',
        innerBg: '#fffbeb', badgeBg: 'linear-gradient(135deg,#fbbf24,#d97706)',
        glow: 'rgba(245,158,11,0.55)', size: 138, nameColor: '#92400e',
        star: '*',
    },
    {
        rank: 2,
        outerA: '#f1f5f9', outerB: '#cbd5e1', outerC: '#94a3b8',
        innerBg: '#f8fafc', badgeBg: 'linear-gradient(135deg,#e2e8f0,#64748b)',
        glow: 'rgba(100,116,139,0.45)', size: 110, nameColor: '#334155',
        star: '*',
    },
    {
        rank: 3,
        outerA: '#fef3c7', outerB: '#d97706', outerC: '#92400e',
        innerBg: '#fef9ee', badgeBg: 'linear-gradient(135deg,#fcd34d,#92400e)',
        glow: 'rgba(180,83,9,0.45)', size: 110, nameColor: '#78350f',
        star: '*',
    },
    {
        rank: 4,
        outerA: '#dbeafe', outerB: '#3b82f6', outerC: '#1d4ed8',
        innerBg: '#eff6ff', badgeBg: 'linear-gradient(135deg,#93c5fd,#1d4ed8)',
        glow: 'rgba(59,130,246,0.4)', size: 94, nameColor: '#1e40af',
        star: '',
    },
    {
        rank: 5,
        outerA: '#ede9fe', outerB: '#8b5cf6', outerC: '#5b21b6',
        innerBg: '#f5f3ff', badgeBg: 'linear-gradient(135deg,#c4b5fd,#5b21b6)',
        glow: 'rgba(124,58,237,0.4)', size: 94, nameColor: '#4c1d95',
        star: '',
    },
] as const;

function getTopStudents(className: string): Student[] {
    const list = className === 'all'
        ? STUDENTS
        : STUDENTS.filter(s => s.cls === className);
    return [...list].sort((a, b) => avg(b) - avg(a)).slice(0, 5);
}

// â”€â”€ Decorative star divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StarDivider({ color = '#d97706' }: { color?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            {['-','*','-','*','-','*','-'].map((c, i) => (
                <span key={i} style={{ color, fontSize: c === '*' ? 16 : 11, fontWeight: 700,
                    fontFamily: "'Cinzel',serif" }}>{c}</span>
            ))}
        </div>
    );
}

// â”€â”€ Student frame â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StudentFrame({ student, medal, delay = 0 }: {
    student: Student;
    medal: typeof MEDALS[number];
    delay?: number;
}) {
    const ringGrad = `linear-gradient(135deg, ${medal.outerA}, ${medal.outerB}, ${medal.outerC}, ${medal.outerA})`;
    const isFirst  = medal.rank === 1;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            animation: `honorFadeUp 0.55s cubic-bezier(.34,1.26,.64,1) ${delay}s both`,
        }}>
            {/* Outer container */}
            <div style={{ position: 'relative' }}>
                {/* Ambient glow */}
                <div style={{
                    position: 'absolute', inset: -12, borderRadius: '50%',
                    background: `radial-gradient(circle, ${medal.glow} 0%, transparent 68%)`,
                    pointerEvents: 'none',
                }} />

                {/* Ring layer 1 â€” outer gold ring */}
                <div style={{
                    padding: 5, borderRadius: '50%',
                    background: ringGrad,
                    boxShadow: `0 8px 28px ${medal.glow}, 0 0 0 1.5px rgba(255,255,255,0.5)`,
                }}>
                    {/* Ring layer 2 â€” white gap */}
                    <div style={{ padding: 4, borderRadius: '50%', background: medal.innerBg }}>
                        {/* Ring layer 3 â€” inner gold ring */}
                        <div style={{ padding: 3, borderRadius: '50%', background: ringGrad }}>
                            {/* Avatar */}
                            <Avatar name={student.nameEn} size={medal.size} />
                        </div>
                    </div>
                </div>

                {/* Rank badge */}
                <div style={{
                    position: 'absolute', bottom: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: isFirst ? 36 : 30, height: isFirst ? 36 : 30,
                    borderRadius: '50%',
                    background: medal.badgeBg,
                    border: `3px solid white`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: isFirst ? 16 : 13,
                    color: 'white', zIndex: 10,
                    boxShadow: `0 3px 10px ${medal.glow}`,
                    fontFamily: "'Cinzel',serif",
                }}>
                    {medal.rank}
                </div>
            </div>

            {/* Name block */}
            <div style={{ textAlign: 'center', maxWidth: isFirst ? 160 : 130 }}>
                <KH style={{
                    display: 'block', fontWeight: 800,
                    fontSize: isFirst ? 14 : 12, color: medal.nameColor,
                    textShadow: '0 1px 3px rgba(255,255,255,0.9)',
                    lineHeight: 1.3,
                }}>
                    {student.nameKh}
                </KH>
                <div style={{
                    fontSize: isFirst ? 11 : 9.5, color: '#475569',
                    fontFamily: "'Cinzel','Plus Jakarta Sans',serif",
                    fontWeight: 700, letterSpacing: '0.06em', marginTop: 2,
                }}>
                    {student.nameEn.toUpperCase()}
                </div>
                <div style={{
                    display: 'inline-block', marginTop: 5, padding: '2px 10px',
                    borderRadius: 99, fontSize: isFirst ? 12 : 10,
                    fontWeight: 800, color: 'white',
                    background: medal.badgeBg,
                    boxShadow: `0 2px 6px ${medal.glow}`,
                }}>
                    {avg(student)} pts
                </div>
            </div>
        </div>
    );
}

// â”€â”€ Certificate poster â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HonorRollPoster({ className, term, students }: {
    className: string; term: string; students: Student[];
}) {
    const classLabel = (className === 'all' ? 'All Classes' : className).toUpperCase();
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div id="honor-poster" style={{
            width: 740, margin: '0 auto',
            background: `
                repeating-linear-gradient(-52deg, transparent, transparent 22px, rgba(37,99,235,0.045) 22px, rgba(37,99,235,0.045) 23px),
                linear-gradient(175deg, #bfdbfe 0%, #e0f2fe 28%, #f0f9ff 55%, #dbeafe 100%)
            `,
            borderRadius: 14,
            boxShadow: `
                inset 0 0 0 4px #1d4ed8,
                inset 0 0 0 7px rgba(224,242,254,0.95),
                inset 0 0 0 11px #2563eb,
                inset 0 0 0 14px rgba(224,242,254,0.85),
                inset 0 0 0 17px #1e40af,
                0 24px 64px rgba(0,0,0,0.18)
            `,
            padding: '36px 52px 44px',
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Cinzel','Noto Sans Khmer',serif",
        }}>
            {/* Watermark */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%) rotate(-15deg)',
                fontSize: 260, fontWeight: 900,
                color: 'rgba(37,99,235,0.055)',
                fontFamily: "'Cinzel',serif",
                userSelect: 'none', pointerEvents: 'none',
                lineHeight: 1, zIndex: 0, letterSpacing: '-0.06em',
            }}>FS</div>

            {/* Corner ornaments */}
            {[
                { top: 24, left: 24 }, { top: 24, right: 24 },
                { bottom: 24, left: 24 }, { bottom: 24, right: 24 },
            ].map((pos, i) => (
                <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 24, height: 24, zIndex: 2,
                    borderTop: i < 2 ? '3px solid #d97706' : 'none',
                    borderBottom: i >= 2 ? '3px solid #d97706' : 'none',
                    borderLeft: i % 2 === 0 ? '3px solid #d97706' : 'none',
                    borderRight: i % 2 === 1 ? '3px solid #d97706' : 'none',
                }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* â”€â”€ Cambodia header â”€â”€ */}
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{
                        fontSize: 12, fontWeight: 700, color: '#1e3a8a',
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                    }}>
                        Kingdom of Cambodia
                    </div>
                    <div style={{
                        fontSize: 11, color: '#1e3a8a', letterSpacing: '0.08em',
                        fontStyle: 'italic', marginTop: 3, opacity: 0.85,
                    }}>
                        Nation - Religion - King
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        margin: '10px 0 0',
                    }}>
                        <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, transparent, #d97706)' }} />
                        <span style={{ color: '#d97706', fontSize: 16 }}>*</span>
                        <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #d97706, transparent)' }} />
                    </div>
                </div>

                {/* â”€â”€ Main title â”€â”€ */}
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <h1 style={{
                        fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 38,
                        color: '#d97706', margin: 0, lineHeight: 1.1,
                        textShadow: '0 3px 10px rgba(217,119,6,0.28), 1px 1px 0 rgba(255,255,255,0.6)',
                        letterSpacing: '0.05em',
                    }}>
                        HONOR ROLL CHART
                    </h1>
                    <div style={{
                        fontSize: 15, fontWeight: 700, color: '#1e3a8a',
                        letterSpacing: '0.16em', marginTop: 6,
                        fontFamily: "'Cinzel',serif",
                    }}>
                        FOR OUTSTANDING STUDENTS
                    </div>
                </div>

                {/* â”€â”€ Term + class â”€â”€ */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{
                        fontSize: 16, fontWeight: 700, color: '#1e293b',
                        fontFamily: "'Cinzel',serif", letterSpacing: '0.05em',
                        marginBottom: 6,
                    }}>
                        {term}
                    </div>
                    <div style={{
                        display: 'inline-block', fontSize: 12, fontWeight: 700,
                        color: '#1e3a8a', letterSpacing: '0.12em',
                        background: 'rgba(30,58,138,0.09)',
                        padding: '5px 20px', borderRadius: 99,
                        border: '1.5px solid rgba(30,58,138,0.18)',
                    }}>
                        CLASS: {classLabel}
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <StarDivider />
                </div>

                {/* â”€â”€ Students layout â”€â”€ */}
                {students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: 13 }}>
                        No students enrolled in this class.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                        {/* 1st */}
                        {students[0] && (
                            <StudentFrame student={students[0]} medal={MEDALS[0]} delay={0.05} />
                        )}
                        {/* 2nd & 3rd */}
                        {(students[1] || students[2]) && (
                            <div style={{ display: 'flex', gap: 72, justifyContent: 'center', width: '100%', alignItems: 'flex-start' }}>
                                {students[1] ? <StudentFrame student={students[1]} medal={MEDALS[1]} delay={0.15} /> : <div style={{ width: 130 }} />}
                                {students[2] ? <StudentFrame student={students[2]} medal={MEDALS[2]} delay={0.25} /> : <div style={{ width: 130 }} />}
                            </div>
                        )}
                        {/* 4th & 5th */}
                        {(students[3] || students[4]) && (
                            <div style={{ display: 'flex', gap: 72, justifyContent: 'center', width: '100%', alignItems: 'flex-start' }}>
                                {students[3] ? <StudentFrame student={students[3]} medal={MEDALS[3]} delay={0.35} /> : <div style={{ width: 110 }} />}
                                {students[4] ? <StudentFrame student={students[4]} medal={MEDALS[4]} delay={0.45} /> : <div style={{ width: 110 }} />}
                            </div>
                        )}
                    </div>
                )}

                {/* â”€â”€ Footer â”€â”€ */}
                <div style={{ marginTop: 32 }}>
                    <div style={{
                        height: 2, marginBottom: 12,
                        background: 'linear-gradient(90deg, transparent 0%, #2563eb 20%, #d97706 50%, #2563eb 80%, transparent 100%)',
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 11, color: '#475569', letterSpacing: '0.14em',
                            fontFamily: "'Cinzel',serif", fontWeight: 700,
                        }}>
                            FRANIA ENGLISH SCHOOL &nbsp;-&nbsp; CAMBODIA
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, letterSpacing: '0.04em' }}>
                            {today}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function HonorRollPage() {
    const [selClass, setSelClass] = useState(CLASSES[0].name);
    const [term,     setTerm]     = useState('Midterm 2026');

    const topStudents = getTopStudents(selClass);

    return (
        <AdminShell>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');

                @keyframes honorFadeUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.92); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); }
                }

                @media print {
                    .no-print { display: none !important; }
                    body, html { background: white !important; margin: 0 !important; }
                    #honor-poster {
                        width: 720px !important; border-radius: 0 !important;
                        box-shadow: none !important; margin: 0 auto !important;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* â”€â”€ Controls â”€â”€ */}
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Trophy size={20} color="#d97706" />
                            Honor Roll Chart
                        </div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>
                            តារាងកិត្តិយស - Outstanding Students
                        </KH>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            className="f-input"
                            placeholder="Term name..."
                            style={{ width: 170, padding: '8px 12px', fontSize: 13 }}
                        />
                        <AdminSelect
                            value={selClass}
                            onChange={setSelClass}
                            options={CLASSES.map(c => ({ value: c.name, label: c.name }))}
                            style={{ minWidth: 150 }}
                        />
                        <button
                            onClick={() => window.print()}
                            style={{ background: '#1e2940', color: 'white', border: 'none', borderRadius: 10, padding: '9px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Printer size={14} /> Print
                        </button>
                    </div>
                </div>

                {/* â”€â”€ Poster â”€â”€ */}
                <HonorRollPoster className={selClass} term={term} students={topStudents} />
            </div>
        </AdminShell>
    );
}



