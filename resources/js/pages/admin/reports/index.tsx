import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, PBar, ScoreChip } from '@/pages/admin/ui';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import type { LucideIcon } from 'lucide-react';
import {
    ChartNoAxesColumn,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    DollarSign,
    Download,
    GraduationCap,
    Hourglass,
    Printer,
    Star,
    TriangleAlert,
    XCircle,
} from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import { toast } from 'sonner';

type ReportTab = 'attendance' | 'grades' | 'fees';

interface Summary {
    totalStudents: number;
    avgAttendance: number;
    avgGrade: number;
    feesCollected: number;
    paidCount: number;
    unpaidCount: number;
    outstandingFees: number;
}

interface ClassAttendanceRow {
    id: number;
    name: string;
    teacher: string;
    attendance: number;
    studentCount: number;
}

interface StudentReportRow {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    className: string;
    level: string;
    attendance: number;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    feeStatus: string;
    monthlyFee: number;
}

interface SkillAverageRow {
    key: string;
    labelKh: string;
    label: string;
    average: number;
}

interface PaymentRow {
    id: number;
    studentNameKh: string;
    studentNameEn: string;
    amount: number;
    method: string;
    date: string;
    status: string;
}

interface FeeStudentRow {
    id: number;
    nameKh: string;
    nameEn: string;
    photo: string | null;
    level: string;
    amount: number;
    status: string;
}

interface ReportsPageProps {
    reportDate: string;
    summary: Summary;
    attendance: {
        classes: ClassAttendanceRow[];
        students: StudentReportRow[];
    };
    grades: {
        skills: SkillAverageRow[];
        students: StudentReportRow[];
    };
    fees: {
        payments: PaymentRow[];
        students: FeeStudentRow[];
    };
}

function badgeIcon(Icon: LucideIcon, label: string) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon size={12} strokeWidth={2.6} />
            {label}
        </span>
    );
}

