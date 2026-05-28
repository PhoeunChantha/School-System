import { createTemplate, index as certIndex, store } from '@/actions/App/Http/Controllers/Backends/CertificateController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { CertificateCanvasPreview, CertificateLayout, defaultCertificateLayout, Field, fieldInputClass } from '@/pages/admin/certs/components/certificate-form-ui';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Award, Check, ChevronsUpDown, Save, Search, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CertificateTemplateItem {
    id: number;
    routeKey?: string;
    name: string;
    templateImageUrl: string;
    logoImageUrl: string;
    layout: CertificateLayout;
    isActive: boolean;
    certificatesCount: number;
}

interface StudentOption {
    id: number;
    routeKey?: string;
    nameKh: string;
    nameEn: string;
    levelId: number | null;
    level: string;
    className: string;
}

interface LevelOption {
    id: number;
    routeKey?: string;
    name: string;
}

interface CreateCertificatePageProps {
    templates: CertificateTemplateItem[];
    students: StudentOption[];
    levels: LevelOption[];
}

interface CertificateFormData {
    student_id: number | null;
    level_id: number | null;
    template_id: number | null;
    type: CertificateType;
    title: string;
    academic_year: string;
    issued_on: string;
    certificate_number: string;
    status: CertificateStatus;
}

type CertificateType = 'excellence' | 'merit' | 'completion' | 'participation';
type CertificateStatus = 'issued' | 'draft' | 'void';

const CERT_TYPES: Record<CertificateType, { label: string; tone: 'amber' | 'blue' | 'violet' | 'green' }> = {
    excellence: { label: 'Academic Excellence', tone: 'amber' },
    merit: { label: 'Merit Award', tone: 'blue' },
    completion: { label: 'Course Completion', tone: 'violet' },
    participation: { label: 'Participation', tone: 'green' },
};

