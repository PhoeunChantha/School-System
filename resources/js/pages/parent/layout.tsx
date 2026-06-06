import type { SharedData } from '@/types';
import { dashboard } from '@/routes/parent';
import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, Home, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface ParentProfile {
    studentId?: number | null;
    name: string;
    nameKh: string;
    code: string;
    photo: string | null;
    className: string;
    level: string;
    gender: string;
    childrenCount?: number;
    unreadNotifications?: number;
}

interface Props {
    title: string;
    profile: ParentProfile;
    children: ReactNode;
}

export function initials(name: string): string {
    return (
        name
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'S'
    );
}

export function formatDate(value: string): string {
    if (!value) {
        return 'No date';
    }

    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function ParentLayout({ title, profile, children }: Props) {
    const { school } = usePage<SharedData>().props;
    const notificationCount = profile.unreadNotifications ?? 0;

    return (
        <>
            <Head title={`${title} - Parent Portal`}>
                <link rel="manifest" href="/parent/manifest.webmanifest" />
                <meta name="theme-color" content="#0f2f2a" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Parent Portal" />
            </Head>

            <main className="min-h-dvh bg-[#dfe3dc] text-[#10201c]">
                <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f8faf5] shadow-[0_26px_70px_rgba(16,32,28,0.22)]">
                    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 px-5 pt-4 pb-3 backdrop-blur-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <Link
                                    href={dashboard()}
                                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e1e9e4] bg-white text-[#30443e]"
                                    aria-label="Back home"
                                >
                                    <Home size={18} />
                                </Link>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef5f0] ring-1 ring-[#dbe7df]">
                                    {school.logo ? (
                                        <img
                                            src={school.logo}
                                            alt={school.nameEn}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ShieldCheck size={21} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black tracking-[0.18em] text-[#7b8c86] uppercase">
                                        {title}
                                    </p>
                                    <h1 className="truncate text-lg font-black text-[#10201c]">
                                        {profile.name}
                                    </h1>
                                </div>
                            </div>
                            <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e1e9e4] bg-white text-[#30443e]">
                                <Bell size={19} />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff4d5f] px-1 text-[10px] font-black text-white ring-2 ring-white">
                                        {notificationCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </header>

                    <section className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
                        {children}
                    </section>
                </div>
            </main>
        </>
    );
}

export function PageHeading({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] bg-[#eaf8f2] text-[#0e9f7c]">
                <Icon size={24} />
            </div>
            <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#10201c]">{title}</h2>
                <p className="mt-1 text-sm font-bold text-[#7b8c86]">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export function EmptyState({
    icon: Icon,
    text,
}: {
    icon: LucideIcon;
    text: string;
}) {
    return (
        <div className="rounded-[28px] bg-white p-5 text-sm font-bold text-[#64736e] shadow-[0_16px_38px_rgba(16,32,28,0.07)] ring-1 ring-[#e4ebe6]">
            <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef5f0] text-[#6a7b75]">
                    <Icon size={20} />
                </span>
                <span>{text}</span>
            </div>
        </div>
    );
}
