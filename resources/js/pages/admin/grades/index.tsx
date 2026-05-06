import {
    CLASSES,
    STUDENTS,
    type Grade,
    type Student,
} from '@/pages/admin/data';
import AdminShell from '@/pages/admin/shell';
import {
    Avatar,
    Badge,
    KH,
    Pagination,
    PBar,
    ScoreChip,
} from '@/pages/admin/ui';
import { useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────
const SKILLS: (keyof Grade)[] = ['speaking', 'listening', 'reading', 'writing'];
const SKILL_KH: Record<keyof Grade, string> = {
    speaking: 'និយាយ',
    listening: 'ស្ដាប់',
    reading: 'អាន',
    writing: 'សរសេរ',
};
const SKILL_COLOR: Record<keyof Grade, string> = {
    speaking: '#3b82f6',
    listening: '#8b5cf6',
    reading: '#10b981',
    writing: '#f59e0b',
};

// ── Monthly data ──────────────────────────────────────────
const MONTHS = [
    { key: 'jan', label: 'Jan', full: 'January 2026' },
    { key: 'feb', label: 'Feb', full: 'February 2026' },
    { key: 'mar', label: 'Mar', full: 'March 2026' },
    { key: 'apr', label: 'Apr', full: 'April 2026' },
    { key: 'may', label: 'May', full: 'May 2026 (current)' },
];

function getMonthlyScore(
    studentId: number,
    sk: keyof Grade,
    monthIdx: number,
): number {
    const student = STUDENTS.find((s) => s.id === studentId)!;
    const base = student.grade[sk];
    // Deterministic variance per (student, skill, month)
    const seed = (studentId * 53 + monthIdx * 17 + sk.charCodeAt(0) * 7) % 21;
    const variance = seed - 10; // –10 … +10
    const trend = (monthIdx / (MONTHS.length - 1)) * 6; // 0 → +6 over the year
    return Math.min(100, Math.max(25, Math.round(base - 7 + variance + trend)));
}

// Build full monthly series for a student
function buildMonthlyData(studentId: number) {
    return MONTHS.map((m, idx) => {
        const row: Record<string, string | number> = { month: m.label };
        SKILLS.forEach((sk) => {
            row[sk] = getMonthlyScore(studentId, sk, idx);
        });
        row.avg = Math.round(
            SKILLS.reduce((a, sk) => a + (row[sk] as number), 0) /
                SKILLS.length,
        );
        return row;
    });
}

type SortKey = 'name' | 'avg' | keyof Grade;
type SortDir = 'asc' | 'desc';
type OrderKey = `${SortKey}-${SortDir}`;
type PerfFilter = 'all' | 'excellent' | 'good' | 'average' | 'poor';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'avg-desc', label: 'Score Highest' },
    { value: 'avg-asc', label: 'Score Lowest' },
    { value: 'speaking-desc', label: 'Speaking High' },
    { value: 'listening-desc', label: 'Listening High' },
    { value: 'reading-desc', label: 'Reading High' },
    { value: 'writing-desc', label: 'Writing High' },
];

const avg = (g: Grade) =>
    Math.round(Object.values(g).reduce((a, b) => a + b, 0) / 4);

const perfLabel = (
    score: number,
): { label: string; type: 'green' | 'blue' | 'amber' | 'red' } => {
    if (score >= 80) return { label: 'Excellent', type: 'green' };
    if (score >= 65) return { label: 'Good', type: 'blue' };
    if (score >= 50) return { label: 'Average', type: 'amber' };
    return { label: 'Needs Work', type: 'red' };
};

