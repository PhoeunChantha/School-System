import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, PBar, ScoreChip } from '@/pages/admin/ui';
import {
    BookOpenCheck,
    ChartNoAxesColumn,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    DollarSign,
    Download,
    GraduationCap,
    Printer,
    Star,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';

type ReportTab = 'attendance' | 'grades';

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

const pageClass = 'fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const actionButtonClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition';
const reportPageSize = 5;

function badgeIcon(Icon: LucideIcon, label: string) {
    return (
        <span className="inline-flex items-center gap-1">
            <Icon size={12} strokeWidth={2.6} />
            {label}
        </span>
    );
}

function money(value: number): string {
    return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function attendanceColor(value: number): 'green' | 'amber' | 'red' {
    if (value >= 80) return 'green';
    if (value >= 60) return 'amber';
    return 'red';
}

function feeBadgeType(status: string): 'green' | 'red' | 'amber' | 'blue' {
    if (status === 'paid') return 'green';
    if (status === 'unpaid') return 'red';
    if (status === 'partial' || status === 'pending') return 'amber';
    return 'blue';
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
    if (rows.length === 0) {
        toast.info('No data to export.');
        return;
    }

    const headers = Object.keys(rows[0]);
    const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
        headers.map(escape).join(','),
        ...rows.map(row => headers.map(header => escape(row[header])).join(',')),
    ].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export default function ReportsPage({ reportDate, summary, attendance, grades }: ReportsPageProps) {
    const { lang } = useAdminTranslation();
    const [tab, setTab] = useState<ReportTab>('attendance');
    const [classAttendancePage, setClassAttendancePage] = useState(1);
    const isKh = lang === 'kh';
    const paginatedClassAttendance = attendance.classes.slice((classAttendancePage - 1) * reportPageSize, classAttendancePage * reportPageSize);

    const handleExport = () => {
        if (tab === 'attendance') {
            downloadCsv('attendance-report.csv', attendance.students.map(student => ({
                Student: student.nameEn,
                KhmerName: student.nameKh,
                Class: student.className,
                Attendance: `${student.attendance}%`,
            })));
            return;
        }

        if (tab === 'grades') {
            downloadCsv('grades-report.csv', grades.students.map(student => ({
                Student: student.nameEn,
                KhmerName: student.nameKh,
                Level: student.level,
                Speaking: student.speaking,
                Listening: student.listening,
                Reading: student.reading,
                Writing: student.writing,
                Average: student.average,
            })));
            return;
        }

    };

    const tabs: { id: ReportTab; label: string; icon: LucideIcon }[] = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
        { id: 'grades', label: 'Grades', icon: Star },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-black text-slate-400"><ChartNoAxesColumn size={15} /> Reports</span>
                        <strong className="mt-1 block text-xl font-black text-slate-900 dark:text-slate-50">School reports</strong>
                        <p className="mt-1 truncate text-xs font-extrabold text-slate-400">{reportDate}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button onClick={handleExport} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900`} aria-label="Export CSV">
                            <Download size={15} />
                            <span className="hidden sm:inline">CSV</span>
                        </button>
                        <button onClick={() => window.print()} className={`${actionButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500`} aria-label="Print">
                            <Printer size={15} />
                            <span className="hidden sm:inline">Print</span>
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <MetricCard icon={GraduationCap} label="Total Students" value={summary.totalStudents} tone="blue" />
                    <MetricCard icon={ClipboardCheck} label="Avg Attendance" value={`${summary.avgAttendance}%`} tone="green" />
                    <MetricCard icon={Star} label="Avg Grade" value={summary.avgGrade} tone="amber" />
                    <MetricCard icon={BookOpenCheck} label="Classes Tracked" value={attendance.classes.length} tone="violet" />
                </div>

                <section className={panelClass}>
                    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                        {tabs.map(item => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-black transition ${tab === item.id ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <Icon size={14} />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {tab === 'attendance' && (
                    <div className="grid gap-3">
                        <SectionTitle title={label(isKh, 'Class attendance', 'Class attendance')} />
                        <div className="grid gap-3 md:grid-cols-2">
                            {paginatedClassAttendance.map(row => {
                                const type = attendanceColor(row.attendance);

                                return (
                                    <article key={row.id} className={mobileCardClass}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">{row.name}</h3>
                                                <p className="mt-0.5 text-[11px] font-bold text-slate-400">{row.teacher} - {row.studentCount} students</p>
                                            </div>
                                            <strong className={`text-sm font-black ${barTextClass(type)}`}>{row.attendance}%</strong>
                                        </div>
                                        <div className="mt-3"><PBar value={row.attendance} color={type} height={10} /></div>
                                    </article>
                                );
                            })}
                        </div>
                        {attendance.classes.length > reportPageSize && (
                            <Pagination total={attendance.classes.length} page={classAttendancePage} perPage={reportPageSize} onPageChange={setClassAttendancePage} onPerPageChange={() => setClassAttendancePage(1)} showPerPage={false} />
                        )}

                        <SectionTitle title="Student attendance" />
                        <ResponsiveStudentAttendance students={attendance.students} isKh={isKh} />
                    </div>
                )}

                {tab === 'grades' && (
                    <div className="grid gap-3">
                        <SectionTitle title="Skill averages" />
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            {grades.skills.map(skill => (
                                <div key={skill.key} className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                    <span className="block truncate text-[11px] font-black text-slate-400">{isKh && skill.labelKh ? skill.labelKh : skill.label}</span>
                                    <strong className={`mt-2 block text-2xl font-black ${scoreTextClass(skill.average)}`}>{skill.average}</strong>
                                    <div className="mt-2"><PBar value={skill.average} color={scoreBarColor(skill.average)} height={8} /></div>
                                </div>
                            ))}
                        </div>

                        <SectionTitle title="Student grades" />
                        <ResponsiveGradeRows students={grades.students} isKh={isKh} />
                    </div>
                )}

            </div>
        </AdminShell>
    );
}

function ResponsiveStudentAttendance({ students, isKh }: { students: StudentReportRow[]; isKh: boolean }) {
    const [page, setPage] = useState(1);
    const paginatedStudents = students.slice((page - 1) * reportPageSize, page * reportPageSize);

    return (
        <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
            <table className={desktopTableClass}>
                <thead>
                    <tr><th>Student</th><th>Class</th><th>Attendance</th><th>Avg Score</th></tr>
                </thead>
                <tbody>
                    {paginatedStudents.map(student => (
                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                            <td><StudentName student={student} isKh={isKh} /></td>
                            <td><Badge type="blue">{student.className || student.level}</Badge></td>
                            <td><ProgressCell value={student.attendance} /></td>
                            <td><strong className={`text-sm font-black ${scoreTextClass(student.average)}`}>{student.average}</strong></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="grid gap-3 md:hidden">
                {paginatedStudents.map(student => (
                    <article key={student.id} className={mobileCardClass}>
                        <div className="flex items-center justify-between gap-3">
                            <StudentName student={student} isKh={isKh} />
                            <strong className={`text-lg font-black ${scoreTextClass(student.average)}`}>{student.average}</strong>
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                            <div className="mb-2 flex items-center justify-between text-xs font-black">
                                <span className="text-slate-400">{student.className || student.level}</span>
                                <span className={scoreTextClass(student.attendance)}>{student.attendance}%</span>
                            </div>
                            <PBar value={student.attendance} color={scoreBarColor(student.attendance)} />
                        </div>
                    </article>
                ))}
            </div>
            {students.length > reportPageSize && (
                <Pagination total={students.length} page={page} perPage={reportPageSize} onPageChange={setPage} onPerPageChange={() => setPage(1)} showPerPage={false} />
            )}
        </section>
    );
}

function ResponsiveGradeRows({ students, isKh }: { students: StudentReportRow[]; isKh: boolean }) {
    const [page, setPage] = useState(1);
    const paginatedStudents = students.slice((page - 1) * reportPageSize, page * reportPageSize);

    return (
        <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
            <table className={desktopTableClass}>
                <thead>
                    <tr><th>Student</th><th>Level</th><th>Speak</th><th>Listen</th><th>Read</th><th>Write</th><th>Average</th></tr>
                </thead>
                <tbody>
                    {paginatedStudents.map(student => (
                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                            <td><StudentName student={student} isKh={isKh} /></td>
                            <td><Badge type="blue">{student.level}</Badge></td>
                            <td><ScoreChip score={student.speaking} /></td>
                            <td><ScoreChip score={student.listening} /></td>
                            <td><ScoreChip score={student.reading} /></td>
                            <td><ScoreChip score={student.writing} /></td>
                            <td><strong className={`text-sm font-black ${scoreTextClass(student.average)}`}>{student.average}</strong></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="grid gap-3 md:hidden">
                {paginatedStudents.map(student => (
                    <article key={student.id} className={mobileCardClass}>
                        <div className="flex items-center justify-between gap-3">
                            <StudentName student={student} isKh={isKh} />
                            <strong className={`text-lg font-black ${scoreTextClass(student.average)}`}>{student.average}</strong>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            <ScoreTile label="Speak" value={student.speaking} />
                            <ScoreTile label="Listen" value={student.listening} />
                            <ScoreTile label="Read" value={student.reading} />
                            <ScoreTile label="Write" value={student.writing} />
                        </div>
                    </article>
                ))}
            </div>
            {students.length > reportPageSize && (
                <Pagination total={students.length} page={page} perPage={reportPageSize} onPageChange={setPage} onPerPageChange={() => setPage(1)} showPerPage={false} />
            )}
        </section>
    );
}

function ResponsivePaymentRows({ payments, isKh }: { payments: PaymentRow[]; isKh: boolean }) {
    const [page, setPage] = useState(1);
    const paginatedPayments = payments.slice((page - 1) * reportPageSize, page * reportPageSize);

    return (
        <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
            <table className={desktopTableClass}>
                <thead>
                    <tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {paginatedPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                            <td><PersonName isKh={isKh} kh={payment.studentNameKh} en={payment.studentNameEn} /></td>
                            <td><strong className="text-xs font-black text-slate-900 dark:text-slate-50">{money(payment.amount)}</strong></td>
                            <td><Badge type="blue">{payment.method}</Badge></td>
                            <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{payment.date || '-'}</td>
                            <td><Badge type={feeBadgeType(payment.status)}>{paymentStatusLabel(payment.status)}</Badge></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="grid gap-3 md:hidden">
                {paginatedPayments.map(payment => (
                    <article key={payment.id} className={mobileCardClass}>
                        <div className="flex items-start justify-between gap-3">
                            <PersonName isKh={isKh} kh={payment.studentNameKh} en={payment.studentNameEn} />
                            <strong className="text-sm font-black text-emerald-500">{money(payment.amount)}</strong>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                            <span className="text-xs font-black text-slate-400">{payment.date || '-'}</span>
                            <div className="flex items-center gap-2">
                                <Badge type="blue">{payment.method}</Badge>
                                <Badge type={feeBadgeType(payment.status)}>{paymentStatusLabel(payment.status)}</Badge>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            {payments.length > reportPageSize && (
                <Pagination total={payments.length} page={page} perPage={reportPageSize} onPageChange={setPage} onPerPageChange={() => setPage(1)} showPerPage={false} />
            )}
        </section>
    );
}

function ResponsiveFeeRows({ students, isKh }: { students: FeeStudentRow[]; isKh: boolean }) {
    const [page, setPage] = useState(1);
    const paginatedStudents = students.slice((page - 1) * reportPageSize, page * reportPageSize);

    return (
        <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
            <table className={desktopTableClass}>
                <thead>
                    <tr><th>Student</th><th>Level</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {paginatedStudents.map(student => (
                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                            <td><StudentName student={student} isKh={isKh} /></td>
                            <td><Badge type="blue">{student.level}</Badge></td>
                            <td><strong className="text-xs font-black text-slate-900 dark:text-slate-50">{money(student.amount)}</strong></td>
                            <td><Badge type={feeBadgeType(student.status)}>{feeStatusLabel(student.status)}</Badge></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="grid gap-3 md:hidden">
                {paginatedStudents.map(student => (
                    <article key={student.id} className={mobileCardClass}>
                        <div className="flex items-center justify-between gap-3">
                            <StudentName student={student} isKh={isKh} />
                            <Badge type={feeBadgeType(student.status)}>{feeStatusLabel(student.status)}</Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                            <Badge type="blue">{student.level}</Badge>
                            <strong className="text-sm font-black text-slate-900 dark:text-slate-50">{money(student.amount)}</strong>
                        </div>
                    </article>
                ))}
            </div>
            {students.length > reportPageSize && (
                <Pagination total={students.length} page={page} perPage={reportPageSize} onPageChange={setPage} onPerPageChange={() => setPage(1)} showPerPage={false} />
            )}
        </section>
    );
}

function StudentName({ student, isKh }: { student: StudentReportRow | FeeStudentRow; isKh: boolean }) {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={student.nameEn} src={student.photo} size={34} />
            <div className="min-w-0">
                <PersonName isKh={isKh} kh={student.nameKh} en={student.nameEn} />
            </div>
        </div>
    );
}

function PersonName({ isKh, kh, en }: { isKh: boolean; kh?: string; en: string }) {
    const hasKhmerName = Boolean(kh?.trim());

    if (isKh && hasKhmerName) {
        return (
            <>
                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{kh}</KH>
                <div className="truncate text-[11px] font-bold text-slate-400">{en}</div>
            </>
        );
    }

    return <div className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{en || kh}</div>;
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: ReactNode; tone: 'blue' | 'green' | 'amber' | 'violet' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-current/10">
                <Icon size={18} />
            </div>
            <div className="text-xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function MiniMetric({ label, value, tone }: { label: string; value: ReactNode; tone: 'green' | 'red' | 'blue' | 'amber' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="text-xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="px-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs font-bold text-slate-400">{subtitle}</p>}
        </div>
    );
}

function ProgressCell({ value }: { value: number }) {
    const color = attendanceColor(value);

    return (
        <div className="flex min-w-[130px] items-center gap-2">
            <PBar value={value} color={color} />
            <span className={`w-11 text-xs font-black ${barTextClass(color)}`}>{value}%</span>
        </div>
    );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-slate-100 px-2 py-2 text-center dark:bg-slate-950">
            <span className="block text-[9px] font-black uppercase text-slate-400">{label}</span>
            <strong className={`mt-1 block text-xs font-black ${scoreTextClass(value)}`}>{value}</strong>
        </div>
    );
}

function paymentStatusLabel(status: string) {
    if (status === 'paid') return badgeIcon(CheckCircle2, 'Paid');
    if (status === 'failed') return badgeIcon(XCircle, 'Failed');
    return status || 'Unknown';
}

function feeStatusLabel(status: string) {
    if (status === 'paid') return badgeIcon(CheckCircle2, 'Paid');
    if (status === 'unpaid') return badgeIcon(XCircle, 'Unpaid');
    return 'Partial';
}

function label(_isKh: boolean, kh: string, en: string) {
    return kh || en;
}

function metricClass(tone: 'blue' | 'green' | 'amber' | 'violet' | 'red') {
    if (tone === 'green') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500';
    if (tone === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-500';
    if (tone === 'violet') return 'border-violet-500/25 bg-violet-500/10 text-violet-500';
    if (tone === 'red') return 'border-red-500/25 bg-red-500/10 text-red-500';
    return 'border-blue-500/25 bg-blue-500/10 text-blue-500';
}

function barTextClass(color: 'green' | 'amber' | 'red') {
    if (color === 'green') return 'text-emerald-500';
    if (color === 'amber') return 'text-amber-500';
    return 'text-red-500';
}

function scoreBarColor(value: number): 'green' | 'blue' | 'red' {
    if (value >= 75) return 'green';
    if (value >= 50) return 'blue';
    return 'red';
}

function scoreTextClass(value: number) {
    if (value >= 75) return 'text-emerald-500';
    if (value >= 50) return 'text-blue-500';
    return 'text-amber-500';
}
