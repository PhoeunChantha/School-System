import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Submission {
    submitted: string;
    score: number | null;
    status: string;
}

interface Homework {
    id: number;
    title: string;
    titleKh: string;
    instructions: string;
    points: number;
    due: string;
    status: string;
    submission: Submission | null;
}

interface Props {
    profile: StudentProfile;
    homework: Homework[];
}

type TabKey = 'all' | 'pending' | 'submitted';

function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPastDue(d: string) {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
}

function submissionBadge(hw: Homework) {
    if (!hw.submission) {
        if (isPastDue(hw.due)) return { label: 'Missing', cls: 's-badge-red' };
        return { label: 'Pending', cls: 's-badge-amber' };
    }
    const s = hw.submission.status;
    if (s === 'graded') return { label: 'Graded', cls: 's-badge-green' };
    if (s === 'late')   return { label: 'Late',   cls: 's-badge-orange' };
    return { label: 'Submitted', cls: 's-badge-blue' };
}

export default function StudentHomework({ profile, homework }: Props) {
    const [tab, setTab] = useState<TabKey>('all');

    const filtered = homework.filter((hw) => {
        if (tab === 'pending')   return !hw.submission;
        if (tab === 'submitted') return !!hw.submission;
        return true;
    });

    const pendingCount   = homework.filter((h) => !h.submission).length;
    const submittedCount = homework.filter((h) => !!h.submission).length;

    return (
        <StudentShell profile={profile} activePage="homework" title="Homework">
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#fef3c7' }}>
                    <BookOpen size={18} color="#d97706" />
                </div>
                <div className="s-page-title">Homework</div>
            </div>

            {/* ── Summary row ── */}
            <div
                className="s-fade-up s-delay-1"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}
            >
                {[
                    { label: 'Total',     val: homework.length, color: '#1a1a2e' },
                    { label: 'Pending',   val: pendingCount,   color: '#d97706' },
                    { label: 'Submitted', val: submittedCount, color: '#059669' },
                ].map((s) => (
                    <div key={s.label} className="s-card s-card-pad" style={{ textAlign: 'center', padding: '14px 10px' }}>
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
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 4 }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="s-tabs s-fade-up s-delay-2">
                {[
                    { key: 'all' as TabKey,       label: `All (${homework.length})` },
                    { key: 'pending' as TabKey,   label: `Pending (${pendingCount})` },
                    { key: 'submitted' as TabKey, label: `Submitted (${submittedCount})` },
                ].map((t) => (
                    <button
                        key={t.key}
                        className={`s-tab${tab === t.key ? ' active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {filtered.length === 0 ? (
                <div className="s-card s-fade-up s-delay-3">
                    <div className="s-empty">
                        <span className="s-empty-icon">📝</span>
                        <div className="s-empty-text">No homework in this category</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-3">
                    {filtered.map((hw, i) => {
                        const badge   = submissionBadge(hw);
                        const overdue = !hw.submission && isPastDue(hw.due);
                        const iconBg  = hw.submission
                            ? hw.submission.status === 'graded' ? '#dcfce7' : '#dbeafe'
                            : overdue ? '#fee2e2' : '#fef3c7';
                        const iconColor = hw.submission
                            ? hw.submission.status === 'graded' ? '#059669' : '#2563eb'
                            : overdue ? '#e11d48' : '#d97706';

                        return (
                            <div key={hw.id} className="s-list-item">
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 13,
                                        background: iconBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {hw.submission?.status === 'graded' && <CheckCircle size={17} color={iconColor} />}
                                    {hw.submission && hw.submission.status !== 'graded' && <Clock size={17} color={iconColor} />}
                                    {!hw.submission && overdue && <AlertTriangle size={17} color={iconColor} />}
                                    {!hw.submission && !overdue && <BookOpen size={17} color={iconColor} />}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#1a1a2e',
                                            marginBottom: 3,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {hw.title || hw.titleKh}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: overdue && !hw.submission ? '#e11d48' : '#9ca3af',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Due {formatDate(hw.due)}
                                        {hw.points > 0 && ` · ${hw.points}pts`}
                                    </div>
                                    {hw.submission?.status === 'graded' && hw.submission.score !== null && (
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 3 }}>
                                            Score: {hw.submission.score}/{hw.points}
                                        </div>
                                    )}
                                </div>

                                <span className={`s-badge ${badge.cls}`}>{badge.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
