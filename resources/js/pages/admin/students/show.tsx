import { useState } from 'react';
import { edit as editStudent, index as studentIndex } from '@/actions/App/Http/Controllers/Backends/StudentController';
import AdminShell from '@/pages/admin/shell';
import { Badge, KH, ScoreChip } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, CalendarDays, Edit3, TriangleAlert } from 'lucide-react';

//  Types â”€

interface StudentDetail {
    id: number;
    routeKey?: string;
    code: string | null;
    photo: string | null;
    nameKh: string;
    nameEn: string;
    gender: string | null;
    dateOfBirth: string | null;
    age: number | null;
    province: string | null;
    district: string | null;
    commune: string | null;
    village: string | null;
    parentPhone: string | null;
    telegram: string | null;
    level: string;
    class: string;
    teacher: string;
    room: string;
    schedule: string;
    days: string;
    monthlyFee: number;
    scholarshipAmount: number;
    feeStatus: 'Paid' | 'Unpaid' | 'Partial';
    status: string;
    enrolledOn: string | null;
    attendanceRate: number;
}

interface GradeRecord {
    id: number;
    routeKey?: string;
    period: string;
    type: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    gradedAt: string | null;
}

interface AttendanceRecord {
    id: number;
    routeKey?: string;
    date: string | null;
    period: string;
    status: string;
    note: string | null;
}

interface Payment {
    id: number;
    routeKey?: string;
    amount: number;
    method: string;
    paidOn: string | null;
    reference: string | null;
}

interface FeeCharge {
    id: number;
    routeKey?: string;
    billingMonth: string;
    amount: number;
    discountAmount: number;
    paidAmount: number;
    status: string;
    dueOn: string | null;
    payments: Payment[];
}

interface HomeworkRecord {
    id: number;
    routeKey?: string;
    title: string;
    points: number;
    dueOn: string | null;
    score: number | null;
    status: string;
    submittedAt: string | null;
}

interface Certificate {
    id: number;
    routeKey?: string;
    type: string;
    title: string;
    number: string;
    issuedOn: string | null;
    status: string;
}

interface ShowStudentProps {
    student: StudentDetail;
    grades: GradeRecord[];
    attendance: AttendanceRecord[];
    fees: FeeCharge[];
    homework: HomeworkRecord[];
    certificates: Certificate[];
}

//  Helpers 

type Tab = 'overview' | 'grades' | 'attendance' | 'fees' | 'homework';

const feeColor = (status: string) =>
    status === 'paid' || status === 'Paid' ? '#10b981' : status === 'partial' || status === 'Partial' ? '#f59e0b' : '#ef4444';

const attColor = (status: string) => ({
    present: '#10b981', late: '#f59e0b', excused: '#3b82f6', absent: '#ef4444',
} as Record<string, string>)[status] ?? '#94a3b8';

const attBg = (status: string) => ({
    present: '#f0fdf4', late: '#fffbeb', excused: '#eff6ff', absent: '#fef2f2',
} as Record<string, string>)[status] ?? '#f8fafc';

