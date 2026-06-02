import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/ExamController';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination, RowActions, type RowAction } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TipImage from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Edit3, FileText, Paperclip, Plus, Printer, Save, Trash2, Upload, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ExamClassOption {
    id: number;
    routeKey?: string;
    name: string;
    room: string;
    studentCount: number;
}

interface ExamItem {
    id: number;
    routeKey?: string;
    schoolClassId: number | null;
    className: string;
    title: string;
    subject: string;
    academicYear: string;
    examDate: string;
    durationMinutes: number | null;
    content: string;
    attachmentPath: string | null;
    attachmentName: string;
    attachmentUrl: string;
    status: 'draft' | 'published' | 'archived';
    resultsCount: number;
    createdAt: string;
}

interface ExamPageProps {
    exams: ExamItem[];
    classes: ExamClassOption[];
    summary: {
        examCount: number;
        draftCount: number;
        publishedCount: number;
        archivedCount: number;
    };
}

interface ExamFormData {
    school_class_id: number | null;
    title: string;
    subject: string;
    academic_year: string;
    exam_date: string;
    duration_minutes: number | null;
    content: string;
    attachment: File | null;
    status: 'draft' | 'published' | 'archived';
    _method?: 'put';
}

type View = 'list' | 'build' | 'print';
type OrderKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status-asc';

const DEFAULT_CONTENT = `
<h1 style="text-align:center">ENGLISH EXAMINATION</h1>
<p style="text-align:center"><strong>Frania English School</strong></p>
<hr>
<p><strong>Student Name:</strong> ____________________________ <strong>Score:</strong> ____ / 100</p>
<h2>Part I: Multiple Choice</h2>
<p>1. Choose the best answer.</p>
<p>A. Option one &nbsp;&nbsp; B. Option two &nbsp;&nbsp; C. Option three</p>
<h2>Part II: Writing</h2>
<p>Write five sentences about your daily routine.</p>
`;

const emptyForm = (classes: ExamClassOption[]): ExamFormData => ({
    school_class_id: classes[0]?.id ?? null,
    title: 'New Exam',
    subject: '',
    academic_year: new Date().getFullYear().toString(),
    exam_date: '',
    duration_minutes: 60,
    content: DEFAULT_CONTENT,
    attachment: null,
    status: 'draft',
});

const statusType = {
    draft: 'amber',
    published: 'green',
    archived: 'gray',
} as const;

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Date new-old' },
    { value: 'date-asc', label: 'Date old-new' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
    { value: 'status-asc', label: 'Status A-Z' },
];

const listPageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const listPanelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const builderInputClass = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

function isPdfFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
}