function defaultCertificateNumber(): string {
    return `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function emptyForm(students: StudentOption[], templates: CertificateTemplateItem[]): CertificateFormData {
    const student = students[0];
    const template = templates.find(item => item.isActive) ?? templates[0];

    return {
        student_id: student?.id ?? null,
        level_id: student?.levelId ?? null,
        template_id: template?.id ?? null,
        type: 'completion',
        title: CERT_TYPES.completion.label,
        academic_year: new Date().getFullYear().toString(),
        issued_on: new Date().toISOString().slice(0, 10),
        certificate_number: defaultCertificateNumber(),
        status: 'issued',
    };
}

export default function CreateCertificatePage({ templates, students, levels }: CreateCertificatePageProps) {
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const { data, setData, post, processing, errors } = useForm<CertificateFormData>(emptyForm(students, templates));

    const selectedStudent = useMemo(() => students.find(student => student.id === data.student_id), [data.student_id, students]);
    const selectedTemplate = useMemo(() => templates.find(template => template.id === data.template_id), [data.template_id, templates]);
    const selectedLevel = useMemo(() => levels.find(level => level.id === data.level_id), [data.level_id, levels]);

    const filteredStudents = useMemo(() => {
        const term = studentSearch.trim().toLowerCase();

        if (!term) {
            return students;
        }

        return students.filter(student => `${student.nameEn} ${student.nameKh} ${student.level} ${student.className}`.toLowerCase().includes(term));
    }, [studentSearch, students]);

    const selectStudent = (student: StudentOption) => {
        setData(current => ({
            ...current,
            student_id: student.id,
            level_id: student.levelId,
        }));
        setStudentPickerOpen(false);
    };

    const selectType = (type: CertificateType) => {
        setData(current => ({
            ...current,
            type,
            title: CERT_TYPES[type].label,
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => toast.success('Certificate created.'),
        });
    };

    return (
        <AdminShell>
            <div className="fade-in bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="mb-3 hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Add Certificate</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">Issue a certificate for a student</div>
                    </div>
                    <Link href={certIndex.url()} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowLeft size={15} /> Back
                    </Link>
                </div>

                <form onSubmit={submit} className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 md:grid md:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)] md:p-6">
                    <section className="md:col-span-2 flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                        <div>
                            <span className="block text-xs font-black text-slate-400">Certificate issue</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">Add Certificate</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">Select a student, template, and issue details.</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]">
                            <Award size={20} />
                        </div>
                    </section>

                    <div className="grid content-start gap-3 md:grid-cols-2">
                        <Field label="Student *" error={errors.student_id} wide>
                            <Popover open={studentPickerOpen} onOpenChange={setStudentPickerOpen}>
                                <PopoverTrigger asChild>
                                    <button type="button" className={`${fieldInputClass} flex items-center justify-between gap-2 text-left`}>
                                        <span className="min-w-0 truncate">{selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : 'Select student...'}</span>
                                        <ChevronsUpDown size={16} className="text-slate-400" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-[min(620px,calc(100vw-32px))] rounded-2xl border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                                    <div className="relative mb-2">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={studentSearch} onChange={event => setStudentSearch(event.target.value)} className={`${fieldInputClass} min-h-10 pl-9`} placeholder="Search student..." />
                                    </div>
                                    <div className="max-h-64 space-y-1 overflow-y-auto">
                                        {filteredStudents.map(student => (
                                            <button key={student.id} type="button" onClick={() => selectStudent(student)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{student.nameEn}</span>
                                                    <span className="block truncate text-xs font-bold text-slate-400">{student.level} - {student.className || 'No class'}</span>
                                                </span>
                                                {data.student_id === student.id && <Check size={16} className="text-blue-500" />}
                                            </button>
                                        ))}
                                        {filteredStudents.length === 0 && <div className="px-3 py-6 text-center text-xs font-bold text-slate-400">No students found</div>}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </Field>

                        <Field label="Type *" error={errors.type}>
                            <Select value={data.type} onValueChange={value => selectType(value as CertificateType)}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CERT_TYPES).map(([value, type]) => <SelectItem key={value} value={value}>{type.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Status *" error={errors.status}>
                            <Select value={data.status} onValueChange={value => setData('status', value as CertificateStatus)}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="issued">Issued</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="void">Void</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Title *" error={errors.title} wide>
                            <input className={fieldInputClass} value={data.title} onChange={event => setData('title', event.target.value)} placeholder="Certificate title" />
                        </Field>

                        <Field label="Level" error={errors.level_id}>
                            <Select value={data.level_id ? String(data.level_id) : 'none'} onValueChange={value => setData('level_id', value === 'none' ? null : Number(value))}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No level</SelectItem>
                                    {levels.map(level => <SelectItem key={level.id} value={String(level.id)}>{level.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Template *" error={errors.template_id}>
                            <Select value={data.template_id ? String(data.template_id) : 'none'} onValueChange={value => setData('template_id', value === 'none' ? null : Number(value))}>
                                <SelectTrigger className={fieldInputClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.length === 0 ? (
                                        <SelectItem value="none">Create template first</SelectItem>
                                    ) : (
                                        templates.map(template => <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>)
                                    )}
                                </SelectContent>
                            </Select>
                            {templates.length === 0 && (
                                <Link href={createTemplate.url()} className="mt-1 inline-flex text-xs font-black text-blue-600 hover:text-blue-500 dark:text-blue-300">
                                    Create a certificate template
                                </Link>
                            )}
                        </Field>

                        <Field label="Academic year" error={errors.academic_year}>
                            <input className={fieldInputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                        </Field>

                        <Field label="Issued on *" error={errors.issued_on}>
                            <input type="date" className={fieldInputClass} value={data.issued_on} onChange={event => setData('issued_on', event.target.value)} />
                        </Field>

                        <Field label="Certificate no. *" error={errors.certificate_number} wide>
                            <input className={fieldInputClass} value={data.certificate_number} onChange={event => setData('certificate_number', event.target.value)} />
                        </Field>
                    </div>

                    <div className="grid content-start gap-3">
                        <CertificateCanvasPreview
                            title={data.title}
                            studentName={selectedStudent?.nameEn ?? 'Student name'}
                            levelName={selectedLevel?.name ?? selectedStudent?.level ?? 'Course level'}
                            issuedOn={data.issued_on}
                            certificateNumber={data.certificate_number}
                            layout={selectedTemplate?.layout ?? defaultCertificateLayout}
                            templateImageUrl={selectedTemplate?.templateImageUrl ?? ''}
                            logoImageUrl={selectedTemplate?.logoImageUrl ?? ''}
                        />

                        <div className="grid grid-cols-[1fr_2fr] gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/70">
                            <Link href={certIndex.url()} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
                                <X size={15} /> Cancel
                            </Link>
                            <button disabled={processing} type="submit" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300">
                                <Save size={15} /> Save Certificate
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