export default function ShowStudentPage({ student, grades, attendance, fees, homework, certificates }: ShowStudentProps) {
    const [tab, setTab] = useState<Tab>('overview');

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'overview',   label: 'Overview' },
        { id: 'grades',     label: 'Grades',     count: grades.length },
        { id: 'attendance', label: 'Attendance', count: attendance.length },
        // { id: 'fees',       label: 'Fees',       count: fees.length },
        { id: 'homework',   label: 'Homework',   count: homework.length },
    ];

    return (
        <AdminShell>
            <Head title={student.nameEn} />
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/*  Back  */}
                <div>
                    <Link href={studentIndex.url()} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ArrowLeft size={14} /> Back to Students
                        </span>
                    </Link>
                </div>

                {/*  Hero card  */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* Photo */}
                        <div style={{ flexShrink: 0 }}>
                            {student.photo
                                ? <img src={student.photo} alt={student.nameEn} style={{ width: 96, height: 96, borderRadius: 16, objectFit: 'cover', border: '3px solid #e2e8f0' }} />
                                : (
                                    <div style={{ width: 96, height: 96, borderRadius: 16, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 32 }}>
                                        {student.nameEn.charAt(0)}
                                    </div>
                                )
                            }
                        </div>

                        {/* Name & badges */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <KH style={{ fontWeight: 800, fontSize: 22, display: 'block', marginBottom: 2 }}>{student.nameKh}</KH>
                            <div style={{ fontSize: 15, color: '#64748b', marginBottom: 10 }}>{student.nameEn}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Badge type="blue">{student.level}</Badge>
                                <Badge type="purple">{student.class}</Badge>
                                <Badge type={student.status === 'active' ? 'green' : 'gray'}>{student.status}</Badge>
                                <Badge type={student.feeStatus === 'Paid' ? 'green' : student.feeStatus === 'Partial' ? 'amber' : 'red'}>
                                    {student.feeStatus}
                                </Badge>
                                {student.attendanceRate < 70 && (
                                    <Badge type="red">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <TriangleAlert size={12} /> Low Attendance
                                        </span>
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, flex: '1 1 280px', minWidth: 0 }}>
                            {[
                                { label: 'Attendance', value: `${student.attendanceRate}%`, color: student.attendanceRate >= 80 ? '#10b981' : '#ef4444' },
                                { label: 'Monthly Fee', value: `$${student.monthlyFee.toFixed(0)}`, color: '#2563eb' },
                                { label: 'Enrolled', value: student.enrolledOn ?? '-', color: '#64748b' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: '12px 16px', minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Edit button */}
                        <Link href={editStudent.url((student.routeKey ?? student.id) as never)} style={{ background: '#2563eb', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Edit3 size={14} /> Edit
                            </span>
                        </Link>
                    </div>
                </div>

                {/*  Tabs  */}
                <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #f1f5f9', paddingBottom: 0, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: tab === t.id ? '#2563eb' : '#64748b', borderBottom: tab === t.id ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {t.label}
                            {t.count !== undefined && (
                                <span style={{ background: tab === t.id ? '#dbeafe' : '#f1f5f9', color: tab === t.id ? '#2563eb' : '#94a3b8', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/*  Overview tab  */}
                {tab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                        {/* Personal info */}
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>Personal Information</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Code',         value: student.code ?? '-' },
                                    { label: 'Gender',       value: student.gender ? (student.gender === 'male' ? 'Male' : 'Female') : '-' },
                                    { label: 'Date of Birth', value: student.dateOfBirth ?? '-' },
                                    { label: 'Age',          value: student.age != null ? `${student.age} years` : '-' },
                                    { label: 'Province',     value: student.province ?? '-' },
                                    { label: 'District',     value: student.district ?? '-' },
                                    { label: 'Commune',      value: student.commune ?? '-' },
                                    { label: 'Village',      value: student.village ?? '-' },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                        <span style={{ color: '#1e293b', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Contact */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>Contact</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { label: 'Parent Phone', value: student.parentPhone ?? '-' },
                                        { label: 'Telegram',     value: student.telegram ?? '-' },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                            <span style={{ color: '#1e293b', fontWeight: 700 }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Academic */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>Academic</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { label: 'Level',    value: student.level },
                                        { label: 'Class',    value: student.class },
                                        { label: 'Teacher',  value: student.teacher },
                                        { label: 'Room',     value: student.room },
                                        { label: 'Schedule', value: student.schedule },
                                        { label: 'Days',     value: student.days },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                            <span style={{ color: '#1e293b', fontWeight: 700 }}>{row.value || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Latest grades */}
                            {grades[0] && (
                                <div className="card" style={{ padding: 20 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>Latest Scores - {grades[0].period}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                        {[
                                            { label: 'Speaking',  value: grades[0].speaking },
                                            { label: 'Listening', value: grades[0].listening },
                                            { label: 'Reading',   value: grades[0].reading },
                                            { label: 'Writing',   value: grades[0].writing },
                                        ].map(s => (
                                            <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '10px 8px' }}>
                                                <ScoreChip score={s.value} />
                                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                                        Average: <strong style={{ fontSize: 16, color: '#2563eb' }}>{grades[0].average}</strong>
                                    </div>
                                </div>
                            )}

                            {/* Certificates */}
                            {certificates.length > 0 && (
                                <div className="card" style={{ padding: 20 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Certificates <Award size={15} color="#d97706" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {certificates.map(c => (
                                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                                                    <div style={{ fontSize: 11, color: '#92400e' }}>{c.number} - {c.issuedOn}</div>
                                                </div>
                                                <Badge type="amber">{c.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/*  Grades tab  */}
                {tab === 'grades' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        {grades.length === 0
                            ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No grade records yet.</div>
                            : (
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Period</th><th>Type</th><th>Speaking</th><th>Listening</th><th>Reading</th><th>Writing</th><th>Average</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {grades.map(g => (
                                            <tr key={g.id}>
                                                <td style={{ fontWeight: 700 }}>{g.period}</td>
                                                <td><Badge type="gray">{g.type}</Badge></td>
                                                <td><ScoreChip score={g.speaking} /></td>
                                                <td><ScoreChip score={g.listening} /></td>
                                                <td><ScoreChip score={g.reading} /></td>
                                                <td><ScoreChip score={g.writing} /></td>
                                                <td><span style={{ fontWeight: 800, fontSize: 15, color: g.average >= 75 ? '#10b981' : g.average >= 50 ? '#3b82f6' : '#ef4444' }}>{g.average}</span></td>
                                                <td style={{ fontSize: 11, color: '#94a3b8' }}>{g.gradedAt}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                )}

                {/*  Attendance tab  */}
                {tab === 'attendance' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                            {(['present', 'late', 'excused', 'absent'] as const).map(s => {
                                const count = attendance.filter(a => a.status === s).length;
                                return (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: attColor(s), display: 'inline-block' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'capitalize' }}>{s}</span>
                                        <span style={{ fontWeight: 800, color: '#1e293b' }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {attendance.length === 0
                            ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No attendance records yet.</div>
                            : (
                                <table className="data-table">
                                    <thead><tr><th>Date</th><th>Period</th><th>Status</th><th>Note</th></tr></thead>
                                    <tbody>
                                        {attendance.map(a => (
                                            <tr key={a.id}>
                                                <td style={{ fontWeight: 700 }}>
                                                    {a.date
                                                        ? new Date(a.date).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        }).replace(' ', ',').replace(',', ', ')
                                                        : '-'}
                                                    </td>
                                                <td style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{a.period}</td>
                                                <td>
                                                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: attBg(a.status), color: attColor(a.status), textTransform: 'capitalize' }}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12, color: '#94a3b8' }}>{a.note ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                )}

                {/*  Fees tab  */}
                {tab === 'fees' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {fees.length === 0
                            ? <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No fee records yet.</div>
                            : fees.map(fc => (
                                <div key={fc.id} className="card" style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fc.payments.length > 0 ? 12 : 0 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{fc.billingMonth?.slice(0, 7)}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Due: {fc.dueOn ? new Date(fc.dueOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: 16 }}>${fc.amount.toFixed(2)}</div>
                                            <div style={{ fontSize: 12, color: feeColor(fc.status), fontWeight: 700, textTransform: 'capitalize' }}>{fc.status}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 12 }}>
                                            <div style={{ color: '#94a3b8' }}>Paid: <strong style={{ color: '#10b981' }}>${fc.paidAmount.toFixed(2)}</strong></div>
                                            {fc.discountAmount > 0 && <div style={{ color: '#94a3b8' }}>Discount: ${fc.discountAmount.toFixed(2)}</div>}
                                        </div>
                                    </div>
                                    {fc.payments.length > 0 && (
                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {fc.payments.map(p => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', padding: '4px 8px', background: '#f8fafc', borderRadius: 8 }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} /> {p.paidOn}</span>
                                                    <span style={{ fontWeight: 700 }}>${p.amount.toFixed(2)}</span>
                                                    <Badge type="blue">{p.method}</Badge>
                                                    <span style={{ color: '#94a3b8' }}>{p.reference ?? '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                )}

                {/*  Homework tab  */}
                {tab === 'homework' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        {homework.length === 0
                            ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No homework records yet.</div>
                            : (
                                <table className="data-table">
                                    <thead><tr><th>Title</th><th>Due</th><th>Status</th><th>Score / Points</th><th>Submitted</th></tr></thead>
                                    <tbody>
                                        {homework.map(h => (
                                            <tr key={h.id}>
                                                <td style={{ fontWeight: 700 }}>{h.title}</td>
                                                <td style={{ fontSize: 12, color: '#64748b' }}>{h.dueOn ? new Date(h.dueOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                                <td>
                                                    <Badge type={h.status === 'graded' ? 'green' : h.status === 'submitted' ? 'blue' : h.status === 'missing' ? 'red' : 'gray'}>
                                                        {h.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {h.score != null
                                                        ? <span style={{ fontWeight: 700 }}>{h.score} / {h.points}</span>
                                                        : <span style={{ color: '#94a3b8' }}>- / {h.points}</span>
                                                    }
                                                </td>
                                                <td style={{ fontSize: 11, color: '#94a3b8' }}>{h.submittedAt ? h.submittedAt.slice(0, 10) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                )}

            </div>
        </AdminShell>
    );
}



