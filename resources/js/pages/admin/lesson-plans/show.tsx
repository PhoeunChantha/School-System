import { edit, index } from '@/actions/App/Http/Controllers/Backends/LessonPlanController';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge } from '@/pages/admin/ui';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpenText,
    CalendarDays,
    Clock3,
    Download,
    FileText,
    GraduationCap,
    Image as ImageIcon,
    MapPin,
    Pencil,
    UserRound,
} from 'lucide-react';

type LessonStatus = 'planned' | 'taught' | 'cancelled';

interface LessonAttachment {
    id: number;
    name: string;
    url: string;
    mimeType: string;
    size: number;
    isImage: boolean;
}

interface LessonPlanDetail {
    id: number;
    routeKey?: string;
    teacher: string;
    teacherPhoto: string | null;
    className: string;
    room: string;
    time: string;
    date: string;
    day: string;
    title: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: LessonStatus;
    inputMode: 'details' | 'files';
    attachments: LessonAttachment[];
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

const statusType: Record<LessonStatus, 'blue' | 'green' | 'gray'> = {
    planned: 'blue',
    taught: 'green',
    cancelled: 'gray',
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string | null): string {
    if (!value) return 'Not available';

    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatTime(value: string): string {
    const [hourValue, minute = '00'] = value.trim().split(':');
    const hour = Number(hourValue);

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return value;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour.toString().padStart(2, '0')}:${minute} ${period}`;
}

function formatClassTime(value: string): string {
    if (!value) {
        return 'No time set';
    }

    return value.split('-').map(formatTime).join(' - ');
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-b border-slate-200 py-5 last:border-b-0 dark:border-slate-700">
            <h2 className="text-xs font-black uppercase text-slate-400">{title}</h2>
            <div className="mt-2 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 dark:text-slate-200">
                {children || <span className="text-slate-400">No information added.</span>}
            </div>
        </section>
    );
}

export default function LessonPlanShowPage({ lessonPlan }: { lessonPlan: LessonPlanDetail }) {
    const routeKey = (lessonPlan.routeKey ?? lessonPlan.id) as never;

    return (
        <AdminShell>
            <Head title={lessonPlan.title} />
            <div className="fade-in mx-auto flex w-full max-w-[1180px] flex-col gap-5 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={index()} className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-600 dark:text-slate-300">
                        <ArrowLeft size={17} /> Back to Lesson Plans
                    </Link>
                    <Link href={edit(routeKey)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-500">
                        <Pencil size={15} /> Edit lesson plan
                    </Link>
                </div>

                <header className="rounded-[24px] bg-slate-900 px-5 py-6 text-white shadow-[0_20px_44px_rgba(15,23,42,0.2)] dark:bg-slate-800 md:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge type={statusType[lessonPlan.status]}>{lessonPlan.status}</Badge>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-slate-200">
                                    {lessonPlan.inputMode === 'files' ? 'Uploaded files' : 'Lesson details'}
                                </span>
                            </div>
                            <h1 className="mt-4 text-2xl font-black leading-tight md:text-3xl">{lessonPlan.title}</h1>
                            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-300">
                                {lessonPlan.objective || 'Review the lesson schedule, teaching information, and attached resources.'}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/8 p-3">
                            <Avatar name={lessonPlan.teacher} src={lessonPlan.teacherPhoto} size={44} />
                            <div>
                                <span className="block text-[10px] font-black uppercase text-slate-400">Teacher</span>
                                <strong className="mt-0.5 block text-sm font-black">{lessonPlan.teacher}</strong>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="rounded-[22px] border border-slate-200 bg-white px-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:px-6">
                        {lessonPlan.inputMode === 'details' ? (
                            <>
                                <DetailSection title="Students Learn / Objective">{lessonPlan.objective}</DetailSection>
                                <DetailSection title="Teaching Content">{lessonPlan.content}</DetailSection>
                                <div className="grid md:grid-cols-2 md:gap-6">
                                    <DetailSection title="Materials">{lessonPlan.materials}</DetailSection>
                                    <DetailSection title="Homework">{lessonPlan.homework}</DetailSection>
                                </div>
                            </>
                        ) : (
                            <section className="py-5">
                                <div className="flex items-center gap-2">
                                    <BookOpenText size={18} className="text-blue-600" />
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Lesson files</h2>
                                </div>
                                {lessonPlan.attachments.length === 0 ? (
                                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm font-bold text-slate-400 dark:border-slate-600">
                                        No files attached.
                                    </div>
                                ) : (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {lessonPlan.attachments.map((attachment) => (
                                            <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                                                {attachment.isImage ? (
                                                    <img src={attachment.url} alt={attachment.name} className="aspect-[4/3] w-full object-cover" />
                                                ) : (
                                                    <div className="grid aspect-[4/3] place-items-center bg-slate-100 dark:bg-slate-950">
                                                        <FileText size={42} className="text-blue-500" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 p-3">
                                                    {attachment.isImage ? <ImageIcon size={18} className="shrink-0 text-emerald-500" /> : <FileText size={18} className="shrink-0 text-blue-500" />}
                                                    <div className="min-w-0 flex-1">
                                                        <strong className="block truncate text-xs font-black text-slate-900 dark:text-white">{attachment.name}</strong>
                                                        <span className="mt-0.5 block text-[10px] font-bold text-slate-400">{formatBytes(attachment.size)}</span>
                                                    </div>
                                                    <Download size={16} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </main>

                    <aside className="flex flex-col gap-4">
                        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <h2 className="text-xs font-black uppercase text-slate-400">Schedule</h2>
                            <div className="mt-4 grid gap-4">
                                <Meta icon={CalendarDays} label="Lesson date" value={`${lessonPlan.date} (${lessonPlan.day})`} />
                                <Meta icon={Clock3} label="Class time" value={formatClassTime(lessonPlan.time)} />
                                <Meta icon={GraduationCap} label="Class" value={lessonPlan.className} />
                                <Meta icon={MapPin} label="Room" value={lessonPlan.room || 'No room set'} />
                                <Meta icon={UserRound} label="Teacher" value={lessonPlan.teacher} />
                            </div>
                        </section>
                        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <h2 className="text-xs font-black uppercase text-slate-400">Record history</h2>
                            <div className="mt-4 grid gap-4 text-xs">
                                <Audit label="Created by" value={lessonPlan.createdBy || 'Unknown'} detail={formatTimestamp(lessonPlan.createdAt)} />
                                <Audit label="Last updated by" value={lessonPlan.updatedBy || lessonPlan.createdBy || 'Unknown'} detail={formatTimestamp(lessonPlan.updatedAt)} />
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AdminShell>
    );
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Icon size={17} /></span>
            <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-slate-400">{label}</span>
                <strong className="mt-0.5 block text-sm font-black text-slate-800 dark:text-slate-100">{value}</strong>
            </div>
        </div>
    );
}

function Audit({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div>
            <span className="font-black text-slate-400">{label}</span>
            <strong className="mt-1 block text-slate-800 dark:text-slate-100">{value}</strong>
            <span className="mt-0.5 block font-medium text-slate-400">{detail}</span>
        </div>
    );
}
