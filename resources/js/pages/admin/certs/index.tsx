import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/CertificateController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH, Pagination, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Award, Check, ChevronsUpDown, Edit3, Eye, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CertificateItem {
    id: number;
    routeKey?: string;
    studentId: number;
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
    type: CertificateType;
    title: string;
    academic_year: string;
    issued_on: string;
    certificate_number: string;
    status: CertificateStatus;
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

const pageClass = 'fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

function defaultCertificateNumber(): string {
    return `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function emptyForm(students: StudentOption[]): CertificateFormData {
    const student = students[0];

    return {
        student_id: student?.id ?? null,
        level_id: student?.levelId ?? null,
        type: 'completion',
        title: CERT_TYPES.completion.label,
        academic_year: new Date().getFullYear().toString(),
        issued_on: new Date().toISOString().slice(0, 10),
        certificate_number: defaultCertificateNumber(),
        status: 'issued',
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

export default function CertificatesPage({ certificates, students, levels, summary }: CertificatesPageProps) {
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

    const { data, setData, post, put, processing, errors, reset } = useForm<CertificateFormData>(emptyForm(students));

    useEffect(() => { setPage(1); }, [filter, search, orderBy, perPage]);

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
        setData(emptyForm(students));
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
        };

        if (drawerMode === 'edit' && editingCertificate) {
            put(update.url((editingCertificate.routeKey ?? editingCertificate.id) as never), options);
            return;
        }

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
        { key: 'print', label: 'Print', icon: Printer, onSelect: () => window.print() },
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditDrawer(certificate), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(certificate), variant: 'destructive' as const, separatorBefore: true, hidden: !canDelete },
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
                        <button onClick={openCreateDrawer} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add certificate">
                            <Plus size={18} />
                        </button>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <MetricCard label="Total" value={summary.certificateCount} tone="blue" />
                    <MetricCard label="Issued" value={summary.issuedCount} tone="green" />
                    <MetricCard label="Drafts" value={summary.draftCount} tone="amber" />
                    <MetricCard label="Void" value={summary.voidCount} tone="red" />
                </div>

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
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-x-0 md:border-t-0 md:shadow-none">
                        <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                        <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                            <SelectTrigger className={`${controlInputClass} min-w-0 md:min-w-[150px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={perPage.toString()} onValueChange={value => setPerPage(Number(value))}>
                            <SelectTrigger className={`${controlInputClass} min-w-0 md:min-w-[120px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filteredCertificates.length} result{filteredCertificates.length !== 1 ? 's' : ''}</span>
                        <input value={search} onChange={event => setSearch(event.target.value)} className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[260px]`} placeholder="Search certificates..." />
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

                                <Field label="Academic Year" error={errors.academic_year}>
                                    <input className={inputClass} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                                </Field>

                                <Field label="Issued On *" error={errors.issued_on}>
                                    <input type="date" className={inputClass} value={data.issued_on} onChange={event => setData('issued_on', event.target.value)} />
                                </Field>

                                <Field label="Certificate No. *" error={errors.certificate_number}>
                                    <input className={inputClass} value={data.certificate_number} onChange={event => setData('certificate_number', event.target.value)} />
                                </Field>
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

            {preview && <CertificatePreview certificate={preview} onClose={() => setPreview(null)} />}

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

function CertificatePreview({ certificate, onClose }: { certificate: CertificateItem; onClose: () => void }) {
    const meta = CERT_TYPES[certificate.type];

    return (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/55 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="w-full max-w-[620px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] dark:bg-slate-900">
                <div id="certificate-preview" className="bg-gradient-to-br from-slate-900 to-blue-700 px-6 py-10 text-center text-white md:px-12">
                    <Award size={54} className={`mx-auto mb-3 ${toneTextClass(meta.tone)}`} />
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/60">Certificate of {meta.label}</div>
                    <KH className="mb-5 block text-lg font-black">{meta.labelKh}</KH>
                    <div className="mb-4 text-xs text-white/60">This certifies that</div>
                    <KH className="mb-1 block text-3xl font-black">{certificate.studentNameKh}</KH>
                    <div className="mb-6 text-lg font-bold text-white/85">{certificate.studentNameEn}</div>
                    <div className="text-sm text-white/75">has received <strong>{certificate.title}</strong></div>
                    <div className="mt-2 text-xs text-white/60">{certificate.levelName} - {certificate.academicYear}</div>
                    <div className="mt-6 text-[11px] text-white/50">{certificate.certificateNumber} - Issued {certificate.issuedOn}</div>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-2 p-4">
                    <button onClick={onClose} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>Close</button>
                    <button onClick={() => window.print()} className={`${footerButtonClass} bg-blue-600 text-white hover:bg-blue-500`}><Printer size={15} /> Print Certificate</button>
                </div>
            </div>
        </div>
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
