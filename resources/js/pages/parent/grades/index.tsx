import {
    EmptyState,
    formatDate,
    PageHeading,
    ParentLayout,
    type ParentProfile,
} from '@/pages/parent/layout';
import { BarChart3, GraduationCap, TrendingUp } from 'lucide-react';

interface Grade {
    period: string;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    average: number;
    date: string;
}

interface Props {
    profile: ParentProfile;
    grades: Grade[];
}

function gradeTone(value: number): string {
    if (value >= 85) {
        return 'text-emerald-600';
    }

    if (value >= 70) {
        return 'text-blue-600';
    }

    if (value >= 55) {
        return 'text-amber-600';
    }

    return 'text-rose-600';
}

export default function ParentGrades({ profile, grades }: Props) {
    const latestAverage = grades[0]?.average ?? 0;
    const bestAverage = grades.length > 0 ? Math.max(...grades.map((grade) => grade.average)) : 0;

    return (
        <ParentLayout title="Grades" profile={profile}>
            <PageHeading
                icon={BarChart3}
                title="Grades"
                subtitle={`${grades.length} grade records`}
            />

            <div className="mb-5 grid grid-cols-2 gap-3">
                <SummaryCard label="Latest" value={latestAverage} />
                <SummaryCard label="Best" value={bestAverage} />
            </div>

            <div className="flex flex-col gap-3">
                {grades.length === 0 ? (
                    <EmptyState icon={GraduationCap} text="No grades recorded yet." />
                ) : (
                    grades.map((grade, index) => (
                        <div
                            key={`${grade.period}-${grade.date}-${index}`}
                            className="rounded-[28px] bg-white p-4 shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]"
                        >
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef7f4] text-[#0e9f7c]">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-[#10201c]">
                                            {grade.period}
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-[#7b8c86]">
                                            {formatDate(grade.date)}
                                        </p>
                                    </div>
                                </div>
                                <p className={`text-3xl font-black ${gradeTone(grade.average)}`}>
                                    {grade.average}
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <Skill label="Speaking" value={grade.speaking} />
                                <Skill label="Listening" value={grade.listening} />
                                <Skill label="Reading" value={grade.reading} />
                                <Skill label="Writing" value={grade.writing} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ParentLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-[26px] bg-white p-4 text-center shadow-[0_12px_28px_rgba(16,32,28,0.05)] ring-1 ring-[#e4ebe6]">
            <p className={`text-4xl font-black ${gradeTone(value)}`}>{value}</p>
            <p className="mt-1 text-xs font-black text-[#8a9994] uppercase">{label}</p>
        </div>
    );
}

function Skill({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-black">
                <span className="text-[#64736e]">{label}</span>
                <span className={gradeTone(value)}>{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e9efeb]">
                <div
                    className="h-full rounded-full bg-[#0e9f7c]"
                    style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
                />
            </div>
        </div>
    );
}
