import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import {
    AlertCircle,
    CalendarCheck,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface AttendanceSummary {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
}

interface AttendanceRecord {
    date: string;
    period: string;
    status: string;
    note: string;
}

interface Props {
    profile: StudentProfile;
    summary: AttendanceSummary;
    records: AttendanceRecord[];
}

const STATUS_CONFIG: Record<
    string,
    { label: string; badgeClass: string; iconColor: string }
> = {
    present: {
        label: 'Present',
        badgeClass: 's-badge-green',
        iconColor: '#059669',
    },
    absent: {
        label: 'Absent',
        badgeClass: 's-badge-red',
        iconColor: '#e11d48',
    },
    late: { label: 'Late', badgeClass: 's-badge-amber', iconColor: '#d97706' },
    excused: {
        label: 'Excused',
        badgeClass: 's-badge-blue',
        iconColor: '#2563eb',
    },
};

function formatDate(d: string) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

function groupByMonth(records: AttendanceRecord[]) {
    const groups: Record<string, AttendanceRecord[]> = {};
    for (const r of records) {
        const key = r.date
            ? new Date(r.date).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
              })
            : 'Unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    }
    return groups;
}

export default function StudentAttendance({
    profile,
    summary,
    records,
}: Props) {
    const [filter, setFilter] = useState<string>('all');

    const filtered =
        filter === 'all' ? records : records.filter((r) => r.status === filter);
    const grouped = groupByMonth(filtered);

    const circumference = 2 * Math.PI * 32;
    const dashOffset = circumference * (1 - summary.rate / 100);

    return (
        <StudentShell
            profile={profile}
            activePage="attendance"
            title="Attendance"
        >
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div
                    className="s-page-accent"
                    style={{ background: '#dcfce7' }}
                >
                    <CalendarCheck size={18} color="#059669" />
                </div>
                <div className="s-page-title">Attendance</div>
            </div>

            {/* ── Summary card ── */}
            <div
                className="s-card s-card-pad s-fade-up s-delay-1"
                style={{ marginBottom: 14 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Circular rate gauge */}
                    <div className="s-circle-wrap" style={{ flexShrink: 0 }}>
                        <svg
                            width={80}
                            height={80}
                            style={{ transform: 'rotate(-90deg)' }}
                        >
                            <circle
                                cx={40}
                                cy={40}
                                r={32}
                                fill="none"
                                stroke="#f1f5f9"
                                strokeWidth={7}
                            />
                            <circle
                                cx={40}
                                cy={40}
                                r={32}
                                fill="none"
                                stroke="#059669"
                                strokeWidth={7}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                style={{
                                    transition: 'stroke-dashoffset 0.6s ease',
                                }}
                            />
                        </svg>
                        <div
                            className="s-circle-text"
                            style={{
                                fontSize: 15,
                                fontFamily: 'DM Serif Display, serif',
                                color: '#059669',
                            }}
                        >
                            {summary.rate}%
                        </div>
                    </div>

                    {/* Counts */}
                    <div
                        style={{
                            flex: 1,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px 16px',
                        }}
                    >
                        {[
                            {
                                label: 'Present',
                                val: summary.present,
                                color: '#059669',
                            },
                            {
                                label: 'Absent',
                                val: summary.absent,
                                color: '#e11d48',
                            },
                            {
                                label: 'Late',
                                val: summary.late,
                                color: '#d97706',
                            },
                            {
                                label: 'Excused',
                                val: summary.excused,
                                color: '#2563eb',
                            },
                        ].map((s) => (
                            <div key={s.label}>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'DM Serif Display, serif',
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
                                    }}
                                >
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    style={{
                        marginTop: 12,
                        fontSize: 11,
                        color: '#9ca3af',
                        fontWeight: 500,
                        textAlign: 'center',
                    }}
                >
                    {summary.total} total sessions recorded
                </div>
            </div>

            {/* ── Filter tabs ── */}
            <div className="s-tabs s-fade-up s-delay-2">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'present', label: 'Present' },
                    { key: 'absent', label: 'Absent' },
                    { key: 'late', label: 'Late' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        className={`s-tab${filter === tab.key ? ' active' : ''}`}
                        aria-selected={filter === tab.key}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Records ── */}
            {Object.keys(grouped).length === 0 ? (
                <div className="s-card s-fade-up s-delay-3">
                    <div className="s-empty">
                        <span className="s-empty-icon">📅</span>
                        <div className="s-empty-text">
                            No attendance records found
                        </div>
                    </div>
                </div>
            ) : (
                Object.entries(grouped).map(([month, recs]) => (
                    <div key={month} className="s-fade-up s-delay-3">
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                margin: '14px 0 8px',
                            }}
                        >
                            {month}
                        </div>
                        <div className="s-card">
                            {recs.map((rec, i) => {
                                const cfg = STATUS_CONFIG[rec.status] ?? {
                                    label: rec.status,
                                    badgeClass: 's-badge-gray',
                                    iconColor: '#9ca3af',
                                };
                                return (
                                    <div key={i} className="s-list-item">
                                        <div
                                            style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: 12,
                                                background:
                                                    cfg.iconColor + '1a',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {rec.status === 'present' && (
                                                <CheckCircle
                                                    size={16}
                                                    color={cfg.iconColor}
                                                />
                                            )}
                                            {rec.status === 'absent' && (
                                                <XCircle
                                                    size={16}
                                                    color={cfg.iconColor}
                                                />
                                            )}
                                            {rec.status === 'late' && (
                                                <Clock
                                                    size={16}
                                                    color={cfg.iconColor}
                                                />
                                            )}
                                            {rec.status === 'excused' && (
                                                <AlertCircle
                                                    size={16}
                                                    color={cfg.iconColor}
                                                />
                                            )}
                                            {![
                                                'present',
                                                'absent',
                                                'late',
                                                'excused',
                                            ].includes(rec.status) && (
                                                <CalendarCheck
                                                    size={16}
                                                    color={cfg.iconColor}
                                                />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#1a1a2e',
                                                    marginBottom: 2,
                                                }}
                                            >
                                                {formatDate(rec.date)}
                                            </div>
                                            {rec.note && (
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#9ca3af',
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {rec.note}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-end',
                                                gap: 3,
                                            }}
                                        >
                                            <span
                                                className={`s-badge ${cfg.badgeClass}`}
                                            >
                                                {cfg.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: '#d1d5db',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {rec.period}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </StudentShell>
    );
}