function money(value: number): string {
    return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function attendanceColor(value: number): 'green' | 'amber' | 'red' {
    if (value >= 80) {
        return 'green';
    }

    if (value >= 60) {
        return 'amber';
    }

    return 'red';
}

function gradeColor(value: number): string {
    if (value >= 75) {
        return '#10b981';
    }

    if (value >= 50) {
        return '#3b82f6';
    }

    return '#f59e0b';
}

function feeBadgeType(status: string): 'green' | 'red' | 'amber' | 'blue' {
    if (status === 'paid') {
        return 'green';
    }

    if (status === 'unpaid') {
        return 'red';
    }

    if (status === 'partial' || status === 'pending') {
        return 'amber';
    }

    return 'blue';
}

function paymentStatusLabel(status: string) {
    if (status === 'paid') {
        return badgeIcon(CheckCircle2, 'Paid');
    }

    if (status === 'pending') {
        return badgeIcon(Hourglass, 'Pending');
    }

    if (status === 'failed') {
        return badgeIcon(XCircle, 'Failed');
    }

    return status || 'Unknown';
}

function LocalizedCopy({
    isKh,
    kh,
    en,
    style,
}: {
    isKh: boolean;
    kh: string;
    en: string;
    style?: CSSProperties;
}) {
    if (isKh) {
        return <KH style={style}>{kh}</KH>;
    }

    return <span style={style}>{en}</span>;
}

function PersonName({
    isKh,
    kh,
    en,
    primaryStyle,
    secondaryStyle,
}: {
    isKh: boolean;
    kh?: string;
    en: string;
    primaryStyle?: CSSProperties;
    secondaryStyle?: CSSProperties;
}) {
    const hasKhmerName = Boolean(kh?.trim());

    if (isKh && hasKhmerName) {
        return (
            <>
                <KH style={primaryStyle}>{kh}</KH>
                <div style={secondaryStyle}>{en}</div>
            </>
        );
    }

    return <div style={primaryStyle}>{en || kh}</div>;
}

function downloadCsv(
    filename: string,
    rows: Record<string, string | number>[],
): void {
    if (rows.length === 0) {
        toast.info('No data to export.');
        return;
    }

    const headers = Object.keys(rows[0]);
    const escape = (value: string | number) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
        headers.map(escape).join(','),
        ...rows.map((row) =>
            headers.map((header) => escape(row[header])).join(','),
        ),
    ].join('\n');

    const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export default function ReportsPage({
    reportDate,
    summary,
    attendance,
    grades,
    fees,
}: ReportsPageProps) {
    const { lang } = useAdminTranslation();
    const [tab, setTab] = useState<ReportTab>('attendance');
    const isKh = lang === 'kh';

    const handleExport = () => {
        if (tab === 'attendance') {
            downloadCsv(
                'attendance-report.csv',
                attendance.students.map((student) => ({
                    Student: student.nameEn,
                    KhmerName: student.nameKh,
                    Class: student.className,
                    Attendance: `${student.attendance}%`,
                })),
            );
            return;
        }

        if (tab === 'grades') {
            downloadCsv(
                'grades-report.csv',
                grades.students.map((student) => ({
                    Student: student.nameEn,
                    KhmerName: student.nameKh,
                    Level: student.level,
                    Speaking: student.speaking,
                    Listening: student.listening,
                    Reading: student.reading,
                    Writing: student.writing,
                    Average: student.average,
                })),
            );
            return;
        }

        downloadCsv(
            'fees-report.csv',
            fees.students.map((student) => ({
                Student: student.nameEn,
                KhmerName: student.nameKh,
                Level: student.level,
                Amount: student.amount,
                Status: student.status,
            })),
        );
    };

    const TABS: { id: ReportTab; label: string; icon: LucideIcon }[] = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
        { id: 'grades', label: 'Grades', icon: Star },
        { id: 'fees', label: 'Fee Summary', icon: CreditCard },
    ];

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 18,
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <ChartNoAxesColumn size={20} color="#2563eb" />
                            Reports
                        </div>
                        <LocalizedCopy
                            isKh={isKh}
                            kh={`របាយការណ៍សាលា - ${reportDate}`}
                            en={`School reports - ${reportDate}`}
                            style={{
                                fontSize: 12,
                                color: '#94a3b8',
                                display: 'block',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={handleExport}
                            className="admin-btn admin-btn-ghost"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="admin-btn admin-btn-primary"
                        >
                            <Printer size={14} /> Print
                        </button>
                    </div>
                </div>

                <div
                    className="stat-grid-4"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4,1fr)',
                        gap: 14,
                    }}
                >
                    {[
                        {
                            icon: GraduationCap,
                            lk: 'សិស្សទាំងអស់',
                            l: 'Total Students',
                            v: summary.totalStudents,
                            bg: '#eff6ff',
                            c: '#2563eb',
                        },
                        {
                            icon: ClipboardCheck,
                            lk: 'វត្តមានមធ្យម',
                            l: 'Avg Attendance',
                            v: `${summary.avgAttendance}%`,
                            bg: '#f0fdf4',
                            c: '#16a34a',
                        },
                        {
                            icon: Star,
                            lk: 'ពិន្ទុមធ្យម',
                            l: 'Avg Grade',
                            v: summary.avgGrade,
                            bg: '#fffbeb',
                            c: '#d97706',
                        },
                        {
                            icon: DollarSign,
                            lk: 'ចំណូលខែនេះ',
                            l: 'Fees Collected',
                            v: money(summary.feesCollected),
                            bg: '#f5f3ff',
                            c: '#7c3aed',
                        },
                    ].map((stat) => (
                        <div key={stat.l} className="stat-card">
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: stat.bg,
                                    color: stat.c,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                <stat.icon size={20} strokeWidth={2.4} />
                            </div>
                            <div
                                style={{
                                    fontSize: 24,
                                    fontWeight: 800,
                                    color: stat.c,
                                    marginBottom: 2,
                                }}
                            >
                                {stat.v}
                            </div>
                            <LocalizedCopy
                                isKh={isKh}
                                kh={stat.lk}
                                en={stat.l}
                                style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    display: 'block',
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TABS.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setTab(item.id)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: 8,
                                    border: '1.5px solid',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    borderColor:
                                        tab === item.id ? '#3b82f6' : '#e2e8f0',
                                    background:
                                        tab === item.id ? '#eff6ff' : 'white',
                                    color:
                                        tab === item.id ? '#2563eb' : '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Icon size={14} /> {item.label}
                            </button>
                        );
                    })}
                </div>

                {tab === 'attendance' && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <div className="card" style={{ padding: 20 }}>
                            <LocalizedCopy
                                isKh={isKh}
                                kh="វត្តមានតាមថ្នាក់"
                                en="Class attendance"
                                style={{
                                    fontWeight: 800,
                                    fontSize: 15,
                                    display: 'block',
                                    marginBottom: 14,
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                {attendance.classes.map((row) => {
                                    const type = attendanceColor(
                                        row.attendance,
                                    );

                                    return (
                                        <div
                                            key={row.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 140,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {row.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    {row.teacher}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <PBar
                                                    value={row.attendance}
                                                    color={type}
                                                    height={10}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    width: 60,
                                                    textAlign: 'right',
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    color:
                                                        type === 'green'
                                                            ? '#10b981'
                                                            : type === 'amber'
                                                              ? '#d97706'
                                                              : '#ef4444',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {row.attendance}%
                                            </div>
                                            <Badge type={type}>
                                                {row.studentCount} students
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div style={{ padding: '16px 20px 0' }}>
                                <LocalizedCopy
                                    isKh={isKh}
                                    kh="វត្តមានតាមសិស្ស"
                                    en="Student attendance"
                                    style={{
                                        fontWeight: 800,
                                        fontSize: 15,
                                        display: 'block',
                                        marginBottom: 4,
                                    }}
                                />
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginBottom: 12,
                                    }}
                                >
                                    Individual attendance - {reportDate}
                                </div>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Attendance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...attendance.students]
                                        .sort(
                                            (a, b) =>
                                                a.attendance - b.attendance,
                                        )
                                        .map((student) => {
                                            const type = attendanceColor(
                                                student.attendance,
                                            );

                                            return (
                                                <tr key={student.id}>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 10,
                                                            }}
                                                        >
                                                            <Avatar
                                                                name={
                                                                    student.nameEn
                                                                }
                                                                src={
                                                                    student.photo
                                                                }
                                                                size={32}
                                                            />
                                                            <div>
                                                                <PersonName
                                                                    isKh={isKh}
                                                                    kh={
                                                                        student.nameKh
                                                                    }
                                                                    en={
                                                                        student.nameEn
                                                                    }
                                                                    primaryStyle={{
                                                                        fontWeight: 700,
                                                                        fontSize: 13,
                                                                        display:
                                                                            'block',
                                                                    }}
                                                                    secondaryStyle={{
                                                                        fontSize: 11,
                                                                        color: '#94a3b8',
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                        }}
                                                    >
                                                        {student.className}
                                                    </td>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 8,
                                                                minWidth: 120,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                <PBar
                                                                    value={
                                                                        student.attendance
                                                                    }
                                                                    color={type}
                                                                />
                                                            </div>
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    width: 36,
                                                                    color:
                                                                        type ===
                                                                        'green'
                                                                            ? '#10b981'
                                                                            : type ===
                                                                                'amber'
                                                                              ? '#d97706'
                                                                              : '#ef4444',
                                                                }}
                                                            >
                                                                {
                                                                    student.attendance
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge type={type}>
                                                            {student.attendance >=
                                                            80
                                                                ? badgeIcon(
                                                                      CheckCircle2,
                                                                      'Good',
                                                                  )
                                                                : student.attendance >=
                                                                    60
                                                                  ? badgeIcon(
                                                                        TriangleAlert,
                                                                        'Warning',
                                                                    )
                                                                  : badgeIcon(
                                                                        TriangleAlert,
                                                                        'At Risk',
                                                                    )}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'grades' && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <div className="card" style={{ padding: 20 }}>
                            <LocalizedCopy
                                isKh={isKh}
                                kh="ពិន្ទុជំនាញមធ្យម"
                                en="Average skill scores"
                                style={{
                                    fontWeight: 800,
                                    fontSize: 15,
                                    display: 'block',
                                    marginBottom: 16,
                                }}
                            />
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fill,minmax(180px,1fr))',
                                    gap: 14,
                                }}
                            >
                                {grades.skills.map((skill) => (
                                    <div
                                        key={skill.key}
                                        style={{
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            padding: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: 10,
                                            }}
                                        >
                                            <LocalizedCopy
                                                isKh={isKh}
                                                kh={skill.labelKh}
                                                en={skill.label}
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                }}
                                            />
                                            <ScoreChip score={skill.average} />
                                        </div>
                                        <PBar
                                            value={skill.average}
                                            color={
                                                skill.average >= 75
                                                    ? 'green'
                                                    : skill.average >= 50
                                                      ? 'blue'
                                                      : 'amber'
                                            }
                                            height={8}
                                        />
                                        {isKh && (
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                    marginTop: 6,
                                                }}
                                            >
                                                {skill.label}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    padding: '16px 20px 0',
                                    marginBottom: 4,
                                }}
                            >
                                <LocalizedCopy
                                    isKh={isKh}
                                    kh="ពិន្ទុសិស្សទាំងអស់"
                                    en="All student scores"
                                    style={{
                                        fontWeight: 800,
                                        fontSize: 15,
                                        display: 'block',
                                    }}
                                />
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Level</th>
                                        <th>
                                            <LocalizedCopy
                                                isKh={isKh}
                                                kh="និយាយ"
                                                en="Speaking"
                                            />
                                        </th>
                                        <th>
                                            <LocalizedCopy
                                                isKh={isKh}
                                                kh="ស្ដាប់"
                                                en="Listening"
                                            />
                                        </th>
                                        <th>
                                            <LocalizedCopy
                                                isKh={isKh}
                                                kh="អាន"
                                                en="Reading"
                                            />
                                        </th>
                                        <th>
                                            <LocalizedCopy
                                                isKh={isKh}
                                                kh="សរសេរ"
                                                en="Writing"
                                            />
                                        </th>
                                        <th>Average</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...grades.students]
                                        .sort((a, b) => b.average - a.average)
                                        .map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 10,
                                                        }}
                                                    >
                                                        <Avatar
                                                            name={
                                                                student.nameEn
                                                            }
                                                            src={student.photo}
                                                            size={30}
                                                        />
                                                        <div>
                                                            <PersonName
                                                                isKh={isKh}
                                                                kh={
                                                                    student.nameKh
                                                                }
                                                                en={
                                                                    student.nameEn
                                                                }
                                                                primaryStyle={{
                                                                    fontWeight: 700,
                                                                    fontSize: 12,
                                                                    display:
                                                                        'block',
                                                                }}
                                                                secondaryStyle={{
                                                                    fontSize: 11,
                                                                    color: '#94a3b8',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge type="blue">
                                                        {student.level}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <ScoreChip
                                                        score={student.speaking}
                                                    />
                                                </td>
                                                <td>
                                                    <ScoreChip
                                                        score={
                                                            student.listening
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <ScoreChip
                                                        score={student.reading}
                                                    />
                                                </td>
                                                <td>
                                                    <ScoreChip
                                                        score={student.writing}
                                                    />
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontWeight: 800,
                                                            fontSize: 15,
                                                            color: gradeColor(
                                                                student.average,
                                                            ),
                                                        }}
                                                    >
                                                        {student.average}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'fees' && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill,minmax(160px,1fr))',
                                gap: 12,
                            }}
                        >
                            {[
                                {
                                    lk: 'ប្រមូលបាន',
                                    l: 'Collected',
                                    v: money(summary.feesCollected),
                                    c: '#10b981',
                                    bg: '#f0fdf4',
                                },
                                {
                                    lk: 'នៅខ្វះ',
                                    l: 'Outstanding',
                                    v: money(summary.outstandingFees),
                                    c: '#ef4444',
                                    bg: '#fff1f2',
                                },
                                {
                                    lk: 'បានបង់',
                                    l: 'Paid',
                                    v: summary.paidCount,
                                    c: '#2563eb',
                                    bg: '#eff6ff',
                                },
                                {
                                    lk: 'មិនទាន់',
                                    l: 'Unpaid',
                                    v: summary.unpaidCount,
                                    c: '#f59e0b',
                                    bg: '#fffbeb',
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.l}
                                    style={{
                                        background: stat.bg,
                                        borderRadius: 14,
                                        padding: 16,
                                        border: `1px solid ${stat.c}30`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 24,
                                            fontWeight: 800,
                                            color: stat.c,
                                            marginBottom: 2,
                                        }}
                                    >
                                        {stat.v}
                                    </div>
                                    <LocalizedCopy
                                        isKh={isKh}
                                        kh={stat.lk}
                                        en={stat.l}
                                        style={{
                                            fontSize: 12,
                                            color: stat.c,
                                            display: 'block',
                                            opacity: 0.8,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    padding: '16px 20px 0',
                                    marginBottom: 4,
                                }}
                            >
                                <LocalizedCopy
                                    isKh={isKh}
                                    kh="ប្រវត្តិការទូទាត់"
                                    en="Payment history"
                                    style={{
                                        fontWeight: 800,
                                        fontSize: 15,
                                        display: 'block',
                                    }}
                                />
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginBottom: 12,
                                    }}
                                >
                                    Payment History - {reportDate}
                                </div>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <PersonName
                                                    isKh={isKh}
                                                    kh={payment.studentNameKh}
                                                    en={payment.studentNameEn}
                                                    primaryStyle={{
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                    }}
                                                    secondaryStyle={{
                                                        fontSize: 11,
                                                        color: '#94a3b8',
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {money(payment.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge type="blue">
                                                    {payment.method}
                                                </Badge>
                                            </td>
                                            <td
                                                style={{
                                                    fontSize: 12,
                                                    color: '#64748b',
                                                }}
                                            >
                                                {payment.date || '-'}
                                            </td>
                                            <td>
                                                <Badge
                                                    type={feeBadgeType(
                                                        payment.status,
                                                    )}
                                                >
                                                    {paymentStatusLabel(
                                                        payment.status,
                                                    )}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card" style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    padding: '16px 20px 0',
                                    marginBottom: 4,
                                }}
                            >
                                <LocalizedCopy
                                    isKh={isKh}
                                    kh="ស្ថានភាពថ្លៃតាមសិស្ស"
                                    en="Student fee status"
                                    style={{
                                        fontWeight: 800,
                                        fontSize: 15,
                                        display: 'block',
                                    }}
                                />
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Level</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.students.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }}
                                                >
                                                    <Avatar
                                                        name={student.nameEn}
                                                        src={student.photo}
                                                        size={30}
                                                    />
                                                    <div>
                                                        <PersonName
                                                            isKh={isKh}
                                                            kh={student.nameKh}
                                                            en={student.nameEn}
                                                            primaryStyle={{
                                                                fontWeight: 700,
                                                                fontSize: 13,
                                                                display:
                                                                    'block',
                                                            }}
                                                            secondaryStyle={{
                                                                fontSize: 11,
                                                                color: '#94a3b8',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge type="blue">
                                                    {student.level}
                                                </Badge>
                                            </td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {money(student.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge
                                                    type={feeBadgeType(
                                                        student.status,
                                                    )}
                                                >
                                                    {student.status === 'paid'
                                                        ? badgeIcon(
                                                              CheckCircle2,
                                                              'Paid',
                                                          )
                                                        : student.status ===
                                                            'unpaid'
                                                          ? badgeIcon(
                                                                XCircle,
                                                                'Unpaid',
                                                            )
                                                          : 'Partial'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
