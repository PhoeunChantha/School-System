import {
    EmptyState,
    formatDate,
    PageHeading,
    ParentLayout,
    type ParentProfile,
} from '@/pages/parent/layout';
import { BookOpenCheck, CheckCircle2, Clock3, Paperclip } from 'lucide-react';

interface Submission {
    submitted: string;
    score: number | null;
    status: string;
    note: string;
    attachmentName: string;
    attachmentUrl: string;
}

interface Homework {
    id: number;
    title: string;
    titleKh: string;
    instructions: string;
    points: number;
    due: string;
    status: string;
    submission: Submission | null;
}

interface Props {
    profile: ParentProfile;
    homework: Homework[];
}

function isPastDue(value: string): boolean {
    return value ? new Date(value).getTime() < Date.now() : false;
}

function badge(homework: Homework): { label: string; className: string } {
    if (!homework.submission) {
        return isPastDue(homework.due)
            ? { label: 'Missing', className: 'bg-rose-50 text-rose-700 ring-rose-100' }
            : { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-100' };
    }

    if (homework.submission.status === 'graded') {
        return { label: 'Graded', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' };
    }

    return { label: 'Submitted', className: 'bg-blue-50 text-blue-700 ring-blue-100' };
}

export default function ParentHomework({ profile, homework }: Props) {
    const pending = homework.filter((item) => !item.submission).length;
    const submitted = homework.length - pending;

    return (
        <ParentLayout title="Homework" profile={profile}>
            <PageHeading
                icon={BookOpenCheck}
                title="Homework"
                subtitle={`${homework.length} assignments`}
            />

            <div className="mb-5 grid grid-cols-3 gap-3">
                <Summary label="Total" value={homework.length} />
                <Summary label="Pending" value={pending} tone="text-amber-600" />
                <Summary label="Submitted" value={submitted} tone="text-emerald-600" />
            </div>

            <div className="flex flex-col gap-3">
                {homework.length === 0 ? (
                    <EmptyState icon={BookOpenCheck} text="No homework has been assigned yet." />
                ) : (
                    homework.map((item) => {
                        const status = badge(item);

                        return (
                            <div
                                key={item.id}
                                className="rounded-[28px] bg-white p-4 shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff5df] text-[#c27a00]">
                                        {item.submission ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-black text-[#10201c]">
                                                {item.title || item.titleKh || 'Homework'}
                                            </p>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-bold text-[#7b8c86]">
                                            Due {formatDate(item.due)} / {item.points} pts
                                        </p>
                                        {item.instructions && (
                                            <p className="mt-3 text-sm font-semibold text-[#4f625c]">
                                                {item.instructions}
                                            </p>
                                        )}
                                        {item.submission && (
                                            <div className="mt-3 rounded-2xl bg-[#f3f8f5] p-3 text-xs font-bold text-[#4f625c]">
                                                Submitted {formatDate(item.submission.submitted)}
                                                {item.submission.score !== null
                                                    ? ` / Score ${item.submission.score}`
                                                    : ''}
                                                {item.submission.attachmentUrl && (
                                                    <a
                                                        href={item.submission.attachmentUrl}
                                                        className="mt-2 flex items-center gap-2 text-[#0e9f7c]"
                                                    >
                                                        <Paperclip size={14} />
                                                        {item.submission.attachmentName || 'Attachment'}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </ParentLayout>
    );
}

function Summary({
    label,
    value,
    tone = 'text-[#10201c]',
}: {
    label: string;
    value: number;
    tone?: string;
}) {
    return (
        <div className="rounded-[24px] bg-white p-4 text-center shadow-[0_12px_28px_rgba(16,32,28,0.05)] ring-1 ring-[#e4ebe6]">
            <p className={`text-3xl font-black ${tone}`}>{value}</p>
            <p className="mt-1 text-[11px] font-black text-[#8a9994]">{label}</p>
        </div>
    );
}
