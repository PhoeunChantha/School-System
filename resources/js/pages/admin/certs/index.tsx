import { create as createCertificate, createTemplate, destroy, destroyTemplate, store, storeTemplate, update, updateTemplate } from '@/actions/App/Http/Controllers/Backends/CertificateController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { Award, Check, ChevronsUpDown, Edit3, Eye, ImagePlus, Plus, Printer, Search, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CertificateItem {
    id: number;
    routeKey?: string;
    studentId: number;
    templateId: number | null;
    studentNameKh: string;
    studentNameEn: string;
    className: string;
    levelId: number | null;
    levelName: string;
    type: CertificateType;
    title: string;
    academicYear: string;
    issuedOn: string;
    certificateNumber: string;
    status: CertificateStatus;
    template: CertificateTemplateItem | null;
}

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

interface CertificatesPageProps {
    certificates: CertificateItem[];
    templates: CertificateTemplateItem[];
    students: StudentOption[];
    levels: LevelOption[];
    summary: {
        certificateCount: number;
        issuedCount: number;
        draftCount: number;
        voidCount: number;
    };
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

interface CertificateTemplateFormData {
    name: string;
    template_image: File | null;
    logo_image: File | null;
    is_active: boolean;
    layout: CertificateLayout;
}

interface CertificateLayout {
    heading: string;
    presented_to: string;
    body: string;
    grade: string;
    teacher_signature: string;
    director_signature: string;
    director_name: string;
}

type CertificateType = 'excellence' | 'merit' | 'completion' | 'participation';
type CertificateStatus = 'issued' | 'draft' | 'void';
type DrawerMode = 'create' | 'edit';
type OrderKey = 'issued-desc' | 'issued-asc' | 'student-asc' | 'type-asc' | 'status-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'issued-desc', label: 'Issued Newest' },
    { value: 'issued-asc', label: 'Issued Oldest' },
    { value: 'student-asc', label: 'Student A-Z' },
    { value: 'type-asc', label: 'Type' },
    { value: 'status-asc', label: 'Status' },
];

const CERT_TYPES: Record<CertificateType, { label: string; labelKh: string; tone: 'amber' | 'blue' | 'violet' | 'green' }> = {
    excellence: { label: 'Academic Excellence', labelKh: 'កិត្តិយស', tone: 'amber' },
    merit: { label: 'Merit Award', labelKh: 'ល្អប្រសើរ', tone: 'blue' },
    completion: { label: 'Course Completion', labelKh: 'បញ្ចប់ថ្នាក់', tone: 'violet' },
    participation: { label: 'Participation', labelKh: 'ការចូលរួម', tone: 'green' },
};

const statusType = {
    issued: 'green',
    draft: 'amber',
    void: 'red',
} as const;

const pageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

const defaultLayout: CertificateLayout = {
    heading: 'Certificate',
    presented_to: 'This certificate is presented to',
    body: 'For completing the course with dedication and strong progress.',
    grade: 'Grade A+',
    teacher_signature: 'Teacher Signature',
    director_signature: 'School Director',
    director_name: '',
};