// ── Custom dark tooltip ───────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: '#1e2940',
                color: 'white',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {label && (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.45)',
                        marginBottom: 6,
                        fontSize: 11,
                    }}
                >
                    {label}
                </div>
            )}
            {payload.map((p: any) => (
                <div
                    key={p.name}
                    style={{
                        color: p.fill ?? p.color ?? '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: p.fill ?? p.color ?? '#fff',
                            display: 'inline-block',
                        }}
                    />
                    {p.name}:{' '}
                    <strong style={{ marginLeft: 2 }}>{p.value}</strong>
                </div>
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// STUDENT DETAIL VIEW
// ══════════════════════════════════════════════════════════
function StudentDetail({
    student,
    grade,
    grades,
    rank,
    onBack,
}: {
    student: Student;
    grade: Grade;
    grades: Record<number, Grade>;
    rank: number;
    onBack: () => void;
}) {
    const a = avg(grade);
    const perf = perfLabel(a);

    // Class-wide skill averages for "vs avg" comparison
    const classStudents = STUDENTS.filter((s) => s.cls === student.cls);
    const skillAvgs = SKILLS.map((sk) => ({
        sk,
        avg: Math.round(
            classStudents.reduce((acc, s) => acc + grades[s.id][sk], 0) /
                classStudents.length,
        ),
    }));

    // Radar data
    const radarData = SKILLS.map((sk) => ({
        skKh: SKILL_KH[sk],
        score: grade[sk],
        classAvg: skillAvgs.find((x) => x.sk === sk)?.avg ?? 0,
    }));

    return (
        <div
            className="fade-in"
            style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}
        >
            {/* Back button */}
            <button
                onClick={onBack}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#3b82f6',
                    fontWeight: 700,
                    fontSize: 14,
                    padding: 0,
                    alignSelf: 'flex-start',
                }}
            >
                ← Back to Grades
            </button>

            {/* Student header card */}
            <div className="card" style={{ padding: 24 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        flexWrap: 'wrap',
                    }}
                >
                    <Avatar name={student.nameEn} size={72} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <KH
                            style={{
                                fontWeight: 800,
                                fontSize: 22,
                                display: 'block',
                                marginBottom: 2,
                            }}
                        >
                            {student.nameKh}
                        </KH>
                        <div
                            style={{
                                fontSize: 14,
                                color: '#64748b',
                                marginBottom: 10,
                            }}
                        >
                            {student.nameEn}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Badge type="blue">{student.level}</Badge>
                            <Badge type={perf.type}>{perf.label}</Badge>
                            {student.attendance < 70 && (
                                <Badge type="red">⚠ Low Attendance</Badge>
                            )}
                        </div>
                    </div>

                    {/* Score ring */}
                    <div
                        style={{
                            textAlign: 'center',
                            background:
                                a >= 75
                                    ? '#f0fdf4'
                                    : a >= 50
                                      ? '#eff6ff'
                                      : '#fffbeb',
                            borderRadius: 16,
                            padding: '16px 24px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 40,
                                fontWeight: 900,
                                color:
                                    a >= 75
                                        ? '#10b981'
                                        : a >= 50
                                          ? '#3b82f6'
                                          : '#f59e0b',
                                lineHeight: 1,
                            }}
                        >
                            {a}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                marginTop: 4,
                            }}
                        >
                            Average / 100
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#64748b',
                                marginTop: 2,
                            }}
                        >
                            Rank #{rank} in class
                        </div>
                    </div>
                </div>

                {/* Info strip */}
                <div
                    style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: 24,
                        fontSize: 13,
                        color: '#64748b',
                        flexWrap: 'wrap',
                    }}
                >
                    <span>🏫 {student.cls}</span>
                    <span>
                        📋 Attendance:{' '}
                        <strong
                            style={{
                                color:
                                    student.attendance >= 80
                                        ? '#10b981'
                                        : '#ef4444',
                            }}
                        >
                            {student.attendance}%
                        </strong>
                    </span>
                    <span>
                        📍 {student.village}, {student.province}
                    </span>
                    <span>
                        💳 Fees:{' '}
                        <strong
                            style={{
                                color:
                                    student.fees === 'Paid'
                                        ? '#10b981'
                                        : student.fees === 'Unpaid'
                                          ? '#ef4444'
                                          : '#d97706',
                            }}
                        >
                            {student.fees}
                        </strong>
                    </span>
                </div>
            </div>

            {/* Skill breakdown + Radar */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 360px',
                    gap: 16,
                }}
            >
                {/* Skill breakdown */}
                <div className="card" style={{ padding: 24 }}>
                    <KH
                        style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: '#1e293b',
                            display: 'block',
                            marginBottom: 4,
                        }}
                    >
                        ពិន្ទុជំនាញ
                    </KH>
                    <div
                        style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            marginBottom: 20,
                        }}
                    >
                        Skill Breakdown — compared to class average
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 18,
                        }}
                    >
                        {SKILLS.map((sk) => {
                            const clsAvg =
                                skillAvgs.find((x) => x.sk === sk)?.avg ?? 0;
                            const diff = grade[sk] - clsAvg;
                            const color = SKILL_COLOR[sk];
                            return (
                                <div key={sk}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 3,
                                                    background: color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <KH
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: '#374151',
                                                }}
                                            >
                                                {SKILL_KH[sk]}
                                            </KH>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                ({sk})
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color:
                                                        diff >= 0
                                                            ? '#10b981'
                                                            : '#ef4444',
                                                    background:
                                                        diff >= 0
                                                            ? '#f0fdf4'
                                                            : '#fff1f2',
                                                    padding: '2px 8px',
                                                    borderRadius: 99,
                                                }}
                                            >
                                                {diff >= 0 ? '+' : ''}
                                                {diff} vs avg
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 900,
                                                    color,
                                                    minWidth: 36,
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {grade[sk]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Student bar */}
                                    <div
                                        style={{
                                            height: 12,
                                            background: '#f1f5f9',
                                            borderRadius: 99,
                                            overflow: 'hidden',
                                            marginBottom: 4,
                                            position: 'relative',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${grade[sk]}%`,
                                                background: color,
                                                borderRadius: 99,
                                                transition: 'width 0.5s',
                                            }}
                                        />
                                    </div>

                                    {/* Class avg indicator */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 4,
                                                background: '#f8fafc',
                                                borderRadius: 99,
                                                overflow: 'hidden',
                                                position: 'relative',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${clsAvg}%`,
                                                    background: '#e2e8f0',
                                                    borderRadius: 99,
                                                }}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                flexShrink: 0,
                                            }}
                                        >
                                            class avg {clsAvg}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Radar chart */}
                <div className="card" style={{ padding: 24 }}>
                    <KH
                        style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: '#1e293b',
                            display: 'block',
                            marginBottom: 4,
                        }}
                    >
                        ការប្រៀបធៀប
                    </KH>
                    <div
                        style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            marginBottom: 12,
                        }}
                    >
                        Student vs Class Average
                    </div>

                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis
                                dataKey="skKh"
                                tick={{
                                    fontSize: 12,
                                    fill: '#64748b',
                                    fontWeight: 700,
                                    fontFamily: "'Noto Sans Khmer',sans-serif",
                                }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fontSize: 9, fill: '#94a3b8' }}
                                axisLine={false}
                            />
                            {/* Class average */}
                            <Radar
                                name="Class Avg"
                                dataKey="classAvg"
                                stroke="#e2e8f0"
                                fill="#e2e8f0"
                                fillOpacity={0.5}
                                strokeWidth={1.5}
                                strokeDasharray="4 2"
                                isAnimationActive
                                animationDuration={500}
                            />
                            {/* Student */}
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.22}
                                strokeWidth={2.5}
                                dot={{
                                    r: 4,
                                    fill: '#8b5cf6',
                                    stroke: 'white',
                                    strokeWidth: 2,
                                }}
                                isAnimationActive
                                animationDuration={700}
                            />
                            <Tooltip content={<DarkTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            justifyContent: 'center',
                            marginTop: 8,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 12,
                                    height: 3,
                                    background: '#8b5cf6',
                                    borderRadius: 99,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    fontWeight: 600,
                                }}
                            >
                                {student.nameEn}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 12,
                                    height: 3,
                                    background: '#e2e8f0',
                                    borderRadius: 99,
                                    borderTop: '2px dashed #cbd5e1',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                }}
                            >
                                Class Avg
                            </span>
                        </div>
                    </div>

                    {/* Score chips */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: 16,
                        }}
                    >
                        {SKILLS.map((sk) => (
                            <div
                                key={sk}
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <KH
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#374151',
                                    }}
                                >
                                    {SKILL_KH[sk]}
                                </KH>
                                <ScoreChip score={grade[sk]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Monthly Score Trend ── */}
            <MonthlyTrend studentId={student.id} />
        </div>
    );
}

