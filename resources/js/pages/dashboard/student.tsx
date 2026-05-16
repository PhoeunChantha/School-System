import '@/pages/admin/admin.css';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, PBar } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';
import { Award, ClipboardCheck, CreditCard, NotebookPen } from 'lucide-react';
import type { ReactNode } from 'react';

interface StudentDashboardProps {
    profile: {
        name: string;
        code: string;
        photo: string | null;
        className: string;
        level: string;
    };
    stats: {
        attendanceRate: number;
        latestAverage: number;
        homeworkSubmitted: number;
        unpaidFees: number;
    };
    latestGrades: Array<{
        id: number;
    routeKey?: string;
        period: string;
        average: number;
        speaking: number;
        listening: number;
        reading: number;
        writing: number;
        date: string;
    }>;
    homework: Array<{
        id: number;
    routeKey?: string;
        title: string;
        due: string;
        submitted: string;
        score: number | null;
        status: string;
    }>;
    fees: Array<{
        id: number;
        routeKey?: string;
        month: string;
        due: string;
        amount: number;
        paid: number;
        status: string;
    }>;
}

export default function StudentDashboard({ profile, stats, latestGrades, homework, fees }: StudentDashboardProps) {
    return (
        <AdminShell>
            <Head title="Student Dashboard" />
            <div className="dashboard-surface" style={{ minHeight: '100%' }}>
                <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Avatar name={profile.name} src={profile.photo} size={58} />
                            <div>
                                <KH style={{ display: 'block', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{profile.name}</KH>
                                <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{profile.className}</div>
                                {profile.level && <div style={{ color: '#94a3b8', fontSize: 12 }}>{profile.level}{profile.code ? ` - ${profile.code}` : ''}</div>}
                            </div>
                        </div>
                        <Link href="/admin/homework-submissions/create" className="admin-quick-link">
                            <NotebookPen size={16} />
                            Submit Homework
                        </Link>
                    </div>

                    <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                        <Stat icon={<ClipboardCheck size={21} />} label="Attendance" value={`${stats.attendanceRate}%`} />
                        <Stat icon={<Award size={21} />} label="Latest Average" value={`${stats.latestAverage}%`} />
                        <Stat icon={<NotebookPen size={21} />} label="Homework Sent" value={stats.homeworkSubmitted} />
                        <Stat icon={<CreditCard size={21} />} label="Open Fees" value={stats.unpaidFees} />
                    </div>

                    <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16 }}>
                        <Panel title="Latest Grades">
                            {latestGrades.length === 0 ? (
                                <EmptyState>No grade records found for this student account.</EmptyState>
                            ) : latestGrades.map(grade => (
                                <div key={grade.id} className="dashboard-soft-tile" style={{ padding: 14, border: '1px solid #e8edf5', borderRadius: 12, background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                                        <div>
                                            <div style={{ color: '#1e293b', fontWeight: 900 }}>{grade.period}</div>
                                            <div style={{ color: '#94a3b8', fontSize: 11 }}>{grade.date}</div>
                                        </div>
                                        <Badge type={grade.average >= 75 ? 'green' : grade.average >= 50 ? 'blue' : 'amber'}>{grade.average}%</Badge>
                                    </div>
                                    <PBar value={grade.average} color={grade.average >= 75 ? '#10b981' : '#2563eb'} />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10, color: '#64748b', fontSize: 11, fontWeight: 800 }}>
                                        <span>S {grade.speaking}</span>
                                        <span>L {grade.listening}</span>
                                        <span>R {grade.reading}</span>
                                        <span>W {grade.writing}</span>
                                    </div>
                                </div>
                            ))}
                        </Panel>

                        <Panel title="Homework">
                            {homework.length === 0 ? (
                                <EmptyState>No homework submissions yet.</EmptyState>
                            ) : homework.map(item => (
                                <CompactRow key={item.id} title={item.title} meta={`Due ${item.due || 'not set'} - submitted ${item.submitted || 'pending'}`}>
                                    <Badge type={item.status === 'graded' ? 'green' : 'blue'}>{item.score ?? item.status}</Badge>
                                </CompactRow>
                            ))}
                        </Panel>
                    </div>

                    <Panel title="Fee Summary">
                        {fees.length === 0 ? (
                            <EmptyState>No fee charges found.</EmptyState>
                        ) : fees.map(item => (
                            <CompactRow key={item.id} title={item.month} meta={`Due ${item.due || 'not set'} - paid $${item.paid.toFixed(2)} / $${item.amount.toFixed(2)}`}>
                                <Badge type={item.status === 'paid' ? 'green' : item.status === 'partial' ? 'amber' : 'red'}>{item.status}</Badge>
                            </CompactRow>
                        ))}
                    </Panel>
                </div>
            </div>
        </AdminShell>
    );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
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



