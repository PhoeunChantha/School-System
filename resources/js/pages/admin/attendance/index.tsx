import { useState, useMemo } from 'react';
import AdminShell from '@/pages/admin/shell';
import { STUDENTS, CLASSES } from '@/pages/admin/data';
import { KH, Avatar, Badge, PBar } from '@/pages/admin/ui';
import { toast } from 'sonner';

type AttStatus = 'present' | 'absent' | 'unmarked';
type PageTab   = 'mark' | 'history';
type QuickRange = 'yesterday' | 'week' | 'month' | 'lastmonth' | 'custom';

// ── Deterministic historical attendance ───────────────────
// Produces a stable present/absent for any (studentId, dateString) pair,
// biased by the student's overall attendance rate.
function historicalStatus(studentId: number, dateStr: string): 'present' | 'absent' {
    const student = STUDENTS.find(s => s.id === studentId)!;
    const n = parseInt(dateStr.replace(/-/g, ''), 10);
    const hash = Math.abs((studentId * 1_009 + n * 37) % 100);
    return hash < student.attendance ? 'present' : 'absent';
}

// ── Produce school-day dates (Mon–Sat) in a range ────────
function schoolDays(from: Date, to: Date): string[] {
    const days: string[] = [];
    const cur = new Date(from);
    const TODAY = new Date('2026-05-06');
    while (cur <= to && cur < TODAY) {
        if (cur.getDay() !== 0) { // skip Sundays
            days.push(cur.toISOString().slice(0, 10));
        }
        cur.setDate(cur.getDate() + 1);
    }
    return days;
}

const TODAY      = new Date('2026-05-06');
const YESTERDAY  = new Date('2026-05-05');
const WEEK_START = new Date('2026-04-30');   // last 7 school days
const MONTH_START = new Date('2026-05-01');  // this month so far
const LAST_MONTH_START = new Date('2026-04-01');
const LAST_MONTH_END   = new Date('2026-04-30');

function rangeFor(q: QuickRange, custom: string): [Date, Date] {
    if (q === 'yesterday')  return [YESTERDAY, YESTERDAY];
    if (q === 'week')       return [WEEK_START, YESTERDAY];
    if (q === 'month')      return [MONTH_START, YESTERDAY];
    if (q === 'lastmonth')  return [LAST_MONTH_START, LAST_MONTH_END];
    const d = custom ? new Date(custom) : YESTERDAY;
    return [d, d];
}

