import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { Clock, FileText } from 'lucide-react';
import { useState } from 'react';

interface ExamResult {
    score: number;
    maxScore: number;
    status: string;
    note: string;
}

interface Exam {
    id: number;
    title: string;
    subject: string;
    date: string;
    duration: number;
    status: string;
    result: ExamResult | null;
}

interface Props {
    profile: StudentProfile;
    exams: Exam[];
}

type TabKey = 'upcoming' | 'past';

function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function isPast(d: string) {
    return d && new Date(d).getTime() < Date.now();
}

function daysUntil(d: string) {
    if (!d) return '';
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `in ${diff}d`;
}

function scoreColor(score: number, max: number) {
    if (max === 0) return '#9ca3af';
    const pct = (score / max) * 100;
    if (pct >= 80) return '#059669';
    if (pct >= 60) return '#2563eb';
    if (pct >= 40) return '#d97706';
    return '#e11d48';
}

export default function StudentExams({ profile, exams }: Props) {
    const [tab, setTab] = useState<TabKey>('upcoming');

    const upcoming = exams.filter((e) => !isPast(e.date));
    const past = exams.filter((e) => isPast(e.date));
    const shown = tab === 'upcoming' ? upcoming : past;

    return (
        <StudentShell profile={profile} activePage="exams" title="Exams">
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div
                    className="s-page-accent"
                    style={{ background: '#ede9fe' }}
                >
                    <FileText size={18} color="#7c3aed" />
                </div>
                <div className="s-page-title">Exams</div>
            </div>

            {/* ── Summary row ── */}
            <div
                className="s-fade-up s-delay-1"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    marginBottom: 14,
                }}
            >
                {[
                    { label: 'Total', val: exams.length, color: '#1a1a2e' },
                    {
                        label: 'Upcoming',
                        val: upcoming.length,
                        color: '#7c3aed',
                    },
                    { label: 'Past', val: past.length, color: '#6b7280' },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="s-card s-card-pad"
                        style={{ textAlign: 'center', padding: '14px 10px' }}
                    >
                        <div
                            style={{
                                fontFamily: 'DM Serif Display, serif',
                                fontSize: 28,
                                color: s.color,
                                lineHeight: 1,
                            }}
                        >
                            {s.val}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: '#9ca3af',
                                fontWeight: 600,
                                marginTop: 4,
                            }}
                        >
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="s-tabs s-fade-up s-delay-2">
                <button
                    className={`s-tab${tab === 'upcoming' ? ' active' : ''}`}
                    aria-selected={tab === 'upcoming'}
                    onClick={() => setTab('upcoming')}
                >
                    Upcoming ({upcoming.length})
                </button>
                <button
                    className={`s-tab${tab === 'past' ? ' active' : ''}`}
                    aria-selected={tab === 'past'}
                    onClick={() => setTab('past')}
                >
                    Past ({past.length})
                </button>
            </div>

            {/* ── Exam cards ── */}
            {shown.length === 0 ? (
                <div className="s-card s-fade-up s-delay-3">
                    <div className="s-empty">
                        <span className="s-empty-icon">📋</span>
                        <div className="s-empty-text">
                            {tab === 'upcoming'
                                ? 'No upcoming exams'
                                : 'No past exams'}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="s-fade-up s-delay-3"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}
                >
                    {shown.map((exam, i) => {
                        const future = !isPast(exam.date);
                        const result = exam.result;
                        const resultColor = result
                            ? scoreColor(result.score, result.maxScore)
                            : '#9ca3af';

                        return (
                            <div key={exam.id} className="s-card s-card-pad">
                                {/* Header row */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                        marginBottom: result ? 14 : 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 14,
                                            background: future
                                                ? '#ede9fe'
                                                : '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <FileText
                                            size={18}
                                            color={
                                                future ? '#7c3aed' : '#6b7280'
                                            }
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: '#1a1a2e',
                                                marginBottom: 4,
                                            }}
                                        >
                                            {exam.title}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 8,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {exam.subject && (
                                                <span className="s-badge s-badge-violet">
                                                    {exam.subject}
                                                </span>
                                            )}
                                            <span className="s-badge s-badge-gray">
                                                <Clock
                                                    size={10}
                                                    style={{ marginRight: 3 }}
                                                />
                                                {exam.duration}min
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: 'right',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: future
                                                    ? '#7c3aed'
                                                    : '#6b7280',
                                            }}
                                        >
                                            {future
                                                ? daysUntil(exam.date)
                                                : formatDate(exam.date)}
                                        </div>
                                        {future && (
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: '#9ca3af',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {formatDate(exam.date)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Result (past exams) */}
                                {result && (
                                    <div
                                        style={{
                                            padding: '12px 14px',
                                            background: resultColor + '12',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#9ca3af',
                                                    fontWeight: 600,
                                                    marginBottom: 2,
                                                }}
                                            >
                                                Score
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily:
                                                        'DM Serif Display, serif',
                                                    fontSize: 22,
                                                    color: resultColor,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {result.score}
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: '#9ca3af',
                                                        fontFamily:
                                                            'DM Sans, sans-serif',
                                                    }}
                                                >
                                                    /{result.maxScore}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span
                                                className={
                                                    result.status === 'passed'
                                                        ? 's-badge s-badge-green'
                                                        : result.status ===
                                                            'failed'
                                                          ? 's-badge s-badge-red'
                                                          : 's-badge s-badge-gray'
                                                }
                                            >
                                                {result.status || 'Graded'}
                                            </span>
                                            {result.note && (
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#9ca3af',
                                                        marginTop: 4,
                                                        maxWidth: 140,
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {result.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