function defaultCertificateNumber(): string {
    return `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function emptyForm(students: StudentOption[], templates: CertificateTemplateItem[] = []): CertificateFormData {
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

function emptyTemplateForm(): CertificateTemplateFormData {
    return {
        name: '',
        template_image: null,
        logo_image: null,
        is_active: true,
        layout: defaultLayout,
    };
}

function sortCertificates(list: CertificateItem[], order: OrderKey): CertificateItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'issued-desc': return b.issuedOn.localeCompare(a.issuedOn);
            case 'issued-asc': return a.issuedOn.localeCompare(b.issuedOn);
            case 'student-asc': return a.studentNameEn.localeCompare(b.studentNameEn);
            case 'type-asc': return a.type.localeCompare(b.type);
            case 'status-asc': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });
}

export default function CertificatesPage({ certificates, templates, students, levels, summary }: CertificatesPageProps) {
    const { can } = useAdminPermissions();
    const canCreate = can('certificates.create');
    const canUpdate = can('certificates.update');
    const canDelete = can('certificates.delete');
    const [filter, setFilter] = useState<CertificateType | 'all'>('all');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('issued-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingCertificate, setEditingCertificate] = useState<CertificateItem | null>(null);
    const [preview, setPreview] = useState<CertificateItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CertificateItem | null>(null);
    const [templateMode, setTemplateMode] = useState<DrawerMode | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<CertificateTemplateItem | null>(null);
    const [templateDeleteTarget, setTemplateDeleteTarget] = useState<CertificateTemplateItem | null>(null);
    const [templatePreviewUrl, setTemplatePreviewUrl] = useState('');
    const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
    const [printTarget, setPrintTarget] = useState<CertificateItem | null>(null);

    const { data, setData, post, processing, errors, reset, transform } = useForm<CertificateFormData>(emptyForm(students, templates));
    const templateForm = useForm<CertificateTemplateFormData>(emptyTemplateForm());

    useEffect(() => { setPage(1); }, [filter, search, orderBy, perPage]);

    useEffect(() => {
        if (!printTarget) {
            return;
        }

        const timer = window.setTimeout(() => window.print(), 80);
        const clearPrintTarget = () => setPrintTarget(null);

        window.addEventListener('afterprint', clearPrintTarget, { once: true });

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('afterprint', clearPrintTarget);
        };
    }, [printTarget]);

    useEffect(() => {
        if (!templateForm.data.template_image) return;

        const objectUrl = URL.createObjectURL(templateForm.data.template_image);
        setTemplatePreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [templateForm.data.template_image]);

    useEffect(() => {
        if (!templateForm.data.logo_image) return;

        const objectUrl = URL.createObjectURL(templateForm.data.logo_image);
        setLogoPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [templateForm.data.logo_image]);

    const filteredCertificates = useMemo(() => {
        const query = search.toLowerCase();
        const base = certificates.filter(certificate => {
            const matchesFilter = filter === 'all' || certificate.type === filter;
            const matchesSearch = !query
                || certificate.studentNameKh.includes(search)
                || certificate.studentNameEn.toLowerCase().includes(query)
                || certificate.title.toLowerCase().includes(query)
                || certificate.levelName.toLowerCase().includes(query)
                || certificate.certificateNumber.toLowerCase().includes(query)
                || certificate.status.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });

        return sortCertificates(base, orderBy);
    }, [certificates, filter, orderBy, search]);

    const paginatedCertificates = useMemo(
        () => filteredCertificates.slice((page - 1) * perPage, page * perPage),
        [filteredCertificates, page, perPage],
    );

    const selectedStudent = useMemo(
        () => students.find(student => student.id === data.student_id) ?? null,
        [students, data.student_id],
    );

    const selectedTemplate = useMemo(
        () => templates.find(template => template.id === data.template_id) ?? null,
        [templates, data.template_id],
    );

    const searchableStudents = useMemo(() => {
        const query = studentSearch.toLowerCase();

        return students.filter(student =>
            !query
            || student.nameKh.includes(studentSearch)
            || student.nameEn.toLowerCase().includes(query)
            || student.className.toLowerCase().includes(query)
            || student.level.toLowerCase().includes(query),
        );
    }, [students, studentSearch]);

    const openCreateDrawer = () => {
        if (!canCreate) return;
        reset();
        setData(emptyForm(students, templates));
        setStudentSearch('');
        setStudentPickerOpen(false);
        setEditingCertificate(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (certificate: CertificateItem) => {
        if (!canUpdate) return;
        setData({
            student_id: certificate.studentId,
            level_id: certificate.levelId,
            template_id: certificate.templateId,
            type: certificate.type,
            title: certificate.title,
            academic_year: certificate.academicYear,
            issued_on: certificate.issuedOn,
            certificate_number: certificate.certificateNumber,
            status: certificate.status,
        });
        setStudentSearch('');
        setStudentPickerOpen(false);
        setEditingCertificate(certificate);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setStudentSearch('');
        setStudentPickerOpen(false);
        setDrawerMode(null);
        setEditingCertificate(null);
    };

    const selectStudent = (studentId: number) => {
        const student = students.find(item => item.id === studentId);
        setData(current => ({
            ...current,
            student_id: studentId,
            level_id: student?.levelId ?? current.level_id,
        }));
        setStudentPickerOpen(false);
        setStudentSearch('');
    };

    const selectType = (type: CertificateType) => {
        setData(current => ({ ...current, type, title: CERT_TYPES[type].label }));
    };

    const updateTemplateLayout = (key: keyof CertificateLayout, value: string) => {
        templateForm.setData(current => ({
            ...current,
            layout: {
                ...current.layout,
                [key]: value,
            },
        }));
    };

    const openCreateTemplateDrawer = () => {
        if (!canCreate) return;
        templateForm.reset();
        templateForm.clearErrors();
        templateForm.setData(emptyTemplateForm());
        setTemplatePreviewUrl('');
        setLogoPreviewUrl('');
        setEditingTemplate(null);
        setTemplateMode('create');
    };

    const openEditTemplateDrawer = (template: CertificateTemplateItem) => {
        if (!canUpdate) return;
        templateForm.clearErrors();
        templateForm.setData({
            name: template.name,
            template_image: null,
            logo_image: null,
            is_active: template.isActive,
            layout: template.layout,
        });
        setTemplatePreviewUrl(template.templateImageUrl);
        setLogoPreviewUrl(template.logoImageUrl);
        setEditingTemplate(template);
        setTemplateMode('edit');
    };

    const closeTemplateDrawer = () => {
        setTemplateMode(null);
        setEditingTemplate(null);
        setTemplatePreviewUrl('');
        setLogoPreviewUrl('');
        templateForm.clearErrors();
    };

    const submitTemplate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (templateMode === 'edit' && !canUpdate) {
            closeTemplateDrawer();
            return;
        }

        if (templateMode === 'create' && !canCreate) {
            closeTemplateDrawer();
            return;
        }

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(templateMode === 'edit' ? 'Template updated.' : 'Template created.');
                closeTemplateDrawer();
            },
        };

        if (templateMode === 'edit' && editingTemplate) {
            templateForm.transform(formData => ({ ...formData, _method: 'put' }));
            templateForm.post(updateTemplate.url((editingTemplate.routeKey ?? editingTemplate.id) as never), options);
            return;
        }

        templateForm.transform(formData => formData);
        templateForm.post(storeTemplate.url(), options);
    };

    const confirmTemplateDelete = () => {
        if (!templateDeleteTarget) return;

        if (!canDelete) {
            setTemplateDeleteTarget(null);
            return;
        }

        router.delete(destroyTemplate.url((templateDeleteTarget.routeKey ?? templateDeleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Template deleted.');
                setTemplateDeleteTarget(null);
            },
        });
    };

    const submitCertificate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (drawerMode === 'edit' && !canUpdate) {
            closeDrawer();
            return;
        }

        if (drawerMode === 'create' && !canCreate) {
            closeDrawer();
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Certificate updated.' : 'Certificate created.');
                closeDrawer();
            },
            forceFormData: true,
        };

        if (drawerMode === 'edit' && editingCertificate) {
            transform(formData => ({ ...formData, _method: 'put' }));
            post(update.url((editingCertificate.routeKey ?? editingCertificate.id) as never), options);
            return;
        }

        transform(formData => formData);
        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Certificate deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const actionsFor = (certificate: CertificateItem) => [
        { key: 'preview', label: 'Preview', icon: Eye, onSelect: () => setPreview(certificate) },
        { key: 'print', label: 'Print', icon: Printer, onSelect: () => setPrintTarget(certificate) },
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(certificate), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(certificate), variant: 'destructive' as const, separatorBefore: true, hidden: !canDelete },
    ];

    const templateActionsFor = (template: CertificateTemplateItem) => [
        { key: 'edit', label: 'Edit template', icon: Edit3, onSelect: () => openEditTemplateDrawer(template), hidden: !canUpdate },
        { key: 'delete', label: 'Delete template', icon: Trash2, onSelect: () => setTemplateDeleteTarget(template), variant: 'destructive' as const, hidden: !canDelete },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="min-w-0">
                        <span className="block text-xs font-black text-slate-400">Certificates</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{summary.certificateCount} total</strong>
                        <p className="mt-1 truncate text-xs font-extrabold text-slate-400">{summary.issuedCount} issued - {summary.draftCount} drafts</p>
                    </div>
                    {canCreate && (
                        <Link href={createCertificate.url()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add certificate">
                            <Plus size={18} />
                        </Link>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <MetricCard label="Total" value={summary.certificateCount} tone="blue" />
                    <MetricCard label="Issued" value={summary.issuedCount} tone="green" />
                    <MetricCard label="Drafts" value={summary.draftCount} tone="amber" />
                    <MetricCard label="Void" value={summary.voidCount} tone="red" />
                </div>

                <section className={panelClass}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-slate-50">Certificate Templates</h2>
                            <p className="text-xs font-bold text-slate-400">{templates.length} saved template{templates.length !== 1 ? 's' : ''}</p>
                        </div>
                        {canCreate && (
                            <Link href={createTemplate.url()} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500">
                                <Plus size={15} /> Add Template
                            </Link>
                        )}
                    </div>

                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 md:block">
                        <table className="min-w-full border-collapse text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950">
                                <tr className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                                    <th className="px-3 py-3">Template</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Certificates</th>
                                    <th className="px-3 py-3">Preview</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No certificate templates yet</td>
                                    </tr>
                                ) : templates.map(template => (
                                    <tr key={template.id} className="border-t border-slate-100 dark:border-slate-700">
                                        <td className="px-3 py-3 text-sm font-black text-slate-900 dark:text-slate-50">{template.name}</td>
                                        <td className="px-3 py-3"><Badge type={template.isActive ? 'green' : 'amber'}>{template.isActive ? 'active' : 'inactive'}</Badge></td>
                                        <td className="px-3 py-3 text-sm font-bold text-slate-500 dark:text-slate-300">{template.certificatesCount}</td>
                                        <td className="px-3 py-3">
                                            <img src={template.templateImageUrl} alt="" className="h-12 w-20 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
                                        </td>
                                        <td className="px-3 py-3"><RowActions ariaLabel={`Actions for ${template.name}`} actions={templateActionsFor(template)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-2 md:hidden">
                        {templates.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-bold text-slate-400 dark:border-slate-700">No certificate templates yet</div>
                        ) : templates.map(template => (
                            <article key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950">
                                <div className="flex items-center gap-3">
                                    <img src={template.templateImageUrl} alt="" className="h-14 w-20 rounded-xl object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{template.name}</div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge type={template.isActive ? 'green' : 'amber'}>{template.isActive ? 'active' : 'inactive'}</Badge>
                                            <span className="text-xs font-bold text-slate-400">{template.certificatesCount} certs</span>
                                        </div>
                                    </div>
                                    <RowActions ariaLabel={`Actions for ${template.name}`} actions={templateActionsFor(template)} />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={panelClass}>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {[{ id: 'all' as const, label: `All (${certificates.length})` }, ...Object.entries(CERT_TYPES).map(([id, meta]) => ({ id: id as CertificateType, label: meta.label }))].map(option => (
                            <button
                                key={option.id}
                                onClick={() => setFilter(option.id)}
                                className={`min-h-9 shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition ${filter === option.id ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                            <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[170px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={perPage.toString()} onValueChange={value => setPerPage(Number(value))}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[130px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filteredCertificates.length} result{filteredCertificates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`} placeholder="Search certificates..." />
                    </div>

                    <table className={desktopTableClass}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Certificate</th>
                                <th>Level</th>
                                <th>Issued On</th>
                                <th>Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No certificates found for <strong>"{search}"</strong></> : 'No certificates found'}
                                    </td>
                                </tr>
                            ) : paginatedCertificates.map(certificate => (
                                <tr key={certificate.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td><StudentName certificate={certificate} /></td>
                                    <td><CertificateLabel certificate={certificate} /></td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{certificate.levelName || certificate.className || '-'}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{certificate.issuedOn}</td>
                                    <td className="text-xs font-black text-slate-700 dark:text-slate-200">{certificate.certificateNumber}</td>
                                    <td><Badge type={statusType[certificate.status]}>{certificate.status}</Badge></td>
                                    <td><RowActions ariaLabel={`Actions for ${certificate.certificateNumber}`} actions={actionsFor(certificate)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginatedCertificates.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-9 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                {search ? <>No certificates found for <strong>"{search}"</strong></> : 'No certificates found'}
                            </div>
                        ) : paginatedCertificates.map(certificate => (
                            <article key={certificate.id} className={mobileCardClass}>
                                <div className="flex items-start justify-between gap-3">
                                    <StudentName certificate={certificate} />
                                    <RowActions ariaLabel={`Actions for ${certificate.certificateNumber}`} actions={actionsFor(certificate)} />
                                </div>
                                <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                                    <CertificateLabel certificate={certificate} />
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <InfoTile label="Level" value={certificate.levelName || certificate.className || '-'} />
                                    <InfoTile label="Issued" value={certificate.issuedOn || '-'} />
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Status</span>
                                        <div className="mt-1"><Badge type={statusType[certificate.status]}>{certificate.status}</Badge></div>
                                    </div>
                                </div>
                                <div className="mt-3 truncate rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">{certificate.certificateNumber}</div>
                            </article>
                        ))}
                    </div>

                    {filteredCertificates.length > 0 && (
                        <Pagination total={filteredCertificates.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                    )}
                </section>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitCertificate} className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {drawerMode === 'create' ? 'Add Certificate' : 'Edit Certificate'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Issue a certificate for a student' : editingCertificate?.certificateNumber}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-5">
                                <Field label="Student *" error={errors.student_id} wide>
                                    <SearchablePicker
                                        open={studentPickerOpen}
                                        onOpenChange={setStudentPickerOpen}
                                        search={studentSearch}
                                        onSearchChange={setStudentSearch}
                                        placeholder="Select student"
                                        searchPlaceholder="Search students..."
                                        selectedLabel={selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : null}
                                        emptyLabel="No students found"
                                    >
                                        {searchableStudents.map(student => (
                                            <PickerOption key={student.id} selected={student.id === data.student_id} onClick={() => selectStudent(student.id)}>
                                                <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{student.nameEn}</span>
                                                <span className="block truncate text-xs font-bold text-slate-400">{student.nameKh} - {student.className || student.level}</span>
                                            </PickerOption>
                                        ))}
                                    </SearchablePicker>
                                </Field>

                                <Field label="Type *" error={errors.type}>
                                    <Select value={data.type} onValueChange={value => selectType(value as CertificateType)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CERT_TYPES).map(([id, meta]) => <SelectItem key={id} value={id}>{meta.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Status *" error={errors.status}>
                                    <Select value={data.status} onValueChange={value => setData('status', value as CertificateStatus)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="issued">Issued</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="void">Void</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Title *" error={errors.title} wide>
                                    <input className={inputClass} value={data.title} onChange={event => setData('title', event.target.value)} />
                                </Field>

                                <Field label="Level" error={errors.level_id}>
                                    <Select value={data.level_id ? String(data.level_id) : 'student-level'} onValueChange={value => setData('level_id', value === 'student-level' ? null : Number(value))}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student-level">Use student level</SelectItem>
                                            {levels.map(level => <SelectItem key={level.id} value={String(level.id)}>{level.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Template *" error={errors.template_id}>
                                    <Select value={data.template_id ? String(data.template_id) : 'none'} onValueChange={value => setData('template_id', value === 'none' ? null : Number(value))}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {templates.length === 0 && <SelectItem value="none" disabled>Create template first</SelectItem>}
                                            {templates
                                                .filter(template => template.isActive || template.id === data.template_id)
                                                .map(template => <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {templates.length === 0 && (
                                        <Link href={createTemplate.url()} className="mt-2 inline-flex text-xs font-black text-blue-600 hover:text-blue-500 dark:text-blue-300">
                                            Create a certificate template
                                        </Link>
                                    )}
                                </Field>

                                <Field label="Academic Year" error={errors.academic_year}>
                                    <input className={inputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                                </Field>

                                <Field label="Issued On *" error={errors.issued_on}>
                                    <input type="date" className={inputClass} value={data.issued_on} onChange={event => setData('issued_on', event.target.value)} />
                                </Field>

                                <Field label="Certificate No. *" error={errors.certificate_number}>
                                    <input className={inputClass} value={data.certificate_number} onChange={event => setData('certificate_number', event.target.value)} />
                                </Field>

                                <div className="md:col-span-2">
                                    <CertificateCanvasPreview
                                        title={data.title}
                                        studentName={selectedStudent?.nameEn ?? 'Student name'}
                                        levelName={levels.find(level => level.id === data.level_id)?.name ?? selectedStudent?.level ?? 'Course level'}
                                        issuedOn={data.issued_on}
                                        certificateNumber={data.certificate_number}
                                        layout={selectedTemplate?.layout ?? defaultLayout}
                                        templateImageUrl={selectedTemplate?.templateImageUrl ?? ''}
                                        logoImageUrl={selectedTemplate?.logoImageUrl ?? ''}
                                    />
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                                <button type="button" onClick={closeDrawer} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                    <X size={15} /> Cancel
                                </button>
                                <button disabled={processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                    {drawerMode === 'create' ? 'Save Certificate' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <Sheet open={templateMode !== null} onOpenChange={(open) => { if (!open) closeTemplateDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[620px]">
                    {templateMode && (
                        <form onSubmit={submitTemplate} className="flex min-h-full flex-col bg-white dark:bg-slate-900">
                            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left dark:border-slate-700">
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                                    {templateMode === 'create' ? 'Add Certificate Template' : 'Edit Certificate Template'}
                                </SheetTitle>
                                <SheetDescription>
                                    Upload the background once, then assign it from Add Certificate.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-5">
                                <Field label="Template name *" error={templateForm.errors.name} wide>
                                    <input className={inputClass} value={templateForm.data.name} onChange={event => templateForm.setData('name', event.target.value)} placeholder="e.g. Completion certificate" />
                                </Field>

                                <Field label="Template image *" error={templateForm.errors.template_image} wide>
                                    <FileDrop
                                        icon={ImagePlus}
                                        label={templatePreviewUrl ? 'Replace certificate background' : 'Upload certificate background'}
                                        description="JPG, PNG, or WebP template image"
                                        onChange={file => templateForm.setData('template_image', file)}
                                    />
                                </Field>

                                <Field label="Logo image" error={templateForm.errors.logo_image} wide>
                                    <FileDrop
                                        icon={Upload}
                                        label={logoPreviewUrl ? 'Replace certificate logo' : 'Upload certificate logo'}
                                        description="Optional logo shown on the certificate"
                                        onChange={file => templateForm.setData('logo_image', file)}
                                    />
                                </Field>

                                <Field label="Heading" error={templateForm.errors['layout.heading']}>
                                    <input className={inputClass} value={templateForm.data.layout.heading} onChange={event => updateTemplateLayout('heading', event.target.value)} />
                                </Field>

                                <Field label="Presented line" error={templateForm.errors['layout.presented_to']}>
                                    <input className={inputClass} value={templateForm.data.layout.presented_to} onChange={event => updateTemplateLayout('presented_to', event.target.value)} />
                                </Field>

                                <Field label="Certificate body" error={templateForm.errors['layout.body']} wide>
                                    <textarea className={`${inputClass} min-h-24 resize-none`} value={templateForm.data.layout.body} onChange={event => updateTemplateLayout('body', event.target.value)} />
                                </Field>

                                <Field label="Grade / award text" error={templateForm.errors['layout.grade']}>
                                    <input className={inputClass} value={templateForm.data.layout.grade} onChange={event => updateTemplateLayout('grade', event.target.value)} />
                                </Field>

                                <Field label="Director name" error={templateForm.errors['layout.director_name']}>
                                    <input className={inputClass} value={templateForm.data.layout.director_name} onChange={event => updateTemplateLayout('director_name', event.target.value)} />
                                </Field>

                                <Field label="Teacher signature label" error={templateForm.errors['layout.teacher_signature']}>
                                    <input className={inputClass} value={templateForm.data.layout.teacher_signature} onChange={event => updateTemplateLayout('teacher_signature', event.target.value)} />
                                </Field>

                                <Field label="Director signature label" error={templateForm.errors['layout.director_signature']}>
                                    <input className={inputClass} value={templateForm.data.layout.director_signature} onChange={event => updateTemplateLayout('director_signature', event.target.value)} />
                                </Field>

                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 md:col-span-2">
                                    <input type="checkbox" checked={templateForm.data.is_active} onChange={event => templateForm.setData('is_active', event.target.checked)} className="h-4 w-4 accent-blue-600" />
                                    Active template
                                </label>

                                <div className="md:col-span-2">
                                    <CertificateCanvasPreview
                                        title={templateForm.data.layout.grade}
                                        studentName="Student name"
                                        levelName="Course level"
                                        issuedOn={new Date().toISOString().slice(0, 10)}
                                        certificateNumber="CERT-PREVIEW"
                                        layout={templateForm.data.layout}
                                        templateImageUrl={templatePreviewUrl}
                                        logoImageUrl={logoPreviewUrl}
                                    />
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                                <button type="button" onClick={closeTemplateDrawer} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                    <X size={15} /> Cancel
                                </button>
                                <button disabled={templateForm.processing} type="submit" className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                    {templateMode === 'create' ? 'Save Template' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {preview && <CertificatePreview certificate={preview} onClose={() => setPreview(null)} onPrint={() => setPrintTarget(preview)} />}
            {printTarget && <CertificatePrintTarget certificate={printTarget} />}

            {deleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Certificate?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.certificateNumber}</strong> for {deleteTarget.studentNameEn}?</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                                <X size={15} /> Cancel
                            </button>
                            <button onClick={confirmDelete} className={`${footerButtonClass} bg-red-500 text-white hover:bg-red-600`}>
                                <Trash2 size={15} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {templateDeleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Template?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{templateDeleteTarget.name}</strong>? Certificates using it will keep their records without a template.</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setTemplateDeleteTarget(null)} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                                <X size={15} /> Cancel
                            </button>
                            <button onClick={confirmTemplateDelete} className={`${footerButtonClass} bg-red-500 text-white hover:bg-red-600`}>
                                <Trash2 size={15} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={wide ? 'md:col-span-2' : undefined}>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</label>
            {children}
            {error && <div className="mt-1.5 text-xs font-bold text-red-500">{error}</div>}
        </div>
    );
}

function SearchablePicker({
    open,
    onOpenChange,
    search,
    onSearchChange,
    placeholder,
    searchPlaceholder,
    selectedLabel,
    emptyLabel,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    selectedLabel: string | null;
    emptyLabel: string;
    children: ReactNode;
}) {
    const hasOptions = Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button type="button" className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
                    <span className="min-w-0 truncate">{selectedLabel ?? placeholder}</span>
                    <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div className="flex items-center gap-2 border-b border-slate-200 p-2 dark:border-slate-700">
                    <Search size={15} className="shrink-0 text-slate-400" />
                    <input value={search} onChange={event => onSearchChange(event.target.value)} placeholder={searchPlaceholder} autoFocus className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50" />
                </div>
                <div className="max-h-[280px] overflow-y-auto p-1.5">
                    {hasOptions ? children : <div className="px-3 py-5 text-center text-sm font-bold text-slate-400">{emptyLabel}</div>}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PickerOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${selected ? 'bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Check size={15} className={`shrink-0 ${selected ? 'text-blue-600' : 'text-transparent'}`} />
            <span className="min-w-0 flex-1">{children}</span>
        </button>
    );
}

function FileDrop({
    icon: Icon,
    label,
    description,
    onChange,
}: {
    icon: typeof Upload;
    label: string;
    description: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-500/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                <Icon size={19} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900 dark:text-slate-50">{label}</span>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">{description}</span>
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={event => onChange(event.target.files?.[0] ?? null)} />
        </label>
    );
}

function CertificateCanvasPreview({
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
                    <div className="mt-3 text-[clamp(8px,1.2vw,14px)] font-bold text-slate-600">{issuedOn || new Date().toISOString().slice(0, 10)}</div>

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

function CertificatePreview({ certificate, onClose, onPrint }: { certificate: CertificateItem; onClose: () => void; onPrint: () => void }) {
    const template = certificate.template;

    return (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/55 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="w-full max-w-[900px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] dark:bg-slate-900">
                <div id="certificate-preview" className="p-3">
                    <CertificateCanvasPreview
                        title={certificate.title}
                        studentName={certificate.studentNameEn}
                        levelName={certificate.levelName || certificate.className}
                        issuedOn={certificate.issuedOn}
                        certificateNumber={certificate.certificateNumber}
                        layout={template?.layout ?? defaultLayout}
                        templateImageUrl={template?.templateImageUrl ?? ''}
                        logoImageUrl={template?.logoImageUrl ?? ''}
                    />
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-2 p-4">
                    <button onClick={onClose} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>Close</button>
                    <button onClick={onPrint} className={`${footerButtonClass} bg-blue-600 text-white hover:bg-blue-500`}><Printer size={15} /> Print Certificate</button>
                </div>
            </div>
        </div>
    );
}

function CertificatePrintTarget({ certificate }: { certificate: CertificateItem }) {
    const template = certificate.template;

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #certificate-print-root,
                    #certificate-print-root * { visibility: visible !important; }
                    #certificate-print-root {
                        position: fixed !important;
                        inset: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: white !important;
                        padding: 0 !important;
                        z-index: 999999 !important;
                    }
                    #certificate-print-root .certificate-print-sheet {
                        width: 297mm !important;
                        max-width: 297mm !important;
                        height: auto !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        padding: 0 !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 8mm;
                    }
                }
            `}</style>
            <div id="certificate-print-root" className="pointer-events-none fixed inset-0 -z-10 hidden bg-white print:z-[999999] print:flex">
                <div className="certificate-print-sheet w-[297mm]">
                    <CertificateCanvasPreview
                        title={certificate.title}
                        studentName={certificate.studentNameEn}
                        levelName={certificate.levelName || certificate.className}
                        issuedOn={certificate.issuedOn}
                        certificateNumber={certificate.certificateNumber}
                        layout={template?.layout ?? defaultLayout}
                        templateImageUrl={template?.templateImageUrl ?? ''}
                        logoImageUrl={template?.logoImageUrl ?? ''}
                    />
                </div>
            </div>
        </>
    );
}

function StudentName({ certificate }: { certificate: CertificateItem }) {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={certificate.studentNameEn} size={36} />
            <div className="min-w-0">
                <KH className="block truncate text-sm font-black text-slate-900 dark:text-slate-50">{certificate.studentNameKh}</KH>
                <div className="truncate text-[11px] font-bold text-slate-400">{certificate.studentNameEn}</div>
            </div>
        </div>
    );
}

