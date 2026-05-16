import '@/pages/admin/admin.css';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardCheck, GraduationCap, NotebookPen, Users } from 'lucide-react';
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
        lessonPlansThisWeek: number;
        pendingSubmissions: number;
    };
    classes: Array<{
        id: number;
    routeKey?: string;
        name: string;
        room: string;
        time: string;
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
                        <Link href="/admin/lesson-plans/create" className="admin-quick-link">
                            <BookOpen size={16} />
                            New Lesson Plan
                        </Link>
                    </div>

                    <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                        <Stat icon={<GraduationCap size={21} />} label="Assigned Classes" value={stats.classes} />
                        <Stat icon={<Users size={21} />} label="Students" value={stats.students} />
                        <Stat icon={<BookOpen size={21} />} label="Plans This Week" value={stats.lessonPlansThisWeek} />
                        <Stat icon={<ClipboardCheck size={21} />} label="Pending Reviews" value={stats.pendingSubmissions} />
                    </div>

                    <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16 }}>
                        <Panel title="My Classes">
                            {classes.length === 0 ? (
                                <EmptyState>No classes assigned to this teacher account.</EmptyState>
                            ) : classes.map(item => (
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