function pdfPreviewSource(url: string): string {
    if (!url) {
        return '';
    }

    const [baseUrl] = url.split('#');

    return `${baseUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function printHtmlContent(title: string, content: string): void {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');

    if (!printWindow) {
        toast.error('Please allow popups to print this exam.');
        return;
    }

    printWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <title>${escapeHtml(title)}</title>
                <style>
                    @page { margin: 15mm; size: A4; }
                    body { margin: 0; background: white; font-family: Georgia, 'Times New Roman', serif; color: #111; }
                    .print-paper { max-width: 794px; margin: 0 auto; padding: 52px 64px; }
                    h1 { font-size: 22px; font-weight: 900; text-align: center; margin: 0 0 6px; }
                    h2 { font-size: 16px; font-weight: 800; margin: 18px 0 4px; border-bottom: 1px solid #555; padding-bottom: 3px; }
                    p { margin: 4px 0; font-size: 13px; line-height: 1.7; }
                    img { max-width: 100%; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="print-paper">${content || DEFAULT_CONTENT}</div>
                <script>
                    window.addEventListener('load', () => {
                        window.focus();
                        window.print();
                    });
                    window.addEventListener('afterprint', () => window.close());
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function printPdfFile(url: string): void {
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = pdfPreviewSource(url);

    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 300);
    };

    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 60000);
}

function sortExams(exams: ExamItem[], orderBy: OrderKey): ExamItem[] {
    return [...exams].sort((a, b) => {
        if (orderBy === 'date-asc') {
            return (a.examDate || a.createdAt).localeCompare(b.examDate || b.createdAt);
        }

        if (orderBy === 'title-asc') {
            return a.title.localeCompare(b.title);
        }

        if (orderBy === 'title-desc') {
            return b.title.localeCompare(a.title);
        }

        if (orderBy === 'status-asc') {
            return a.status.localeCompare(b.status);
        }

        return (b.examDate || b.createdAt).localeCompare(a.examDate || a.createdAt);
    });
}

export default function ExamPage({ exams, classes, summary }: ExamPageProps) {
    const { can, canAny } = useAdminPermissions();
    const canCreate = can('exam.create');
    const canUpdate = can('exam.update');
    const canDelete = can('exam.delete');
    const canManageExams = canAny(['exam.update', 'exam.delete']);
    const [view, setView] = useState<View>('list');
    const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
    const [printingExam, setPrintingExam] = useState<ExamItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ExamItem | null>(null);
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);

    const { data, setData, post, processing, errors, reset, transform } = useForm<ExamFormData>(emptyForm(classes));

    useEffect(() => { setPage(1); }, [search, orderBy, perPage]);

    const filteredExams = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = exams.filter(exam =>
            !q ||
            exam.title.toLowerCase().includes(q) ||
            exam.subject.toLowerCase().includes(q) ||
            exam.className.toLowerCase().includes(q) ||
            exam.status.toLowerCase().includes(q) ||
            exam.academicYear.toLowerCase().includes(q) ||
            exam.attachmentName.toLowerCase().includes(q) ||
            exam.examDate.includes(search)
        );

        return sortExams(filtered, orderBy);
    }, [exams, search, orderBy]);

    const paginatedExams = useMemo(
        () => filteredExams.slice((page - 1) * perPage, page * perPage),
        [filteredExams, page, perPage],
    );

    const openCreate = () => {
        if (!canCreate) {
            return;
        }

        reset();
        setData(emptyForm(classes));
        setEditingExam(null);
        setView('build');
    };

    const openEdit = (exam: ExamItem) => {
        if (!canUpdate) {
            return;
        }

        setData({
            school_class_id: exam.schoolClassId,
            title: exam.title,
            subject: exam.subject,
            academic_year: exam.academicYear,
            exam_date: exam.examDate,
            duration_minutes: exam.durationMinutes,
            content: exam.content || DEFAULT_CONTENT,
            attachment: null,
            status: exam.status,
        });
        setEditingExam(exam);
        setView('build');
    };

    const submitExam = (payload: ExamFormData) => {
        if (editingExam && !canUpdate) {
            setView('list');
            return;
        }

        if (!editingExam && !canCreate) {
            setView('list');
            return;
        }

        setData(payload);

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(editingExam ? 'Exam updated.' : 'Exam created.');
                setView('list');
                setEditingExam(null);
            },
        };

        if (editingExam) {
            transform(() => ({ ...payload, _method: 'put' as const }));
            post(update.url((editingExam.routeKey ?? editingExam.id) as never), options);
            return;
        }

        transform(() => payload);
        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        if (!canDelete) {
            setDeleteTarget(null);
            return;
        }

        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Exam deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const printExam = (exam: ExamItem) => {
        setPrintingExam(exam);
        setView('print');
    };

    const examActions = (exam: ExamItem): RowAction[] => [
        { key: 'print', label: 'Print', icon: Printer, onSelect: () => printExam(exam) },
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEdit(exam), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(exam), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
    ];

    if (view === 'build') {
        return (
            <ExamBuilder
                classes={classes}
                data={data}
                editingExam={editingExam}
                errors={errors}
                processing={processing}
                onBack={() => setView('list')}
                onSave={submitExam}
            />
        );
    }

    if (view === 'print' && printingExam) {
        return <PrintView exam={printingExam} onBack={() => setView('list')} />;
    }

    return (
        <AdminShell>
            <div className={listPageClass}>
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="min-w-0">
                        <span className="block text-xs font-black text-slate-400">Exam management</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{summary.examCount} exams</strong>
                        <p className="mt-1 truncate text-xs font-extrabold text-slate-400">{summary.publishedCount} published - {summary.draftCount} drafts</p>
                    </div>
                    {canCreate && (
                        <button onClick={openCreate} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Create exam">
                            <Plus size={18} />
                        </button>
                    )}
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Exams', value: summary.examCount, className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Drafts', value: summary.draftCount, className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
                        { label: 'Published', value: summary.publishedCount, className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                        { label: 'Archived', value: summary.archivedCount, className: 'border-slate-400/25 bg-slate-400/10 text-slate-500 dark:text-slate-300' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-[18px] border p-3 ${card.className}`}>
                            <div className="text-2xl font-black leading-none">{card.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{card.label}</div>
                        </div>
                    ))}
                </div>

                <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                    <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:static md:mb-0 md:grid-cols-[auto_1fr_320px] md:items-center md:gap-3 md:border-x-0 md:border-t-0 md:shadow-none">
                        <div className="contents md:flex md:items-center md:gap-2">
                            <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 md:inline">Sort by</span>
                            <Select value={orderBy} onValueChange={value => setOrderBy(value as OrderKey)}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[170px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={perPage.toString()} onValueChange={value => { setPerPage(Number(value)); setPage(1); }}>
                                <SelectTrigger className={`${controlInputClass} min-w-0 md:w-[130px]`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 25, 50].map(size => (
                                        <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">
                                {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className={`${controlInputClass} col-span-2 w-full md:col-start-3 md:w-full`}
                            placeholder="Search exams..."
                        />
                    </div>

                    <table className={desktopTableClass}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Attachment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExams.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {search ? <>No exams found for <strong>"{search}"</strong></> : 'No exams found'}
                                    </td>
                                </tr>
                            ) : paginatedExams.map(exam => (
                                <tr key={exam.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                                <FileText size={17} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="max-w-[220px] truncate text-xs font-black text-slate-900 dark:text-slate-50">{exam.title}</div>
                                                <div className="text-[11px] font-bold text-slate-400">Created {exam.createdAt || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{exam.subject || '-'}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{exam.className || 'All classes'}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{exam.examDate || '-'}</td>
                                    <td className="text-xs font-bold text-slate-500 dark:text-slate-300">{exam.durationMinutes ? `${exam.durationMinutes} min` : '-'}</td>
                                    <td>
                                        {exam.attachmentUrl ? (
                                            <a href={exam.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 no-underline dark:text-blue-300">
                                                <Paperclip size={13} />
                                                Exam file
                                            </a>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td><Badge type={statusType[exam.status]}>{exam.status}</Badge></td>
                                    <td>
                                        <RowActions ariaLabel={`Actions for ${exam.title}`} actions={examActions(exam)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid gap-3 md:hidden">
                        {paginatedExams.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-9 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-950"><FileText size={30} /></div>
                                {search ? <>No exams found for <strong>"{search}"</strong></> : 'No exams found'}
                            </div>
                        ) : paginatedExams.map(exam => (
                            <article key={exam.id} className={mobileCardClass}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-2.5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                            <FileText size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-900 dark:text-slate-50">{exam.title}</h3>
                                            <p className="mt-1 text-[11px] font-bold text-slate-400">{exam.subject || 'No subject'} - {exam.className || 'All classes'}</p>
                                        </div>
                                    </div>
                                    <RowActions ariaLabel={`Actions for ${exam.title}`} actions={examActions(exam)} />
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Date</span>
                                        <strong className="mt-1 block truncate text-xs font-black text-slate-900 dark:text-slate-50">{exam.examDate || '-'}</strong>
                                    </div>
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Duration</span>
                                        <strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{exam.durationMinutes ? `${exam.durationMinutes}m` : '-'}</strong>
                                    </div>
                                    <div className="rounded-2xl bg-slate-100 px-2 py-2 dark:bg-slate-950">
                                        <span className="block text-[9px] font-black uppercase text-slate-400">Results</span>
                                        <strong className="mt-1 block text-xs font-black text-slate-900 dark:text-slate-50">{exam.resultsCount}</strong>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                                    <Badge type={statusType[exam.status]}>{exam.status}</Badge>
                                    {exam.attachmentUrl ? (
                                        <a href={exam.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-300">
                                            <Paperclip size={13} /> File
                                        </a>
                                    ) : <span className="text-xs font-black text-slate-400">No file</span>}
                                </div>
                            </article>
                        ))}
                    </div>

                    {filteredExams.length > 0 && (
                        <Pagination
                            total={filteredExams.length}
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                            showPerPage={false}
                        />
                    )}
                </section>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete Exam?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">"{deleteTarget.title}" will be removed.</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setDeleteTarget(null)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"><X size={15} /> Cancel</button>
                            <button onClick={confirmDelete} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white transition hover:bg-red-600"><Trash2 size={15} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function ExamBuilder({
    classes,
    data,
    editingExam,
    errors,
    processing,
    onBack,
    onSave,
}: {
    classes: ExamClassOption[];
    data: ExamFormData;
    editingExam: ExamItem | null;
    errors: Partial<Record<keyof ExamFormData, string>>;
    processing: boolean;
    onBack: () => void;
    onSave: (data: ExamFormData) => void;
}) {
    const [meta, setMeta] = useState<ExamFormData>(data);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const hasFileAttachment = Boolean(meta.attachment || editingExam?.attachmentUrl);
    const [wordPreviewHtml, setWordPreviewHtml] = useState('');
    const [wordPreviewStatus, setWordPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'unsupported' | 'error'>('idle');
    const attachmentName = meta.attachment?.name || editingExam?.attachmentName || '';

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Color.configure({ types: [TextStyle.name] }),
            TextStyle,
            Highlight.configure({ multicolor: true }),
            TipImage.configure({ inline: true, allowBase64: true }),
        ],
        content: data.content || DEFAULT_CONTENT,
        editorProps: {
            attributes: {
                style: 'min-height:820px;outline:none;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#111;',
            },
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (hasFileAttachment && wordPreviewStatus === 'loading') {
            toast.error('Please wait until the exam file preview finishes loading.');
            return;
        }

        onSave({ ...meta, content: hasFileAttachment ? wordPreviewHtml : editor?.getHTML() ?? '' });
    };

    const insertImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    if (!editor) {
        return null;
    }

    return (
        <form onSubmit={submit} className="min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <style>{`
                .exam-paper {
                    background: white;
                    width: min(100%, 794px);
                    max-width: 794px;
                    margin: 0 auto;
                    padding: 56px 68px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.28);
                    min-height: 1122px;
                    box-sizing: border-box;
                }
                .exam-paper h1{font-size:22px;font-weight:900;margin:0 0 8px}
                .exam-paper h2{font-size:17px;font-weight:800;margin:20px 0 6px}
                .exam-paper h3{font-size:15px;font-weight:700;margin:16px 0 4px}
                .exam-paper p{margin:4px 0}
                .exam-paper hr{border:none;border-top:2px solid #111;margin:12px 0}
                .exam-paper ul,.exam-paper ol{padding-left:24px;margin:6px 0}
                .exam-paper img{max-width:100%;border:1px solid #ddd;border-radius:4px;margin:4px 0}
                .docx-preview-paper{width:max-content;min-width:100%;margin:0 auto;display:flex;justify-content:center}
                .docx-preview-paper .docx-wrapper{background:transparent!important;padding:0!important;width:max-content!important;min-width:100%!important}
                .docx-preview-paper .docx{box-shadow:0 2px 16px rgba(0,0,0,0.28);margin:0 auto 24px!important;max-width:none!important}
                .docx-preview-paper .docx:last-child{margin-bottom:0!important}
                .toolbar-btn{background:white;border:1px solid #e2e8f0;border-radius:7px;padding:6px 9px;cursor:pointer;font-size:13px;font-weight:700;color:#374151}
                .toolbar-btn.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
                @media (max-width: 767px) {
                    .exam-paper {
                        width: 100%;
                        min-height: 720px;
                        padding: 32px 24px;
                        box-shadow: 0 14px 32px rgba(15,23,42,.12);
                    }
                    .exam-paper h1{font-size:18px;line-height:1.35}
                    .exam-paper h2{font-size:15px}
                    .docx-preview-paper,
                    .docx-preview-paper .docx-wrapper {
                        width: 100%!important;
                        min-width: 0!important;
                    }
                }
            `}</style>

            <div className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2 shadow-lg md:flex md:flex-wrap md:px-4">
                <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15">
                    <ArrowLeft size={15} />
                    Back
                </button>
                <input value={meta.title} onChange={event => setMeta(current => ({ ...current, title: event.target.value }))} className="min-h-10 min-w-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/50 focus:border-blue-300 md:flex-1" />
                <button disabled={processing || (hasFileAttachment && wordPreviewStatus === 'loading')} type="submit" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-600 disabled:cursor-default disabled:bg-blue-300">
                    <Save size={15} />
                    {processing ? 'Saving' : hasFileAttachment && wordPreviewStatus === 'loading' ? 'Reading file' : 'Save'}
                </button>
            </div>

            <div className="grid min-h-[calc(100dvh-58px)] grid-cols-1 md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
                <aside className="grid content-start gap-4 overflow-y-auto border-b border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 md:border-b-0 md:border-r md:p-4">
                    <Field label="Subject" error={errors.subject}>
                        <input value={meta.subject} onChange={event => setMeta(current => ({ ...current, subject: event.target.value }))} className={builderInputClass} />
                    </Field>
                    <Field label="Class" error={errors.school_class_id}>
                        <Select value={meta.school_class_id ? String(meta.school_class_id) : 'all'} onValueChange={value => setMeta(current => ({ ...current, school_class_id: value === 'all' ? null : Number(value) }))}>
                            <SelectTrigger className={builderInputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All classes</SelectItem>
                                {classes.map(schoolClass => <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>{schoolClass.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Exam Date" error={errors.exam_date}>
                        <DatePicker value={meta.exam_date} onChange={value => setMeta(current => ({ ...current, exam_date: value }))} placeholder="Pick exam date" className={builderInputClass} />
                    </Field>
                    <Field label="Duration" error={errors.duration_minutes}>
                        <input type="number" min={1} max={1000} value={meta.duration_minutes ?? ''} onChange={event => setMeta(current => ({ ...current, duration_minutes: Number(event.target.value) || null }))} className={builderInputClass} />
                    </Field>
                    <Field label="Academic Year" error={errors.academic_year}>
                        <input value={meta.academic_year} onChange={event => setMeta(current => ({ ...current, academic_year: event.target.value }))} className={builderInputClass} />
                    </Field>
                    <Field label="Status" error={errors.status}>
                        <Select value={meta.status} onValueChange={value => setMeta(current => ({ ...current, status: value as ExamFormData['status'] }))}>
                            <SelectTrigger className={builderInputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Exam File" error={errors.attachment}>
                        <input
                            ref={attachmentInputRef}
                            type="file"
                            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                            style={{ display: 'none' }}
                            onChange={event => {
                                const file = event.target.files?.[0] ?? null;
                                setMeta(current => ({ ...current, attachment: file }));
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => attachmentInputRef.current?.click()}
                            className={`${builderInputClass} flex items-center justify-between gap-2 text-left`}
                        >
                            <span className="min-w-0 truncate">
                                {meta.attachment?.name || editingExam?.attachmentName || 'Upload .doc, .docx, or .pdf file'}
                            </span>
                            <Upload size={16} className="shrink-0 text-slate-500" />
                        </button>
                        {editingExam?.attachmentUrl && !meta.attachment && (
                            <a href={editingExam.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-300">
                                <Paperclip size={13} /> Open current exam file
                            </a>
                        )}
                        <div className="mt-1 text-[11px] font-bold leading-4 text-slate-400">Use PDF for exact Word shapes/icons. Accepted: .doc, .docx, .pdf up to 10 MB.</div>
                    </Field>
                    {errors.title && <div className="text-xs font-bold text-red-500">{errors.title}</div>}
                    {errors.content && <div className="text-xs font-bold text-red-500">{errors.content}</div>}
                </aside>

                <main className="min-w-0 bg-slate-200 dark:bg-slate-950">
                    {!hasFileAttachment && (
                        <div className="sticky top-[58px] z-30 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 md:top-[57px]">
                            <button type="button" className={`toolbar-btn${editor.isActive('bold') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
                            <button type="button" className={`toolbar-btn${editor.isActive('italic') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
                            <button type="button" className={`toolbar-btn${editor.isActive('underline') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
                            <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>List</button>
                            <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
                            <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>Rule</button>
                            <input type="color" defaultValue="#111111" onChange={event => editor.chain().focus().setColor(event.target.value).run()} title="Text color" style={{ width: 34, height: 34, padding: 2, border: '1px solid #e2e8f0', borderRadius: 7 }} />
                            <button type="button" className="toolbar-btn" onClick={() => imageInputRef.current?.click()}>Image</button>
                            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={insertImage} />
                        </div>
                    )}
                    <div className="overflow-x-auto px-3 py-4 pb-24 md:px-4 md:py-8">
                        {hasFileAttachment ? (
                            <ExamFilePreview
                                file={meta.attachment}
                                fileName={attachmentName || 'Attached Word file'}
                                fileUrl={!meta.attachment ? editingExam?.attachmentUrl : undefined}
                                onRenderedHtmlChange={setWordPreviewHtml}
                                onStatusChange={setWordPreviewStatus}
                            />
                        ) : (
                            <div className="exam-paper">
                                <EditorContent editor={editor} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </form>
    );
}

function ExamFilePreview({
    file,
    fileName,
    fileUrl,
    onRenderedHtmlChange,
    onStatusChange,
}: {
    file: File | null;
    fileName: string;
    fileUrl?: string;
    onRenderedHtmlChange: (html: string) => void;
    onStatusChange: (status: 'idle' | 'loading' | 'ready' | 'unsupported' | 'error') => void;
}) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported' | 'error'>('loading');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

    useEffect(() => {
        if (!isPdfFile(fileName)) {
            setPdfPreviewUrl('');
            return;
        }

        onRenderedHtmlChange('');
        onStatusChange('ready');
        setStatus('ready');

        if (!file) {
            setPdfPreviewUrl(fileUrl ?? '');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPdfPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file, fileName, fileUrl, onRenderedHtmlChange, onStatusChange]);

    useEffect(() => {
        let ignore = false;

        const renderWordFile = async () => {
            if (isPdfFile(fileName)) {
                return;
            }

            onRenderedHtmlChange('');
            onStatusChange('loading');

            if (fileName.toLowerCase().endsWith('.doc')) {
                setStatus('unsupported');
                onStatusChange('unsupported');
                return;
            }

            const bodyContainer = bodyRef.current;
            const styleContainer = styleRef.current;

            if (!bodyContainer || !styleContainer) {
                return;
            }

            bodyContainer.innerHTML = '';
            styleContainer.innerHTML = '';
            setStatus('loading');
            onStatusChange('loading');

            try {
                const source = file ?? await fetch(fileUrl ?? '').then(response => {
                    if (!response.ok) {
                        throw new Error('Unable to load Word file.');
                    }

                    return response.arrayBuffer();
                });

                const { renderAsync } = await import('docx-preview');

                await renderAsync(source, bodyContainer, styleContainer, {
                    className: 'docx',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: false,
                    experimental: true,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                    useBase64URL: true,
                });

                if (!ignore) {
                    onRenderedHtmlChange(`${styleContainer.innerHTML}${bodyContainer.innerHTML}`);
                    setStatus('ready');
                    onStatusChange('ready');
                }
            } catch {
                if (!ignore) {
                    setStatus('error');
                    onStatusChange('error');
                    onRenderedHtmlChange('');
                }
            }
        };

        void renderWordFile();

        return () => {
            ignore = true;
        };
    }, [file, fileName, fileUrl, onRenderedHtmlChange, onStatusChange]);

    if (isPdfFile(fileName)) {
        return (
            <div className="docx-preview-paper">
                <iframe
                    src={pdfPreviewSource(pdfPreviewUrl)}
                    title={fileName}
                    style={{
                        width: 'min(100vw - 380px, 980px)',
                        minWidth: 760,
                        height: 'calc(100vh - 150px)',
                        minHeight: 720,
                        border: 'none',
                        background: 'white',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.28)',
                    }}
                />
            </div>
        );
    }

    const message = status === 'unsupported'
        ? 'Original layout preview is available for .docx files. This Word file can still be opened directly.'
        : status === 'error'
            ? 'Unable to preview this Word file. You can open the original file directly.'
            : 'Loading Word file layout...';

    return (
        <div className="docx-preview-paper">
            <div ref={styleRef} />
            {status !== 'ready' && (
                <div className="exam-paper" style={{ minHeight: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ maxWidth: 430, width: '100%', textAlign: 'center', border: '1.5px dashed #cbd5e1', borderRadius: 16, padding: 28, background: '#f8fafc' }}>
                        <div style={{ width: 58, height: 58, borderRadius: 16, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <FileText size={30} />
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: '#1e293b', marginBottom: 6 }}>
                            {status === 'loading' ? 'Reading Word exam file' : 'Word exam file'}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
                            {message}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%', borderRadius: 10, padding: '9px 12px', background: 'white', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 800, fontSize: 13 }}>
                            <Paperclip size={15} color="#2563eb" />
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fileName}
                            </span>
                        </div>
                        {fileUrl && status !== 'loading' && (
                            <div style={{ marginTop: 14 }}>
                                <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                                    Open current file
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div ref={bodyRef} style={{ display: status === 'ready' ? 'block' : 'none', width: 'max-content', minWidth: '100%' }} />
        </div>
    );
}

function PrintView({ exam, onBack }: { exam: ExamItem; onBack: () => void }) {
    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #print-root, #print-root * { visibility: visible !important; }
                    #print-root { position: fixed; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                }
                #print-root h1{font-size:22px;font-weight:900;text-align:center;margin:0 0 6px}
                #print-root h2{font-size:16px;font-weight:800;margin:18px 0 4px;border-bottom:1px solid #555;padding-bottom:3px}
                #print-root p{margin:4px 0;font-size:13px;line-height:1.7}
                #print-root img{max-width:100%;page-break-inside:avoid}
            `}</style>
            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={onBack} style={topButton('rgba(255,255,255,0.12)')}><ArrowLeft size={15} />Back</button>
                <div style={{ flex: 1, color: 'white', fontWeight: 800, fontSize: 15 }}>{exam.title}</div>
                <button onClick={() => window.print()} style={topButton('#2563eb')}><Printer size={15} />Print</button>
            </div>
            <div style={{ paddingTop: 68, background: '#cbd5e1', minHeight: '100vh', paddingBottom: 60 }}>
                <div id="print-root" style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: '52px 64px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: "Georgia,'Times New Roman',serif" }} dangerouslySetInnerHTML={{ __html: exam.content || DEFAULT_CONTENT }} />
            </div>
        </>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{label}</span>
            {children}
            {error && <span className="field-error">{error}</span>}
        </label>
    );
}

function topButton(background: string): React.CSSProperties {
    return {
        background,
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '8px 13px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
    };
}

const fieldStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 40,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};