function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────
export default function AttendancePage() {
    const [tab, setTab]           = useState<PageTab>('mark');

    // ── Mark tab state ────────────────────────────────────
    const [selClass, setSelClass] = useState(0);
    const [statuses, setStatuses] = useState<Record<number, AttStatus>>({});
    const [saved, setSaved]       = useState(false);

    const toggle = (id: number) =>
        setStatuses(p => ({ ...p, [id]: p[id] === 'present' ? 'absent' : p[id] === 'absent' ? 'unmarked' : 'present' }));
    const markAll = () => {
        const a: Record<number, AttStatus> = {};
        STUDENTS.forEach(s => { a[s.id] = 'present'; });
        setStatuses(a);
    };
    const save = () => {
        setSaved(true);
        toast.success('Attendance saved!', { description: 'May 06, 2026' });
        setTimeout(() => setSaved(false), 2500);
    };

    const present = Object.values(statuses).filter(v => v === 'present').length;
    const absent  = Object.values(statuses).filter(v => v === 'absent').length;

    // ── History tab state ─────────────────────────────────
    const [quick, setQuick]       = useState<QuickRange>('yesterday');
    const [customDate, setCustomDate] = useState('');
    const [histClass, setHistClass]   = useState<string>('all');
    const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

    const [from, to] = rangeFor(quick, customDate);
    const days = useMemo(() => schoolDays(from, to), [from.toISOString(), to.toISOString()]);
    const isSingleDay = days.length <= 1;

    const histStudents = histClass === 'all'
        ? STUDENTS
        : STUDENTS.filter(s => s.cls === histClass);

    // Build per-student summary for the selected period
    const studentSummaries = useMemo(() => histStudents.map(s => {
        const records = days.map(d => ({ date: d, status: historicalStatus(s.id, d) }));
        const presentCount = records.filter(r => r.status === 'present').length;
        const absentCount  = records.length - presentCount;
        const rate         = days.length ? Math.round((presentCount / days.length) * 100) : 0;
        return { student: s, records, presentCount, absentCount, rate };
    }), [histStudents, days]);

    // ── Quick date label helper ───────────────────────────
    const rangeLabel = (() => {
        if (quick === 'yesterday')  return 'Yesterday · May 05, 2026';
        if (quick === 'week')       return 'Last 7 Days · Apr 30 – May 05';
        if (quick === 'month')      return 'This Month · May 1–5, 2026';
        if (quick === 'lastmonth')  return 'Last Month · April 2026';
        if (quick === 'custom' && customDate) return `Custom · ${fmtDate(new Date(customDate))}`;
        return 'Select a date';
    })();

    const QUICK_BTNS: { id: QuickRange; label: string }[] = [
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'week',      label: 'Last 7 Days' },
        { id: 'month',     label: 'This Month' },
        { id: 'lastmonth', label: 'Last Month' },
        { id: 'custom',    label: 'Custom Date' },
    ];

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Page tabs ── */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {([
                        { id: 'mark',    label: '✏️ Mark Attendance',    sub: 'Today · May 06, 2026' },
                        { id: 'history', label: '📅 Attendance History',  sub: 'View past records' },
                    ] as const).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 18px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s', borderColor: tab === t.id ? '#3b82f6' : '#e2e8f0', background: tab === t.id ? '#eff6ff' : 'white', textAlign: 'left' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: tab === t.id ? '#2563eb' : '#374151' }}>{t.label}</span>
                            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{t.sub}</span>
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════
                    MARK ATTENDANCE TAB
                ══════════════════════════════════════════════════ */}
                {tab === 'mark' && (
                    <>
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <KH style={{ fontWeight: 800, fontSize: 16, display: 'block' }}>គ្រប់គ្រងវត្តមាន</KH>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Attendance · May 06, 2026 (Today)</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {CLASSES.map((cls, i) => (
                                        <button key={i} onClick={() => setSelClass(i)}
                                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: selClass === i ? '#3b82f6' : '#e2e8f0', background: selClass === i ? '#eff6ff' : 'white', color: selClass === i ? '#2563eb' : '#64748b' }}>
                                            {cls.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Present: {present}</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Absent: {absent}</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#e2e8f0' }} /><span style={{ fontSize: 13, color: '#94a3b8' }}>Unmarked: {STUDENTS.length - present - absent}</span></div>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <button onClick={markAll} style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Mark All Present</button>
                                    <button onClick={save} style={{ background: saved ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }}>
                                        {saved ? '✓ Saved!' : '💾 Save'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                            {STUDENTS.map(s => {
                                const st = statuses[s.id] ?? 'unmarked';
                                const bg = st === 'present' ? '#f0fdf4' : st === 'absent' ? '#fff1f2' : 'white';
                                const border = st === 'present' ? '#86efac' : st === 'absent' ? '#fca5a5' : '#e8edf5';
                                return (
                                    <div key={s.id} onClick={() => toggle(s.id)}
                                        style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: 14, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar name={s.nameEn} size={40} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameKh}</KH>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn} · {s.level}</div>
                                            {s.attendance < 70 && <Badge type="amber">⚠ Low ({s.attendance}%)</Badge>}
                                        </div>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: st === 'present' ? '#10b981' : st === 'absent' ? '#ef4444' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: st !== 'unmarked' ? 'white' : '#cbd5e1', transition: 'all 0.15s', flexShrink: 0 }}>
                                            {st === 'present' ? '✓' : st === 'absent' ? '✗' : '·'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    HISTORY TAB
                ══════════════════════════════════════════════════ */}
                {tab === 'history' && (
                    <>
                        {/* Filters */}
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>ប្រវត្តិវត្តមាន</KH>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{rangeLabel} · {days.length} school day{days.length !== 1 ? 's' : ''}</div>
                                </div>
                                {/* Class filter */}
                                <select value={histClass} onChange={e => setHistClass(e.target.value)}
                                    className="f-input" style={{ width: 'auto', padding: '7px 12px', fontSize: 12, fontWeight: 700 }}>
                                    <option value="all">All Classes</option>
                                    {CLASSES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Quick range buttons */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {QUICK_BTNS.map(b => (
                                    <button key={b.id} onClick={() => { setQuick(b.id); if (b.id !== 'custom') setCustomDate(''); }}
                                        style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', borderColor: quick === b.id ? '#3b82f6' : '#e2e8f0', background: quick === b.id ? '#eff6ff' : 'white', color: quick === b.id ? '#2563eb' : '#64748b' }}>
                                        {b.label}
                                    </button>
                                ))}
                                {quick === 'custom' && (
                                    <input type="date" className="f-input" value={customDate} max="2026-05-05"
                                        onChange={e => setCustomDate(e.target.value)}
                                        style={{ width: 'auto', padding: '7px 12px', fontSize: 12 }} />
                                )}
                            </div>
                        </div>

                        {days.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>No school days in this range</div>
                                <div style={{ fontSize: 13 }}>Select a different period.</div>
                            </div>
                        )}

                        {days.length > 0 && (
                            <>
                                {/* Summary stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
                                    {(() => {
                                        const allRecords = studentSummaries.flatMap(s => s.records);
                                        const totalPresent = allRecords.filter(r => r.status === 'present').length;
                                        const totalAbsent  = allRecords.length - totalPresent;
                                        const overallRate  = allRecords.length ? Math.round((totalPresent / allRecords.length) * 100) : 0;
                                        const atRiskCount  = studentSummaries.filter(s => s.rate < 70).length;
                                        return [
                                            { lk: 'ចូលរៀន',   l: 'Present',    v: totalPresent,  c: '#10b981', bg: '#f0fdf4' },
                                            { lk: 'អវត្តមាន',  l: 'Absent',     v: totalAbsent,   c: '#ef4444', bg: '#fff1f2' },
                                            { lk: 'អត្រា',    l: 'Rate',       v: `${overallRate}%`, c: '#2563eb', bg: '#eff6ff' },
                                            { lk: 'ត្រូវការជំនួយ', l: 'At-Risk', v: atRiskCount, c: '#f59e0b', bg: '#fffbeb' },
                                        ].map((s, i) => (
                                            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.c}20` }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginBottom: 2 }}>{s.v}</div>
                                                <KH style={{ fontSize: 11, color: s.c, display: 'block', opacity: 0.8 }}>{s.lk}</KH>
                                                <div style={{ fontSize: 10, color: s.c, opacity: 0.6 }}>{s.l}</div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Single-day view: simple status list */}
                                {isSingleDay && days.length === 1 && (
                                    <div className="card" style={{ overflowX: 'auto' }}>
                                        <div style={{ padding: '16px 20px 0', marginBottom: 4 }}>
                                            <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>វត្តមានប្រចាំថ្ងៃ</KH>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                                                {new Date(days[0]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <table className="data-table">
                                            <thead><tr>
                                                <th>Student / សិស្ស</th><th>Class</th><th>Province</th><th>Status</th><th>Overall Rate</th>
                                            </tr></thead>
                                            <tbody>
                                                {studentSummaries.map(({ student: s, records }) => {
                                                    const st = records[0]?.status ?? 'absent';
                                                    return (
                                                        <tr key={s.id}>
                                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <Avatar name={s.nameEn} size={32} />
                                                                <div><KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div></div>
                                                            </div></td>
                                                            <td style={{ fontSize: 12, color: '#64748b' }}>{s.cls}</td>
                                                            <td style={{ fontSize: 12, color: '#64748b' }}>{s.province}</td>
                                                            <td>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, fontWeight: 700, fontSize: 12, background: st === 'present' ? '#dcfce7' : '#fee2e2', color: st === 'present' ? '#16a34a' : '#dc2626' }}>
                                                                    {st === 'present' ? '✓ Present' : '✗ Absent'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                                                                    <div style={{ flex: 1 }}><PBar value={s.attendance} color={s.attendance >= 80 ? 'green' : 'red'} /></div>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance >= 80 ? '#10b981' : '#ef4444', width: 36 }}>{s.attendance}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Multi-day view: summary per student + expandable day-by-day */}
                                {!isSingleDay && (
                                    <div className="card" style={{ overflowX: 'auto' }}>
                                        <div style={{ padding: '16px 20px 0', marginBottom: 4 }}>
                                            <KH style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>សង្ខេបវត្តមាន</KH>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Click a row to see day-by-day breakdown</div>
                                        </div>
                                        <table className="data-table">
                                            <thead><tr>
                                                <th>Student / សិស្ស</th><th>Class</th>
                                                <th>✓ Present</th><th>✗ Absent</th><th>Rate</th><th>Trend</th>
                                            </tr></thead>
                                            <tbody>
                                                {studentSummaries.map(({ student: s, records, presentCount, absentCount, rate }) => (
                                                    <>
                                                        <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}>
                                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <Avatar name={s.nameEn} size={32} />
                                                                <div>
                                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH>
                                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div>
                                                                </div>
                                                                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>
                                                                    {expandedStudent === s.id ? '▲' : '▼'}
                                                                </span>
                                                            </div></td>
                                                            <td style={{ fontSize: 12, color: '#64748b' }}>{s.cls}</td>
                                                            <td><span style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>{presentCount}</span><span style={{ fontSize: 11, color: '#94a3b8' }}> / {days.length}</span></td>
                                                            <td><span style={{ fontWeight: 800, fontSize: 15, color: absentCount > 0 ? '#ef4444' : '#94a3b8' }}>{absentCount}</span></td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
                                                                    <div style={{ flex: 1 }}><PBar value={rate} color={rate >= 80 ? 'green' : rate >= 60 ? 'amber' : 'red'} /></div>
                                                                    <span style={{ fontSize: 12, fontWeight: 800, color: rate >= 80 ? '#10b981' : rate >= 60 ? '#d97706' : '#ef4444', width: 36 }}>{rate}%</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {/* Mini calendar dots */}
                                                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 140 }}>
                                                                    {records.map(r => (
                                                                        <span key={r.date} title={r.date}
                                                                            style={{ width: 10, height: 10, borderRadius: 2, background: r.status === 'present' ? '#10b981' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expandable day-by-day breakdown */}
                                                        {expandedStudent === s.id && (
                                                            <tr key={`${s.id}-expand`}>
                                                                <td colSpan={6} style={{ padding: '0 16px 16px', background: '#f8fafc' }}>
                                                                    <div style={{ paddingTop: 12 }}>
                                                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day-by-Day Attendance</div>
                                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                            {records.map(r => {
                                                                                const d = new Date(r.date);
                                                                                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                                                                                const dayNum  = d.getDate();
                                                                                const mon     = d.toLocaleDateString('en-US', { month: 'short' });
                                                                                return (
                                                                                    <div key={r.date} style={{ textAlign: 'center', padding: '8px 10px', borderRadius: 10, background: r.status === 'present' ? '#f0fdf4' : '#fff1f2', border: `1px solid ${r.status === 'present' ? '#86efac' : '#fca5a5'}`, minWidth: 52 }}>
                                                                                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{dayName}</div>
                                                                                        <div style={{ fontSize: 14, fontWeight: 800, color: r.status === 'present' ? '#10b981' : '#ef4444' }}>
                                                                                            {r.status === 'present' ? '✓' : '✗'}
                                                                                        </div>
                                                                                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{mon} {dayNum}</div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </AdminShell>
    );
}
