import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

interface HomeworkItem {
    id: number;
    title: string;
    due: string;
    points: number;
    status: string;
    submissionStatus: string;
    submittedAt: string;
}

interface Props {
    profile: StudentProfile;
    summary: {
        total: number;
        submitted: number;
        pending: number;
    };
    items: HomeworkItem[];
}

function formatDate(date: string) {
    if (!date) return 'No due date';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function isOverdue(item: HomeworkItem) {
    return item.submissionStatus === 'pending' && item.due && new Date(item.due).getTime() < Date.now();
}

export default function StudentHomeworkCalendar({
    profile,
    summary,
    items,
}: Props) {
    return (
        <StudentShell
            profile={profile}
            activePage="homework-calendar"
            title="Homework Calendar"
        >
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#fef3c7' }}>
                    <BookOpen size={18} color="#d97706" />
                </div>
                <div>
                    <div className="s-page-title">Homework Calendar</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Due dates and submission status
                    </div>
                </div>
            </div>

            <div className="s-card s-card-pad s-fade-up s-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                    { label: 'Total', value: summary.total, color: '#2563eb' },
                    { label: 'Done', value: summary.submitted, color: '#059669' },
                    { label: 'Pending', value: summary.pending, color: '#d97706' },
                ].map((item) => (
                    <div key={item.label}>
                        <div style={{ color: item.color, fontSize: 26, fontWeight: 950, lineHeight: 1 }}>{item.value}</div>
                        <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800, marginTop: 4 }}>{item.label}</div>
                    </div>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="s-card">
                    <div className="s-empty">
                        <span className="s-empty-icon">Homework</span>
                        <div className="s-empty-text">No homework due dates yet</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-2">
                    {items.map((item) => {
                        const done = item.submissionStatus !== 'pending';
                        const overdue = isOverdue(item);
                        const color = done ? '#059669' : overdue ? '#e11d48' : '#d97706';

                        return (
                            <div key={item.id} className="s-list-item">
                                <div style={{ width: 42, height: 42, borderRadius: 14, background: `${color}16`, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                    {done ? <CheckCircle2 size={17} /> : <Clock size={17} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 900 }}>
                                        {item.title}
                                    </div>
                                    <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                                        Due {formatDate(item.due)} · {item.points} pts
                                    </div>
                                </div>
                                <span className={`s-badge ${done ? 's-badge-green' : overdue ? 's-badge-red' : 's-badge-amber'}`}>
                                    {done ? item.submissionStatus : overdue ? 'Overdue' : 'Pending'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </StudentShell>
    );
}
