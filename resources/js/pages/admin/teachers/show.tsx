import { useEffect, useState } from 'react';
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

/* ─── Responsive CSS injected once ─── */
const RESPONSIVE_CSS = `
/* Hero card */
@media (max-width: 640px) {
    .teacher-hero-inner {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 16px !important;
    }
    .teacher-hero-avatar {
        align-self: center !important;
    }
    .teacher-hero-stats {
        flex-direction: row !important;
        justify-content: center !important;
        gap: 12px !important;
        flex-shrink: unset !important;
        width: 100% !important;
    }
    .teacher-hero-stat {
        flex: 1 !important;
    }
    .teacher-contact-row {
        gap: 12px !important;
    }
}

/* Class header */
@media (max-width: 600px) {
    .class-header-inner {
        gap: 10px !important;
        padding: 12px 14px !important;
    }
    .class-header-meta {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
    }
    .class-header-counts {
        gap: 6px !important;
    }
    .class-header-count-box {
        padding: 4px 10px !important;
    }
    .class-header-count-num {
        font-size: 15px !important;
    }
}

/* Student table → cards on mobile */
@media (max-width: 600px) {
    .student-data-table { display: none !important; }
    .student-card-list  { display: flex !important; }
}
@media (min-width: 601px) {
    .student-card-list  { display: none !important; }
    .student-data-table { display: table !important; }
}
`;

function useInjectCSS(css: string) {
    useEffect(() => {
        const id = 'show-teacher-responsive-css';
        if (document.getElementById(id)) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = css;
        document.head.appendChild(el);
        return () => { document.getElementById(id)?.remove(); };
    }, []);
}

/* ─── Mobile student card ─── */
function StudentMobileCard({ s }: { s: StudentSummary }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderBottom: '1px solid #f1f5f9',
        }}>
            <Avatar name={s.nameEn} src={s.photo} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <KH style={{ fontWeight: 700, fontSize: 13, display: 'block', lineHeight: 1.3 }}>{s.nameKh}</KH>
                <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameEn}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <Badge type={s.fees === 'Paid' ? 'green' : s.fees === 'Partial' ? 'amber' : 'red'}>{s.fees}</Badge>
                    <Badge type={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge>
                </div>
            </div>
            <Link
                href={showStudent.url(s.id)}
                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
                View
            </Link>
        </div>
    );
}

export default function ShowTeacherPage({ teacher, classes }: ShowTeacherProps) {
    useInjectCSS(RESPONSIVE_CSS);
    const [openClass, setOpenClass] = useState<number | null>(classes[0]?.id ?? null);

    return (
        <AdminShell>
            <Head title={teacher.nameEn} />
            <div className="fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Back */}
                <div>
                    <Link href={teacherIndex.url()} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
                        ← Back to Teachers
                    </Link>
                </div>

                {/* ── Hero card ── */}
                <div className="card" style={{ padding: '20px' }}>
                    <div
                        className="teacher-hero-inner"
                        style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}
                    >
                        {/* Avatar */}
                        {teacher.photo
                            ? <img
                                className="teacher-hero-avatar"
                                src={teacher.photo}
                                alt={teacher.nameEn}
                                style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover', border: '3px solid #e2e8f0', flexShrink: 0 }}
                              />
                            : <div
                                className="teacher-hero-avatar"
                                style={{ width: 88, height: 88, borderRadius: 16, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 30, flexShrink: 0 }}
                              >
                                  {teacher.nameEn.charAt(0)}
                              </div>
                        }

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <KH style={{ fontWeight: 800, fontSize: 20, display: 'block', marginBottom: 2 }}>{teacher.nameKh}</KH>
                            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{teacher.nameEn}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Badge type="purple">{teacher.subject}</Badge>
                                <Badge type={teacher.status === 'active' ? 'green' : 'gray'}>{teacher.status}</Badge>
                            </div>
                        </div>

                        {/* Stats */}
                        <div
                            className="teacher-hero-stats"
                            style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}
                        >
                            {[
                                { label: 'Classes',  value: teacher.totalClasses,  color: '#3b82f6' },
                                { label: 'Students', value: teacher.totalStudents, color: '#8b5cf6' },
                            ].map(s => (
                                <div
                                    key={s.label}
                                    className="teacher-hero-stat"
                                    style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: '12px 20px', border: '1px solid #e8edf5' }}
                                >
                                    <div style={{ fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact row */}
                    {(teacher.phone || teacher.telegram) && (
                        <div
                            className="teacher-contact-row"
                            style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 20, flexWrap: 'wrap' }}
                        >
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
                    )}
                </div>

                {/* ── Classes ── */}
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

                            {/* Class header */}
                            <div
                                className="class-header-inner"
                                onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                            >
                                {/* Icon */}
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏫</div>

                                {/* Name + meta */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 3 }}>{cls.name}</div>
                                    <div className="class-header-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 12, color: '#94a3b8' }}>
                                        {cls.time && <span>🕐 {cls.time}</span>}
                                        {cls.days && <span>📅 {cls.days}</span>}
                                        {cls.room && <span>🚪 Room {cls.room}</span>}
                                    </div>
                                </div>

                                {/* Counts + chevron */}
                                <div className="class-header-counts" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <div className="class-header-count-box" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1px solid #e8edf5' }}>
                                        <div className="class-header-count-num" style={{ fontWeight: 800, fontSize: 17, color: '#2563eb' }}>{cls.count}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>students</div>
                                    </div>
                                    {cls.capacity && (
                                        <div className="class-header-count-box" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1px solid #e8edf5' }}>
                                            <div className="class-header-count-num" style={{ fontWeight: 800, fontSize: 17, color: '#94a3b8' }}>{cls.capacity}</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>capacity</div>
                                        </div>
                                    )}
                                    <span style={{ fontSize: 16, color: '#94a3b8', marginLeft: 2 }}>
                                        {openClass === cls.id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {/* Student list */}
                            {openClass === cls.id && (
                                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                                    {cls.students.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                            No students enrolled yet.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop table */}
                                            <table className="data-table student-data-table">
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

                                            {/* Mobile card list */}
                                            <div className="student-card-list" style={{ display: 'none', flexDirection: 'column' }}>
                                                {cls.students.map(s => (
                                                    <StudentMobileCard key={s.id} s={s} />
                                                ))}
                                            </div>
                                        </>
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