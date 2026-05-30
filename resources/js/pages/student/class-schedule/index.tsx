import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';

interface Schedule {
    className: string;
    teacher: string;
    room: string;
    startsAt: string;
    endsAt: string;
    days: string[];
}

interface Props {
    profile: StudentProfile;
    schedule: Schedule | [];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isActiveDay(days: string[], day: string) {
    return days.map((d) => d.toLowerCase().slice(0, 3)).includes(day.toLowerCase());
}

export default function StudentClassSchedule({ profile, schedule }: Props) {
    const item = Array.isArray(schedule) ? null : schedule;
    const days = item?.days ?? [];

    return (
        <StudentShell
            profile={profile}
            activePage="class-schedule"
            title="Class Schedule"
        >
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#dbeafe' }}>
                    <CalendarDays size={18} color="#2563eb" />
                </div>
                <div>
                    <div className="s-page-title">Class Schedule</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Weekly class timetable
                    </div>
                </div>
            </div>

            {!item ? (
                <div className="s-card">
                    <div className="s-empty">
                        <span className="s-empty-icon">Schedule</span>
                        <div className="s-empty-text">No class assigned yet</div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="s-card s-card-pad s-fade-up s-delay-1" style={{ marginBottom: 14 }}>
                        <div style={{ color: '#1a1a2e', fontSize: 22, fontWeight: 950 }}>
                            {item.className}
                        </div>
                        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                            {[
                                { icon: Clock, label: `${item.startsAt} - ${item.endsAt}` },
                                { icon: UserRound, label: item.teacher || 'No teacher assigned' },
                                { icon: MapPin, label: item.room || 'No room assigned' },
                            ].map((row) => {
                                const Icon = row.icon;

                                return (
                                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ width: 34, height: 34, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                                            <Icon size={16} />
                                        </span>
                                        <span style={{ color: '#334155', fontSize: 13, fontWeight: 800 }}>
                                            {row.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="s-card s-card-pad s-fade-up s-delay-2">
                        <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
                            Study Days
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                            {DAYS.map((day) => {
                                const active = isActiveDay(days, day);

                                return (
                                    <div
                                        key={day}
                                        style={{
                                            minHeight: 52,
                                            borderRadius: 15,
                                            background: active ? '#2563eb' : '#f1f5f9',
                                            color: active ? '#ffffff' : '#94a3b8',
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontSize: 11,
                                            fontWeight: 950,
                                        }}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </StudentShell>
    );
}
