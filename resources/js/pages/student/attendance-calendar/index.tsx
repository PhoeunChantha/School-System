import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { CalendarCheck } from 'lucide-react';

interface RecordItem {
    date: string;
    period: string;
    status: string;
    note: string;
}

interface Props {
    profile: StudentProfile;
    summary: {
        total: number;
        present: number;
        absent: number;
    };
    records: RecordItem[];
}

function statusColor(status: string) {
    if (status === 'present') return '#059669';
    if (status === 'late') return '#d97706';
    if (status === 'excused') return '#2563eb';
    return '#e11d48';
}

function dayNumber(date: string) {
    return date ? new Date(date).getDate() : '';
}

function monthLabel(date: string) {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    });
}

export default function StudentAttendanceCalendar({
    profile,
    summary,
    records,
}: Props) {
    return (
        <StudentShell
            profile={profile}
            activePage="attendance-calendar"
            title="Attendance Calendar"
        >
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#ecfdf5' }}>
                    <CalendarCheck size={18} color="#059669" />
                </div>
                <div>
                    <div className="s-page-title">Attendance Calendar</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Present, absent, late, and excused days
                    </div>
                </div>
            </div>

            <div className="s-card s-card-pad s-fade-up s-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                    { label: 'Total', value: summary.total, color: '#2563eb' },
                    { label: 'Present', value: summary.present, color: '#059669' },
                    { label: 'Absent', value: summary.absent, color: '#e11d48' },
                ].map((item) => (
                    <div key={item.label}>
                        <div style={{ color: item.color, fontSize: 26, fontWeight: 950, lineHeight: 1 }}>{item.value}</div>
                        <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800, marginTop: 4 }}>{item.label}</div>
                    </div>
                ))}
            </div>

            {records.length === 0 ? (
                <div className="s-card">
                    <div className="s-empty">
                        <span className="s-empty-icon">Calendar</span>
                        <div className="s-empty-text">No attendance records yet</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-card-pad s-fade-up s-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {records.map((record, index) => {
                        const color = statusColor(record.status);

                        return (
                            <div
                                key={`${record.date}-${index}`}
                                style={{
                                    minHeight: 78,
                                    borderRadius: 18,
                                    background: `${color}12`,
                                    border: `1px solid ${color}44`,
                                    padding: 10,
                                }}
                            >
                                <div style={{ color, fontSize: 22, fontWeight: 950, lineHeight: 1 }}>
                                    {dayNumber(record.date)}
                                </div>
                                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 800, marginTop: 4 }}>
                                    {monthLabel(record.date)}
                                </div>
                                <div style={{ color, fontSize: 10, fontWeight: 900, marginTop: 8, textTransform: 'capitalize' }}>
                                    {record.status}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
