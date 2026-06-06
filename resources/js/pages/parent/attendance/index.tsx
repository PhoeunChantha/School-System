import {
    EmptyState,
    formatDate,
    PageHeading,
    ParentLayout,
    type ParentProfile,
} from '@/pages/parent/layout';
import { AlertCircle, CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react';

interface AttendanceSummary {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
}

interface AttendanceRecord {
    date: string;
    period: string;
    status: string;
    note: string;
}

interface Props {
    profile: ParentProfile;
    summary: AttendanceSummary;
    records: AttendanceRecord[];
}

const statusTone: Record<string, string> = {
    present: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    absent: 'bg-rose-50 text-rose-700 ring-rose-100',
    late: 'bg-amber-50 text-amber-700 ring-amber-100',
    excused: 'bg-blue-50 text-blue-700 ring-blue-100',
};

export default function ParentAttendance({ profile, summary, records }: Props) {
    const circumference = 2 * Math.PI * 35;

    return (
        <ParentLayout title="Attendance" profile={profile}>
            <PageHeading
                icon={CalendarCheck2}
                title="Attendance"
                subtitle={`${summary.total} sessions recorded`}
            />

            <div className="rounded-[30px] bg-white p-5 shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]">
                <div className="flex items-center gap-5">
                    <div className="relative h-24 w-24 shrink-0">
                        <svg className="-rotate-90" width="96" height="96">
                            <circle cx="48" cy="48" r="35" fill="none" stroke="#edf2ee" strokeWidth="9" />
                            <circle
                                cx="48"
                                cy="48"
                                r="35"
                                fill="none"
                                stroke="#0e9f7c"
                                strokeLinecap="round"
                                strokeWidth="9"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - summary.rate / 100)}
                            />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center text-lg font-black text-[#0e9f7c]">
                            {summary.rate}%
                        </div>
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-3">
                        <Count label="Present" value={summary.present} color="text-emerald-600" />
                        <Count label="Absent" value={summary.absent} color="text-rose-600" />
                        <Count label="Late" value={summary.late} color="text-amber-600" />
                        <Count label="Excused" value={summary.excused} color="text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                {records.length === 0 ? (
                    <EmptyState icon={AlertCircle} text="No attendance records yet." />
                ) : (
                    records.map((record, index) => (
                        <div
                            key={`${record.date}-${record.period}-${index}`}
                            className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-[0_12px_28px_rgba(16,32,28,0.05)] ring-1 ring-[#e4ebe6]"
                        >
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef7f4] text-[#0e9f7c]">
                                {record.status === 'absent' ? <XCircle size={20} /> : record.status === 'late' ? <Clock3 size={20} /> : <CheckCircle2 size={20} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-[#10201c]">
                                    {formatDate(record.date)}
                                </p>
                                <p className="mt-1 text-xs font-bold text-[#7b8c86]">
                                    {record.period}
                                    {record.note ? ` / ${record.note}` : ''}
                                </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ${statusTone[record.status] ?? statusTone.present}`}>
                                {record.status}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </ParentLayout>
    );
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-black text-[#8a9994]">{label}</p>
        </div>
    );
}