function CertificateLabel({ certificate }: { certificate: CertificateItem }) {
    const meta = CERT_TYPES[certificate.type];

    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${toneSoftClass(meta.tone)} ${toneTextClass(meta.tone)}`}>
                <Award size={17} />
            </div>
            <div className="min-w-0">
                <div className="truncate text-xs font-black text-slate-900 dark:text-slate-50">{certificate.title}</div>
                <KH className={`block truncate text-[11px] font-bold ${toneTextClass(meta.tone)}`}>{meta.labelKh}</KH>
            </div>
        </div>
    );
}

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
            <span className="block text-[9px] font-black uppercase text-slate-400">{label}</span>
            <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{value}</strong>
        </div>
    );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'amber' | 'red' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="text-2xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function metricClass(tone: 'blue' | 'green' | 'amber' | 'red') {
    if (tone === 'green') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500';
    if (tone === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-500';
    if (tone === 'red') return 'border-red-500/25 bg-red-500/10 text-red-500';
    return 'border-blue-500/25 bg-blue-500/10 text-blue-500';
}

function toneSoftClass(tone: 'amber' | 'blue' | 'violet' | 'green') {
    if (tone === 'amber') return 'bg-amber-500/10';
    if (tone === 'blue') return 'bg-blue-500/10';
    if (tone === 'green') return 'bg-emerald-500/10';
    return 'bg-violet-500/10';
}

function toneTextClass(tone: 'amber' | 'blue' | 'violet' | 'green') {
    if (tone === 'amber') return 'text-amber-500';
    if (tone === 'blue') return 'text-blue-500';
    if (tone === 'green') return 'text-emerald-500';
    return 'text-violet-500';
}
