import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { FileText, Trophy } from 'lucide-react';

interface Result {
    id: number;
    examTitle: string;
    subject: string;
    date: string;
    score: number;
    maxScore: number;
    percent: number;
    status: string;
    note: string;
}

interface Props {
    profile: StudentProfile;
    summary: {
        total: number;
        passed: number;
        average: number;
    };
    results: Result[];
}

function formatDate(date: string) {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function colorFor(percent: number) {
    if (percent >= 80) return '#059669';
    if (percent >= 60) return '#2563eb';
    if (percent >= 40) return '#d97706';
    return '#e11d48';
}

export default function StudentExamResults({
    profile,
    summary,
    results,
}: Props) {
    return (
        <StudentShell
            profile={profile}
            activePage="exam-results"
            title="Exam Results"
        >
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#eef2ff' }}>
                    <Trophy size={18} color="#4f46e5" />
                </div>
                <div>
                    <div className="s-page-title">Exam Results</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Scores, average, and pass status
                    </div>
                </div>
            </div>

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
                    { label: 'Results', value: summary.total, color: '#2563eb' },
                    { label: 'Passed', value: summary.passed, color: '#059669' },
                    { label: 'Average', value: summary.average, color: '#7c3aed' },
                ].map((item) => (
                    <div key={item.label} className="s-card s-card-pad" style={{ padding: 14 }}>
                        <div style={{ color: item.color, fontSize: 28, fontWeight: 950, lineHeight: 1 }}>
                            {item.value}
                        </div>
                        <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800, marginTop: 4 }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>

            {results.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <span className="s-empty-icon">Results</span>
                        <div className="s-empty-text">No exam results yet</div>
                    </div>
                </div>
            ) : (
                results.map((result, index) => {
                    const color = colorFor(result.percent);

                    return (
                        <article
                            key={result.id}
                            className={`s-card s-card-pad s-fade-up s-delay-${Math.min(index + 2, 5)}`}
                            style={{ marginBottom: 12 }}
                        >
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        background: `${color}18`,
                                        color,
                                        display: 'grid',
                                        placeItems: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <FileText size={17} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ color: '#1a1a2e', fontSize: 14, fontWeight: 900 }}>
                                        {result.examTitle}
                                    </div>
                                    <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 700, marginTop: 3 }}>
                                        {result.subject} {result.date ? `· ${formatDate(result.date)}` : ''}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color, fontSize: 22, fontWeight: 950, lineHeight: 1 }}>
                                        {result.percent}%
                                    </div>
                                    <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800 }}>
                                        {result.score}/{result.maxScore}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, height: 8, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(result.percent, 100)}%`, height: '100%', background: color }} />
                            </div>
                        </article>
                    );
                })
            )}
        </StudentShell>
    );
}
