import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface CertificateLayout {
    heading: string;
    presented_to: string;
    body: string;
    grade: string;
    teacher_signature: string;
    director_signature: string;
    director_name: string;
}

export const defaultCertificateLayout: CertificateLayout = {
    heading: 'Certificate',
    presented_to: 'This certificate is presented to',
    body: 'For completing the course with dedication and strong progress.',
    grade: 'Grade A+',
    teacher_signature: 'Teacher Signature',
    director_signature: 'School Director',
    director_name: '',
};

export const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const errorTextClass = 'mt-1 text-[11px] font-bold text-red-500';

export function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={`${fieldGroupClass} ${wide ? 'md:col-span-2' : ''}`}>
            <label className={fieldLabelClass}>{label}</label>
            {children}
            {error && <div className={errorTextClass}>{error}</div>}
        </div>
    );
}

export function FileDrop({
    icon: Icon,
    label,
    description,
    onChange,
}: {
    icon: LucideIcon;
    label: string;
    description: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-500/10">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900 dark:text-slate-50">{label}</span>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">{description}</span>
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => onChange(event.target.files?.[0] ?? null)} />
        </label>
    );
}

export function CertificateCanvasPreview({
    title,
    studentName,
    levelName,
    issuedOn,
    certificateNumber,
    layout,
    templateImageUrl,
    logoImageUrl,
}: {
    title: string;
    studentName: string;
    levelName: string;
    issuedOn: string;
    certificateNumber: string;
    layout: CertificateLayout;
    templateImageUrl: string;
    logoImageUrl: string;
}) {
    return (
        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-950">
            <div className="relative aspect-[1.414/1] overflow-hidden rounded-[18px] bg-white text-center text-slate-900 shadow-inner">
                {templateImageUrl ? (
                    <img src={templateImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_48%,#e0f2fe_100%)]">
                        <div className="absolute inset-x-6 top-6 h-2 bg-blue-700" />
                        <div className="absolute inset-x-10 top-10 h-1 bg-amber-400" />
                        <div className="absolute inset-y-0 left-0 w-8 bg-blue-900" />
                        <div className="absolute bottom-0 right-0 h-16 w-44 -skew-x-12 bg-amber-400/80" />
                    </div>
                )}
                <div className="absolute inset-5 border-2 border-slate-300/70" />
                <div className="absolute inset-8 border border-slate-300/60" />

                <div className="relative z-10 flex h-full flex-col items-center px-[8%] py-[6%]">
                    <div className="flex w-full items-center justify-center gap-4">
                        {logoImageUrl && <img src={logoImageUrl} alt="" className="h-14 w-14 object-contain" />}
                        <div className="text-[clamp(16px,3vw,30px)] font-black tracking-tight">Frania Aranh Foundation School</div>
                    </div>

                    <div className="mt-[4%] font-serif text-[clamp(20px,4vw,42px)] font-bold">{layout.heading || 'Certificate'}</div>
                    <div className="mt-1 text-[clamp(10px,1.6vw,18px)] font-black uppercase tracking-wide text-indigo-500">{layout.presented_to}</div>
                    <div className="mt-2 font-serif text-[clamp(16px,2.8vw,30px)] font-bold">{studentName}</div>
                    <div className="mt-3 max-w-[76%] text-[clamp(8px,1.25vw,15px)] font-bold leading-relaxed text-slate-500">{layout.body}</div>
                    <div className="mt-auto text-[clamp(12px,2vw,24px)] font-black text-slate-700">{layout.grade || title}</div>
                    <div className="mt-3 text-[clamp(8px,1.2vw,14px)] font-bold text-slate-600">{issuedOn}</div>

                    <div className="mt-[4%] grid w-full grid-cols-2 gap-12 text-[clamp(8px,1.15vw,14px)]">
                        <div>
                            <div className="mx-auto h-px w-32 max-w-full bg-blue-700" />
                            <div className="mt-2 font-serif">{layout.teacher_signature}</div>
                        </div>
                        <div>
                            <div className="mx-auto h-px w-32 max-w-full bg-blue-700" />
                            <div className="mt-1 font-serif">{layout.director_name}</div>
                            <div className="font-serif">{layout.director_signature}</div>
                        </div>
                    </div>
                    <div className="absolute bottom-3 right-5 text-[9px] font-bold text-slate-400">{certificateNumber} - {levelName}</div>
                </div>
            </div>
        </div>
    );
}
