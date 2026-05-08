import { useState } from 'react';
import { index as teacherIndex } from '@/actions/App/Http/Controllers/Backends/TeacherController';
import { show as showStudent } from '@/actions/App/Http/Controllers/Backends/StudentController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';

interface StudentSummary {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    fees: 'Paid' | 'Unpaid' | 'Partial';
    status: string;
}

interface ClassDetail {
    id: number;
    name: string;
    room: string;
    time: string;
    days: string;
    capacity: number | null;
    count: number;
    students: StudentSummary[];
}

interface TeacherDetail {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    subject: string;
    phone: string | null;
    telegram: string | null;
    status: string;
    totalClasses: number;
    totalStudents: number;
}

interface ShowTeacherProps {
    teacher: TeacherDetail;
    classes: ClassDetail[];
}

export default function ShowTeacherPage({ teacher, classes }: ShowTeacherProps) {
    const [openClass, setOpenClass] = useState<number | null>(classes[0]?.id ?? null);

    return (
        <AdminShell>
            <Head title={teacher.nameEn} />
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Back */}
                <div>
                    <Link href={teacherIndex.url()} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
                        ← Back to Teachers
                    </Link>
                </div>

                {/* Hero */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* Photo */}
                        {teacher.photo
                            ? <img src={teacher.photo} alt={teacher.nameEn} style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover', border: '3px solid #e2e8f0', flexShrink: 0 }} />
                            : <div style={{ width: 88, height: 88, borderRadius: 16, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 30, flexShrink: 0 }}>
                                {teacher.nameEn.charAt(0)}
                            </div>
                        }

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 2 }}>{teacher.nameKh}</KH>
                            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{teacher.nameEn}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Badge type="purple">{teacher.subject}</Badge>
                                <Badge type={teacher.status === 'active' ? 'green' : 'gray'}>{teacher.status}</Badge>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Classes',  value: teacher.totalClasses,  color: '#3b82f6' },
                                { label: 'Students', value: teacher.totalStudents, color: '#8b5cf6' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: '12px 20px' }}>
                                    <div style={{ fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact row */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        {teacher.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                                <span style={{ fontSize: 16 }}>📞</span>
                                <span style={{ fontWeight: 600 }}>{teacher.phone}</span>
                            </div>
                        )}
                        {teacher.telegram && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                                <span style={{ fontSize: 16 }}>✈️</span>
                                <span style={{ fontWeight: 600 }}>{teacher.telegram}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Classes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                        Classes <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>({classes.length})</span>
                    </div>

                    {classes.length === 0 && (
                        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                            No classes assigned yet.
                        </div>
                    )}

                    {classes.map(cls => (
                        <div key={cls.id} className="card" style={{ overflow: 'hidden' }}>

                            {/* Class header — click to expand */}
                            <div
                                onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}
                            >
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏫</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{cls.name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                        {cls.time && <span>🕐 {cls.time}</span>}
                                        {cls.days && <span style={{ marginLeft: 10 }}>📅 {cls.days}</span>}
                                        {cls.room && <span style={{ marginLeft: 10 }}>🚪 Room {cls.room}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                    <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '6px 14px' }}>
                                        <div style={{ fontWeight: 800, fontSize: 18, color: '#2563eb' }}>{cls.count}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>students</div>
                                    </div>
                                    {cls.capacity && (
                                        <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '6px 14px' }}>
                                            <div style={{ fontWeight: 800, fontSize: 18, color: '#94a3b8' }}>{cls.capacity}</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>capacity</div>
                                        </div>
                                    )}
                                    <span style={{ fontSize: 18, color: '#94a3b8', marginLeft: 4 }}>
                                        {openClass === cls.id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {/* Student list */}
                            {openClass === cls.id && (
                                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                    {cls.students.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No students enrolled yet.</div>
                                    ) : (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Fee Status</th>
                                                    <th>Status</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cls.students.map(s => (
                                                    <tr key={s.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <Avatar name={s.nameEn} src={s.photo} size={32} />
                                                                <div>
                                                                    <KH style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{s.nameKh}</KH>
                                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nameEn}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Badge type={s.fees === 'Paid' ? 'green' : s.fees === 'Partial' ? 'amber' : 'red'}>
                                                                {s.fees}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge type={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge>
                                                        </td>
                                                        <td>
                                                            <Link href={showStudent.url(s.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                                                View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </AdminShell>
    );
}
