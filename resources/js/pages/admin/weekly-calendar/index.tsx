import AdminShell from '@/pages/admin/shell';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';

interface CalendarClass {
    id: number;
    name: string;
    teacher: string;
    room: string;
    startsAt: string | null;
    endsAt: string | null;
    days: string[];
}

interface WeeklyCalendarPageProps {
    schedule: CalendarClass[];
}

const weekDays = [
    { key: 'mon', label: 'Monday', shortLabel: 'Mon' },
    { key: 'tue', label: 'Tuesday', shortLabel: 'Tue' },
    { key: 'wed', label: 'Wednesday', shortLabel: 'Wed' },
    { key: 'thu', label: 'Thursday', shortLabel: 'Thu' },
    { key: 'fri', label: 'Friday', shortLabel: 'Fri' },
    { key: 'sat', label: 'Saturday', shortLabel: 'Sat' },
    { key: 'sun', label: 'Sunday', shortLabel: 'Sun' },
] as const;

function formatTime(value: string | null): string {
    if (!value) {
        return '--:--';
    }

    const [hourValue, minute = '00'] = value.split(':');
    const hour = Number(hourValue);

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return value.slice(0, 5);
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour.toString().padStart(2, '0')}:${minute} ${period}`;
}

export default function WeeklyCalendarPage({
    schedule,
}: WeeklyCalendarPageProps) {
    const normalizedSchedule = schedule.map((item) => ({
        ...item,
        dayKeys: item.days.map((day) => day.toLowerCase()),
    }));

    return (
        <AdminShell>
            <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-4 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
                <section className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400">
                            <CalendarDays size={16} />
                            Active class schedule
                        </div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
                            Weekly Calendar
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            View every active class by day, time, room, and teacher.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        {schedule.length} active classes
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                    {weekDays.map((day) => {
                        const dayClasses = normalizedSchedule.filter((item) =>
                            item.dayKeys.includes(day.key),
                        );

                        return (
                            <article
                                key={day.key}
                                className="min-h-48 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <header className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase xl:hidden">
                                            {day.shortLabel}
                                        </p>
                                        <h2 className="font-black text-slate-900 dark:text-white xl:text-sm">
                                            {day.label}
                                        </h2>
                                    </div>
                                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {dayClasses.length}
                                    </span>
                                </header>

                                <div className="grid gap-2">
                                    {dayClasses.length > 0 ? (
                                        dayClasses.map((item) => (
                                            <div
                                                key={`${day.key}-${item.id}`}
                                                className="rounded-lg border border-blue-100 bg-blue-50/80 p-3 dark:border-blue-500/20 dark:bg-blue-500/10"
                                            >
                                                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                                                    {item.name}
                                                </h3>
                                                <div className="mt-2 grid gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-300">
                                                        <Clock3 size={13} />
                                                        {formatTime(item.startsAt)} - {formatTime(item.endsAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin size={13} />
                                                        {item.room || 'No room'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <UserRound size={13} />
                                                        {item.teacher}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs font-bold text-slate-400 dark:border-slate-700">
                                            No classes
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>
            </div>
        </AdminShell>
    );
}
