import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { BarChart2, TrendingUp } from 'lucide-react';

interface Grade {
    period: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    date: string;
}

interface Props {
    profile: StudentProfile;
    grades: Grade[];
}

function gradeColor(avg: number) {
    if (avg >= 80) return '#059669';
    if (avg >= 60) return '#2563eb';
    if (avg >= 40) return '#d97706';
    return '#e11d48';
}

function gradeLetter(avg: number) {
    if (avg >= 90) return 'A+';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
}

function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SKILL_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed'];

export default function StudentGrades({ profile, grades }: Props) {
    const bestAvg = grades.length > 0 ? Math.max(...grades.map((g) => g.average)) : 0;
    const latestAvg = grades[0]?.average ?? 0;

    return (
        <StudentShell profile={profile} activePage="grades" title="Grades">
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#dbeafe' }}>
                    <BarChart2 size={18} color="#2563eb" />
                </div>
                <div className="s-page-title">My Grades</div>
            </div>

            {/* ── Summary ── */}
            {grades.length > 0 && (
                <div
                    className="s-fade-up s-delay-1"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        marginBottom: 14,
                    }}
                >
                    <div
                        className="s-card s-card-pad"
                        style={{ textAlign: 'center' }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 6,
                            }}
                        >
                            Latest
                        </div>
                        <div
                            style={{
                                fontFamily: 'DM Serif Display, serif',
                                fontSize: 36,
                                color: gradeColor(latestAvg),
                                lineHeight: 1,
                            }}
                        >
                            {latestAvg}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>
                            {gradeLetter(latestAvg)}
                        </div>
                    </div>
                    <div
                        className="s-card s-card-pad"
                        style={{ textAlign: 'center' }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 6,
                            }}
                        >
                            Best
                        </div>
                        <div
                            style={{
                                fontFamily: 'DM Serif Display, serif',
                                fontSize: 36,
                                color: gradeColor(bestAvg),
                                lineHeight: 1,
                            }}
                        >
                            {bestAvg}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>
                            {gradeLetter(bestAvg)}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Grade cards ── */}
            {grades.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <span className="s-empty-icon">⭐</span>
                        <div className="s-empty-text">No grades recorded yet</div>
                    </div>
                </div>
            ) : (
                grades.map((grade, i) => {
                    const color = gradeColor(grade.average);
                    const skills = [
                        { label: 'Speaking',  val: grade.speaking },
                        { label: 'Listening', val: grade.listening },
                        { label: 'Reading',   val: grade.reading },
                        { label: 'Writing',   val: grade.writing },
                    ];

                    return (
                        <div
                            key={i}
                            className={`s-card s-card-pad s-fade-up s-delay-${Math.min(i + 2, 5)}`}
                            style={{ marginBottom: 10 }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 16,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            background: color + '18',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <TrendingUp size={18} color={color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>
                                            {grade.period}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                                            {formatDate(grade.date)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div
                                        style={{
                                            fontFamily: 'DM Serif Display, serif',
                                            fontSize: 28,
                                            color,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {grade.average}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {gradeLetter(grade.average)}
                                    </div>
                                </div>
                            </div>

                            {/* Skill bars */}
                            {skills.map((skill, si) => (
                                <div key={skill.label} className="s-skill-row">
                                    <div className="s-skill-label">{skill.label}</div>
                                    <div className="s-skill-track">
                                        <div
                                            className="s-skill-fill"
                                            style={{
                                                width: `${Math.min(skill.val, 100)}%`,
                                                background: SKILL_COLORS[si % SKILL_COLORS.length],
                                            }}
                                        />
                                    </div>
                                    <div className="s-skill-score">{skill.val}</div>
                                </div>
                            ))}
                        </div>
                    );
                })
            )}
        </StudentShell>
    );
}
