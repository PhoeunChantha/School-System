import '@/pages/admin/admin.css';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH } from '@/pages/admin/ui';
import { create as createHomework } from '@/routes/admin/homework';
import { alerts as homeworkSubmissionAlerts } from '@/routes/admin/homework-submissions';
import { create as createLessonPlan } from '@/routes/admin/lesson-plans';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarCheck2, ClipboardCheck, NotebookPen, Users } from 'lucide-react';
import type { ReactNode } from 'react';

interface TeacherDashboardProps {
    profile: {
        name: string;
        subject: string;
        photo: string | null;
        assignedClassCount: number;
    };
    stats: {
        classes: number;
        students: number;
        todayClasses: number;
        lessonPlansThisWeek: number;
        plannedLessonPlans: number;
        homeworkDueToday: number;
        pendingSubmissions: number;
    };
    classes: Array<{
        id: number;
        routeKey?: string;
        name: string;
        room: string;
        time: string;
        days: string;
        isToday: boolean;
        students: number;
    }>;
    lessonPlans: Array<{
        id: number;
        routeKey?: string;
        title: string;
        className: string;
        date: string;
        status: string;
    }>;
    homework: Array<{
        id: number;
        routeKey?: string;
        title: string;
        className: string;
        due: string;
        status: string;
        submissions: number;
    }>;
}

export default function TeacherDashboard({ profile, stats, classes, lessonPlans, homework }: TeacherDashboardProps) {
    const todaysClasses = classes.filter(item => item.isToday);

    return (
        <AdminShell>
            <Head title="Teacher Dashboard" />
            <div className="dashboard-surface" style={{ minHeight: '100%' }}>
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Avatar name={profile.name} src={profile.photo} size={58} />
                            <div>
                                <KH style={{ display: 'block', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{profile.name}</KH>
                                <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{profile.subject}</div>
                            </div>
                        </div>
                        <Link href={createLessonPlan.url()} className="admin-quick-link">
                            <BookOpen size={16} />
                            New Lesson Plan
                        </Link>
                    </div>

                    <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                        <Stat icon={<CalendarCheck2 size={21} />} label="Today Classes" value={stats.todayClasses} />
                        <Stat icon={<Users size={21} />} label="Students" value={stats.students} />
                        <Stat icon={<BookOpen size={21} />} label="Plans This Week" value={stats.lessonPlansThisWeek} />
                        <Stat icon={<ClipboardCheck size={21} />} label="Pending Reviews" value={stats.pendingSubmissions} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        <QuickAction href={createLessonPlan.url()} icon={<NotebookPen size={16} />} label="Plan lesson" value={`${stats.plannedLessonPlans} planned`} />
                        <QuickAction href={createHomework.url()} icon={<BookOpen size={16} />} label="Assign homework" value={`${stats.homeworkDueToday} due today`} />
                        <QuickAction href={homeworkSubmissionAlerts.url()} icon={<ClipboardCheck size={16} />} label="Review submissions" value={`${stats.pendingSubmissions} waiting`} />
                    </div>

                    <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16 }}>
                        <Panel title="Today's Classes">
                            {todaysClasses.length === 0 ? (
                                <EmptyState>No classes scheduled for today.</EmptyState>
                            ) : todaysClasses.map(item => (
                                <div key={item.id} className="dashboard-soft-tile" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, border: '1px solid #e8edf5', borderRadius: 12, background: '#f8fafc' }}>
                                    <div>
                                        <div style={{ fontWeight: 900, color: '#1e293b' }}>{item.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.room || 'No room'} {item.time ? `- ${item.time}` : ''}</div>
                                    </div>
                                    <Badge type="blue">{item.students} students</Badge>
                                </div>
                            ))}
                        </Panel>

                        <Panel title="Recent Lesson Plans">
                            {lessonPlans.length === 0 ? (
                                <EmptyState>No lesson plans yet.</EmptyState>
                            ) : lessonPlans.map(item => (
                                <CompactRow key={item.id} title={item.title} meta={`${item.className} - ${item.date}`}>
                                    <Badge type="purple">{item.status}</Badge>
                                </CompactRow>
                            ))}
                        </Panel>
                    </div>

                    <Panel title="All Assigned Classes">
                        {classes.length === 0 ? (
                            <EmptyState>No classes assigned to this teacher account.</EmptyState>
                        ) : classes.map(item => (
                            <CompactRow key={item.id} title={item.name} meta={`${item.days || 'No days'} - ${item.room || 'No room'} ${item.time ? `- ${item.time}` : ''}`}>
                                <Badge type={item.isToday ? 'green' : 'blue'}>{item.students} students</Badge>
                            </CompactRow>
                        ))}
                    </Panel>

                    <Panel title="Homework Activity">
                        {homework.length === 0 ? (
                            <EmptyState>No homework activity yet.</EmptyState>
                        ) : homework.map(item => (
                            <CompactRow key={item.id} title={item.title} meta={`${item.className} - due ${item.due || 'not set'}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Badge type="gray">{item.submissions} submissions</Badge>
                                    <Badge type="green">{item.status}</Badge>
                                </div>
                            </CompactRow>
                        ))}
                    </Panel>
                </div>
            </div>
        </AdminShell>
    );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="stat-card" style={{ padding: 18 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {icon}
            </div>
            <div style={{ color: '#1e293b', fontSize: 24, fontWeight: 900 }}>{value}</div>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>{label}</div>
        </div>
    );
}

function QuickAction({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
    return (
        <Link href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', padding: 14, textDecoration: 'none', boxShadow: '0 10px 28px rgba(15,23,42,.06)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', color: '#1e293b', fontSize: 13, fontWeight: 900 }}>{label}</span>
                    <span style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800 }}>{value}</span>
                </span>
            </span>
        </Link>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#1e293b', fontSize: 15, fontWeight: 900 }}>{title}</div>
            {children}
        </div>
    );
}

function CompactRow({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ color: '#1e293b', fontWeight: 900, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>{meta}</div>
            </div>
            {children}
        </div>
    );
}

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div style={{ padding: 20, border: '1px dashed #cbd5e1', borderRadius: 12, color: '#94a3b8', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
            {children}
        </div>
    );
}