// ── Monthly trend section ─────────────────────────────────
function MonthlyTrend({ studentId }: { studentId: number }) {
    const [selMonth, setSelMonth] = useState(MONTHS.length - 1); // default: May (current)
    const monthlyData = buildMonthlyData(studentId);

    const selectedRow = monthlyData[selMonth];
    const prevRow = selMonth > 0 ? monthlyData[selMonth - 1] : null;

    return (
        <div className="card" style={{ padding: 24 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <div>
                    <KH
                        style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: '#1e293b',
                            display: 'block',
                            marginBottom: 2,
                        }}
                    >
                        ពិន្ទុតាមខែ
                    </KH>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Score by Month — Jan to May 2026
                    </div>
                </div>
                {/* Month tabs */}
                <div
                    style={{
                        display: 'flex',
                        gap: 4,
                        background: '#f1f5f9',
                        borderRadius: 10,
                        padding: 3,
                    }}
                >
                    {MONTHS.map((m, i) => (
                        <button
                            key={m.key}
                            onClick={() => setSelMonth(i)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 700,
                                transition: 'all 0.15s',
                                background:
                                    selMonth === i ? 'white' : 'transparent',
                                color: selMonth === i ? '#2563eb' : '#94a3b8',
                                boxShadow:
                                    selMonth === i
                                        ? '0 1px 4px rgba(0,0,0,0.08)'
                                        : 'none',
                            }}
                        >
                            {m.label}
                            {i === MONTHS.length - 1 && (
                                <span
                                    style={{
                                        marginLeft: 3,
                                        fontSize: 9,
                                        color: '#10b981',
                                        fontWeight: 800,
                                    }}
                                >
                                    NOW
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Line chart */}
            <ResponsiveContainer width="100%" height={240}>
                <LineChart
                    data={monthlyData}
                    margin={{ top: 4, right: 16, left: -20, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="month"
                        tick={{
                            fontSize: 12,
                            fill: '#64748b',
                            fontWeight: 700,
                        }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                    {/* Reference dot for selected month */}
                    {SKILLS.map((sk) => (
                        <Line
                            key={sk}
                            type="monotone"
                            dataKey={sk}
                            name={SKILL_KH[sk]}
                            stroke={SKILL_COLOR[sk]}
                            strokeWidth={2.5}
                            dot={(props: any) => {
                                const isSelected = props.index === selMonth;
                                return (
                                    <circle
                                        key={props.key}
                                        cx={props.cx}
                                        cy={props.cy}
                                        r={isSelected ? 7 : 4}
                                        fill={
                                            isSelected
                                                ? SKILL_COLOR[sk]
                                                : 'white'
                                        }
                                        stroke={SKILL_COLOR[sk]}
                                        strokeWidth={isSelected ? 3 : 2}
                                    />
                                );
                            }}
                            activeDot={{
                                r: 6,
                                stroke: 'white',
                                strokeWidth: 2,
                            }}
                            isAnimationActive
                            animationDuration={600}
                        />
                    ))}
                    <Line
                        type="monotone"
                        dataKey="avg"
                        name="Average"
                        stroke="#1e2940"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={false}
                        activeDot={{ r: 5 }}
                        isAnimationActive
                        animationDuration={600}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Selected month detail */}
            <div
                style={{
                    marginTop: 20,
                    padding: '16px 20px',
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e8edf5',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 14,
                                color: '#1e293b',
                            }}
                        >
                            {MONTHS[selMonth].full}
                        </div>
                        {prevRow && (
                            <div
                                style={{
                                    fontSize: 11,
                                    color: '#94a3b8',
                                    marginTop: 2,
                                }}
                            >
                                vs {MONTHS[selMonth - 1].full}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 900,
                                color:
                                    (selectedRow.avg as number) >= 75
                                        ? '#10b981'
                                        : (selectedRow.avg as number) >= 50
                                          ? '#3b82f6'
                                          : '#f59e0b',
                            }}
                        >
                            {selectedRow.avg}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                            Monthly Average
                        </div>
                        {prevRow &&
                            (() => {
                                const diff =
                                    (selectedRow.avg as number) -
                                    (prevRow.avg as number);
                                return diff !== 0 ? (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color:
                                                diff > 0
                                                    ? '#10b981'
                                                    : '#ef4444',
                                        }}
                                    >
                                        {diff > 0 ? '↑ +' : '↓ '}
                                        {diff} from {MONTHS[selMonth - 1].label}
                                    </div>
                                ) : null;
                            })()}
                    </div>
                </div>

                {/* Per-skill breakdown for selected month */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill,minmax(160px,1fr))',
                        gap: 10,
                    }}
                >
                    {SKILLS.map((sk) => {
                        const score = selectedRow[sk] as number;
                        const prevScore = prevRow
                            ? (prevRow[sk] as number)
                            : null;
                        const diff =
                            prevScore !== null ? score - prevScore : null;
                        const color = SKILL_COLOR[sk];
                        return (
                            <div
                                key={sk}
                                style={{
                                    background: 'white',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    border: `1px solid ${color}20`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 8,
                                    }}
                                >
                                    <div>
                                        <KH
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#374151',
                                                display: 'block',
                                            }}
                                        >
                                            {SKILL_KH[sk]}
                                        </KH>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {sk}
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 20,
                                            fontWeight: 900,
                                            color,
                                        }}
                                    >
                                        {score}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 6,
                                        background: '#f1f5f9',
                                        borderRadius: 99,
                                        overflow: 'hidden',
                                        marginBottom: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${score}%`,
                                            background: color,
                                            borderRadius: 99,
                                            transition: 'width 0.4s',
                                        }}
                                    />
                                </div>
                                {diff !== null && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color:
                                                diff > 0
                                                    ? '#10b981'
                                                    : diff < 0
                                                      ? '#ef4444'
                                                      : '#94a3b8',
                                        }}
                                    >
                                        {diff > 0
                                            ? '↑ +'
                                            : diff < 0
                                              ? '↓ '
                                              : '→ '}
                                        {diff} from {MONTHS[selMonth - 1].label}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Full monthly table */}
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            {SKILLS.map((sk) => (
                                <th key={sk}>
                                    <KH>{SKILL_KH[sk]}</KH>
                                </th>
                            ))}
                            <th>Average</th>
                            <th>vs Prev</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyData.map((row, i) => {
                            const prevAvg =
                                i > 0
                                    ? (monthlyData[i - 1].avg as number)
                                    : null;
                            const diff =
                                prevAvg !== null
                                    ? (row.avg as number) - prevAvg
                                    : null;
                            const isCurrent = i === MONTHS.length - 1;
                            const isSelected = i === selMonth;
                            return (
                                <tr
                                    key={MONTHS[i].key}
                                    onClick={() => setSelMonth(i)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected
                                            ? '#eff6ff'
                                            : isCurrent
                                              ? '#f8fafc'
                                              : undefined,
                                        fontWeight: isSelected
                                            ? 700
                                            : undefined,
                                    }}
                                >
                                    <td>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color: isSelected
                                                        ? '#2563eb'
                                                        : '#374151',
                                                }}
                                            >
                                                {MONTHS[i].full.replace(
                                                    ' 2026',
                                                    '',
                                                )}
                                            </span>
                                            {isCurrent && (
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        background: '#dcfce7',
                                                        color: '#16a34a',
                                                        padding: '1px 6px',
                                                        borderRadius: 99,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    NOW
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {SKILLS.map((sk) => (
                                        <td key={sk}>
                                            <ScoreChip
                                                score={row[sk] as number}
                                            />
                                        </td>
                                    ))}
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 15,
                                                color:
                                                    (row.avg as number) >= 75
                                                        ? '#10b981'
                                                        : (row.avg as number) >=
                                                            50
                                                          ? '#3b82f6'
                                                          : '#f59e0b',
                                            }}
                                        >
                                            {row.avg}
                                        </span>
                                    </td>
                                    <td>
                                        {diff !== null ? (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color:
                                                        diff > 0
                                                            ? '#10b981'
                                                            : diff < 0
                                                              ? '#ef4444'
                                                              : '#94a3b8',
                                                }}
                                            >
                                                {diff > 0
                                                    ? '↑ +'
                                                    : diff < 0
                                                      ? '↓ '
                                                      : '→ '}
                                                {diff}
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    color: '#94a3b8',
                                                    fontSize: 12,
                                                }}
                                            >
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function GradesPage() {
    const [selClass, setSelClass] = useState('all');
    const [perfFilter, setPerfFilter] = useState<PerfFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('avg');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [editing, setEditing] = useState<Set<number>>(new Set());
    const [viewId, setViewId] = useState<number | null>(null);
    const [selMonthIdx, setSelMonthIdx] = useState(MONTHS.length - 1);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5); // default: May (current)
    const [grades, setGrades] = useState<Record<number, Grade>>(() => {
        const g: Record<number, Grade> = {};
        STUDENTS.forEach((s) => {
            g[s.id] = { ...s.grade };
        });
        return g;
    });

    const isCurrentMonth = selMonthIdx === MONTHS.length - 1;

    // For historical months use generated scores; for current use editable grades
    const gradesForMonth = useMemo((): Record<number, Grade> => {
        if (isCurrentMonth) return grades;
        const g: Record<number, Grade> = {};
        STUDENTS.forEach((s) => {
            g[s.id] = {
                speaking: getMonthlyScore(s.id, 'speaking', selMonthIdx),
                listening: getMonthlyScore(s.id, 'listening', selMonthIdx),
                reading: getMonthlyScore(s.id, 'reading', selMonthIdx),
                writing: getMonthlyScore(s.id, 'writing', selMonthIdx),
            };
        });
        return g;
    }, [selMonthIdx, grades, isCurrentMonth]);

    // ── If a student is selected → show detail ────────────
    if (viewId !== null) {
        const student = STUDENTS.find((s) => s.id === viewId)!;
        const sortedIds = [...STUDENTS]
            .filter((s) => s.cls === student.cls)
            .sort((a, b) => avg(grades[b.id]) - avg(grades[a.id]))
            .map((s) => s.id);
        const rank = sortedIds.indexOf(viewId) + 1;
        return (
            <AdminShell>
                <StudentDetail
                    student={student}
                    grade={grades[viewId]}
                    grades={grades}
                    rank={rank}
                    onBack={() => setViewId(null)}
                />
            </AdminShell>
        );
    }

    // ── Filtered + sorted list ────────────────────────────
    const filtered = useMemo(() => {
        let list = STUDENTS.filter(
            (s) => selClass === 'all' || s.cls === selClass,
        );
        list = list.filter((s) => {
            const a = avg(gradesForMonth[s.id]);
            if (perfFilter === 'excellent') return a >= 80;
            if (perfFilter === 'good') return a >= 65 && a < 80;
            if (perfFilter === 'average') return a >= 50 && a < 65;
            if (perfFilter === 'poor') return a < 50;
            return true;
        });
        return [...list].sort((a, b) => {
            const ga = gradesForMonth[a.id],
                gb = gradesForMonth[b.id];
            if (sortKey === 'name') {
                return sortDir === 'desc'
                    ? b.nameEn.localeCompare(a.nameEn)
                    : a.nameEn.localeCompare(b.nameEn);
            }

            let va: number, vb: number;
            if (sortKey === 'avg') {
                va = avg(ga);
                vb = avg(gb);
            } else {
                va = ga[sortKey as keyof Grade];
                vb = gb[sortKey as keyof Grade];
            }
            return sortDir === 'desc' ? vb - va : va - vb;
        });
    }, [selClass, perfFilter, sortKey, sortDir, gradesForMonth]);

    // Reset to page 1 on any filter/sort/month change
    useEffect(() => {
        setPage(1);
    }, [selClass, perfFilter, sortKey, sortDir, selMonthIdx, perPage]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    // ── Stats (use month-specific grades) ─────────────────
    const classStudents =
        selClass === 'all'
            ? STUDENTS
            : STUDENTS.filter((s) => s.cls === selClass);
    const overallAvg = classStudents.length
        ? Math.round(
              classStudents.reduce((a, s) => a + avg(gradesForMonth[s.id]), 0) /
                  classStudents.length,
          )
        : 0;
    const topStudent = [...STUDENTS].sort(
        (a, b) => avg(gradesForMonth[b.id]) - avg(gradesForMonth[a.id]),
    )[0];
    const belowPass = STUDENTS.filter(
        (s) => avg(gradesForMonth[s.id]) < 50,
    ).length;

    // ── Edit helpers ──────────────────────────────────────
    const saveOne = (id: number) => {
        setEditing((p) => {
            const n = new Set(p);
            n.delete(id);
            return n;
        });
        toast.success('Grade saved!', {
            description: STUDENTS.find((s) => s.id === id)?.nameEn,
        });
    };
    const saveAll = () => {
        setEditing(new Set());
        toast.success('All grades saved!');
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };
    const sortIcon = (key: SortKey) =>
        sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 18,
                                color: '#1e293b',
                            }}
                        >
                            ⭐ Grades
                        </div>
                        <KH
                            style={{
                                fontSize: 12,
                                color: '#94a3b8',
                                display: 'block',
                            }}
                        >
                            ពិន្ទុសិស្ស · May 2026
                        </KH>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {editing.size > 0 && (
                            <button
                                onClick={saveAll}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 18px',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                }}
                            >
                                ✓ Save All ({editing.size})
                            </button>
                        )}
                        <button
                            onClick={() =>
                                toast.success('Exporting grades…', {
                                    description:
                                        'CSV download will start shortly.',
                                })
                            }
                            style={{
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            ⬇ Export
                        </button>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    {/* Month */}
                    <select
                        value={selMonthIdx}
                        onChange={(e) => {
                            setSelMonthIdx(Number(e.target.value));
                            setEditing(new Set());
                        }}
                        className="f-input"
                        style={{
                            width: 'auto',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m.key} value={i}>
                                {m.full}
                                {i === MONTHS.length - 1 ? ' (Current)' : ''}
                            </option>
                        ))}
                    </select>

                    {/* Class */}
                    <select
                        value={selClass}
                        onChange={(e) => setSelClass(e.target.value)}
                        className="f-input"
                        style={{
                            width: 'auto',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All Classes</option>
                        {CLASSES.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Performance */}
                    <select
                        value={perfFilter}
                        onChange={(e) =>
                            setPerfFilter(e.target.value as PerfFilter)
                        }
                        className="f-input"
                        style={{
                            width: 'auto',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All Performance</option>
                        <option value="excellent">🥇 Excellent (≥80)</option>
                        <option value="good">👍 Good (65–79)</option>
                        <option value="average">📊 Average (50–64)</option>
                        <option value="poor">⚠ Needs Work (&lt;50)</option>
                    </select>

                    {/* Result count */}
                    <span
                        style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            fontWeight: 600,
                        }}
                    >
                        {filtered.length} student
                        {filtered.length !== 1 ? 's' : ''}
                        {!isCurrentMonth && (
                            <span
                                style={{
                                    marginLeft: 6,
                                    color: '#f59e0b',
                                    fontWeight: 700,
                                }}
                            >
                                · read-only
                            </span>
                        )}
                    </span>
                </div>

                {/* ── Grades table ── */}
                <div className="card" style={{ overflowX: 'auto' }}>
                    {/* Sort + per-page control bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 16px',
                            borderBottom: '1px solid #f1f5f9',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#94a3b8',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Sort by
                        </span>
                        <select
                            value={`${sortKey}-${sortDir}`}
                            onChange={(e) => {
                                const [k, d] = e.target.value.split('-') as [
                                    SortKey,
                                    SortDir,
                                ];
                                setSortKey(k);
                                setSortDir(d);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {ORDER_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <div
                            style={{
                                width: 1,
                                height: 18,
                                background: '#e2e8f0',
                                margin: '0 2px',
                            }}
                        />
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {[5, 10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} per page
                                </option>
                            ))}
                        </select>
                        <span
                            style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                marginLeft: 4,
                            }}
                        >
                            {filtered.length} student
                            {filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th
                                    style={{
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                    }}
                                    onClick={() => toggleSort('name')}
                                >
                                    Student{sortIcon('name')}
                                </th>
                                <th>Class</th>
                                {SKILLS.map((sk) => (
                                    <th
                                        key={sk}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            minWidth: 80,
                                        }}
                                        onClick={() => toggleSort(sk)}
                                    >
                                        <KH>{SKILL_KH[sk]}</KH>
                                        <div
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 400,
                                                color: '#94a3b8',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {sk}
                                            {sortIcon(sk)}
                                        </div>
                                    </th>
                                ))}
                                <th
                                    style={{
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        minWidth: 90,
                                    }}
                                    onClick={() => toggleSort('avg')}
                                >
                                    Average{sortIcon('avg')}
                                </th>
                                <th>Level</th>
                                <th style={{ minWidth: 140 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, localIdx) => {
                                const globalIdx =
                                    (page - 1) * perPage + localIdx;
                                const g = gradesForMonth[s.id];
                                const a = avg(g);
                                const isEd = editing.has(s.id);
                                const perf = perfLabel(a);

                                return (
                                    <tr key={s.id}>
                                        {/* Rank — uses global position so medals survive pagination */}
                                        <td style={{ textAlign: 'center' }}>
                                            {globalIdx === 0 &&
                                            sortKey === 'avg' &&
                                            sortDir === 'desc' ? (
                                                <span style={{ fontSize: 16 }}>
                                                    🥇
                                                </span>
                                            ) : globalIdx === 1 &&
                                              sortKey === 'avg' &&
                                              sortDir === 'desc' ? (
                                                <span style={{ fontSize: 16 }}>
                                                    🥈
                                                </span>
                                            ) : globalIdx === 2 &&
                                              sortKey === 'avg' &&
                                              sortDir === 'desc' ? (
                                                <span style={{ fontSize: 16 }}>
                                                    🥉
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#94a3b8',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {globalIdx + 1}
                                                </span>
                                            )}
                                        </td>

                                        {/* Student */}
                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <Avatar
                                                    name={s.nameEn}
                                                    size={32}
                                                />
                                                <div>
                                                    <KH
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 13,
                                                            display: 'block',
                                                        }}
                                                    >
                                                        {s.nameKh}
                                                    </KH>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        {s.nameEn}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Class */}
                                        <td
                                            style={{
                                                fontSize: 12,
                                                color: '#64748b',
                                            }}
                                        >
                                            {s.cls}
                                        </td>

                                        {/* Skill scores */}
                                        {SKILLS.map((sk) => (
                                            <td key={sk}>
                                                {isEd ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={g[sk]}
                                                        onChange={(e) =>
                                                            setGrades((p) => ({
                                                                ...p,
                                                                [s.id]: {
                                                                    ...p[s.id],
                                                                    [sk]: Math.min(
                                                                        100,
                                                                        Math.max(
                                                                            0,
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        ),
                                                                    ),
                                                                },
                                                            }))
                                                        }
                                                        style={{
                                                            width: 60,
                                                            textAlign: 'center',
                                                            border: `1.5px solid ${SKILL_COLOR[sk]}`,
                                                            borderRadius: 6,
                                                            padding: '4px',
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            color: SKILL_COLOR[
                                                                sk
                                                            ],
                                                            outline: 'none',
                                                            background:
                                                                SKILL_COLOR[
                                                                    sk
                                                                ] + '10',
                                                        }}
                                                    />
                                                ) : (
                                                    <ScoreChip score={g[sk]} />
                                                )}
                                            </td>
                                        ))}

                                        {/* Average + bar */}
                                        <td>
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 16,
                                                    color:
                                                        a >= 75
                                                            ? '#10b981'
                                                            : a >= 50
                                                              ? '#3b82f6'
                                                              : '#f59e0b',
                                                    display: 'block',
                                                }}
                                            >
                                                {a}
                                            </span>
                                            <div
                                                style={{
                                                    marginTop: 4,
                                                    width: 60,
                                                }}
                                            >
                                                <PBar
                                                    value={a}
                                                    color={
                                                        a >= 75
                                                            ? 'green'
                                                            : a >= 50
                                                              ? 'blue'
                                                              : 'amber'
                                                    }
                                                />
                                            </div>
                                        </td>

                                        {/* Performance badge */}
                                        <td>
                                            <Badge type={perf.type}>
                                                {perf.label}
                                            </Badge>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 6,
                                                }}
                                            >
                                                {/* View detail button */}
                                                <button
                                                    onClick={() =>
                                                        setViewId(s.id)
                                                    }
                                                    style={{
                                                        background: '#f5f3ff',
                                                        color: '#7c3aed',
                                                        border: '1px solid #ddd6fe',
                                                        borderRadius: 6,
                                                        padding: '5px 10px',
                                                        cursor: 'pointer',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    👁 View
                                                </button>

                                                {isEd ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                saveOne(s.id)
                                                            }
                                                            style={{
                                                                background:
                                                                    '#f0fdf4',
                                                                color: '#16a34a',
                                                                border: '1px solid #86efac',
                                                                borderRadius: 6,
                                                                padding:
                                                                    '5px 10px',
                                                                cursor: 'pointer',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            ✓ Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditing(
                                                                    (p) => {
                                                                        const n =
                                                                            new Set(
                                                                                p,
                                                                            );
                                                                        n.delete(
                                                                            s.id,
                                                                        );
                                                                        return n;
                                                                    },
                                                                );
                                                                setGrades(
                                                                    (p) => ({
                                                                        ...p,
                                                                        [s.id]: {
                                                                            ...s.grade,
                                                                        },
                                                                    }),
                                                                );
                                                            }}
                                                            style={{
                                                                background:
                                                                    '#fff1f2',
                                                                color: '#ef4444',
                                                                border: '1px solid #fca5a5',
                                                                borderRadius: 6,
                                                                padding:
                                                                    '5px 10px',
                                                                cursor: 'pointer',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            setEditing(
                                                                (p) =>
                                                                    new Set([
                                                                        ...p,
                                                                        s.id,
                                                                    ]),
                                                            )
                                                        }
                                                        style={{
                                                            background:
                                                                '#f8fafc',
                                                            color: '#64748b',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 6,
                                                            padding: '5px 10px',
                                                            cursor: 'pointer',
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '60px 0',
                                color: '#94a3b8',
                            }}
                        >
                            <div style={{ fontSize: 40, marginBottom: 12 }}>
                                ⭐
                            </div>
                            <div style={{ fontWeight: 700 }}>
                                No students match this filter
                            </div>
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <Pagination
                            total={filtered.length}
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                            showPerPage={false}
                        />
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
