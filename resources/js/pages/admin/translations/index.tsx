import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Backends/TranslationController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Edit3,
    FileCode2,
    Languages,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface TranslationGroup {
    value: string;
    label: string;
    count: number;
}

interface TranslationEntry {
    group: string;
    key: string;
    en: string;
    kh: string;
}

interface TranslationPageProps {
    groups: TranslationGroup[];
    entries: TranslationEntry[];
    summary: {
        total: number;
        complete: number;
        missingEn: number;
        missingKh: number;
    };
}

interface TranslationFormData {
    group: string;
    key: string;
    en: string;
    kh: string;
}

const inputClass =
    'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export default function TranslationIndex({
    groups,
    entries,
    summary,
}: TranslationPageProps) {
    const { t } = useAdminTranslation();
    const { props } = usePage<SharedData>();
    const permissions = props.auth.permissions ?? [];
    const canCreate = permissions.includes('translations.create');
    const canUpdate = permissions.includes('translations.update');
    const canDelete = permissions.includes('translations.delete');
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [editing, setEditing] = useState<TranslationEntry | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<TranslationEntry | null>(
        null,
    );
    const form = useForm<TranslationFormData>({
        group: groups[0]?.value ?? 'admin',
        key: '',
        en: '',
        kh: '',
    });

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return entries.filter(
            (entry) =>
                (group === 'all' || entry.group === group) &&
                (!query ||
                    entry.key.toLowerCase().includes(query) ||
                    entry.en.toLowerCase().includes(query) ||
                    entry.kh.toLowerCase().includes(query)),
        );
    }, [entries, group, search]);

    useEffect(() => setPage(1), [group, search, perPage]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const openCreate = () => {
        setEditing(null);
        form.setData({
            group: group !== 'all' ? group : (groups[0]?.value ?? 'admin'),
            key: '',
            en: '',
            kh: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (entry: TranslationEntry) => {
        setEditing(entry);
        form.setData(entry);
        form.clearErrors();
        setDialogOpen(true);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    editing ? 'Translation updated.' : 'Translation created.',
                );
                setDialogOpen(false);
                form.reset('key', 'en', 'kh');
            },
            onError: () => toast.error('Please check the translation fields.'),
        };

        if (editing) {
            form.put(
                update.url({ group: editing.group, key: editing.key }),
                options,
            );
            return;
        }

        form.post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(
            destroy.url({
                group: deleteTarget.group,
                key: deleteTarget.key,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Translation deleted.');
                    setDeleteTarget(null);
                },
                onError: () => toast.error('Unable to delete translation.'),
            },
        );
    };

    return (
        <AdminShell>
            <Head title={t('translations_page.title')} />
            <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-4 bg-slate-50 p-4 fade-in md:p-6 dark:bg-slate-950">
                <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                            <Languages size={21} />
                        </span>
                        <div>
                            <h1 className="text-xl font-black text-slate-950 dark:text-white">
                                {t('translations_page.title')}
                            </h1>
                            <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {t('translations_page.description')}
                            </p>
                        </div>
                    </div>
                    {canCreate && (
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="min-h-11 gap-2 rounded-xl bg-blue-600 px-4 font-black text-white hover:bg-blue-500"
                        >
                            <Plus size={17} /> {t('translations_page.add')}
                        </Button>
                    )}
                </section>

                <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <Metric
                        label="Total"
                        value={summary.total}
                        tone="blue"
                        icon={<FileCode2 size={17} />}
                    />
                    <Metric
                        label={t('translations_page.complete')}
                        value={summary.complete}
                        tone="green"
                        icon={<CheckCircle2 size={17} />}
                    />
                    <Metric
                        label={t('translations_page.missing_english')}
                        value={summary.missingEn}
                        tone="amber"
                        icon={<TriangleAlert size={17} />}
                    />
                    <Metric
                        label={t('translations_page.missing_khmer')}
                        value={summary.missingKh}
                        tone="violet"
                        icon={<TriangleAlert size={17} />}
                    />
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center dark:border-slate-700">
                        <select
                            value={group}
                            onChange={(event) => setGroup(event.target.value)}
                            className={`${inputClass} md:w-52`}
                        >
                            <option value="all">
                                {t('translations_page.all_groups')}
                            </option>
                            {groups.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label} ({item.count})
                                </option>
                            ))}
                        </select>
                        <div className="relative min-w-0 flex-1 md:ml-auto md:max-w-md">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className={`${inputClass} pl-10`}
                                placeholder={t('translations_page.search')}
                            />
                        </div>
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th>{t('translations_page.group')}</th>
                                    <th>{t('translations_page.key')}</th>
                                    <th>{t('translations_page.english')}</th>
                                    <th>{t('translations_page.khmer')}</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((entry) => (
                                    <tr key={`${entry.group}:${entry.key}`}>
                                        <td>
                                            <Badge type="blue">
                                                {entry.group}.php
                                            </Badge>
                                        </td>
                                        <td className="max-w-64 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                                            {entry.key}
                                        </td>
                                        <td className="max-w-80 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                            <p className="line-clamp-3">
                                                {entry.en || '-'}
                                            </p>
                                        </td>
                                        <td className="max-w-80 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                            <p className="line-clamp-3">
                                                {entry.kh || '-'}
                                            </p>
                                        </td>
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${entry.key}`}
                                                actions={[
                                                    ...(canUpdate
                                                        ? [
                                                              {
                                                                  key: 'edit',
                                                                  label: 'Edit',
                                                                  icon: Edit3,
                                                                  onSelect:
                                                                      () =>
                                                                          openEdit(
                                                                              entry,
                                                                          ),
                                                              },
                                                          ]
                                                        : []),
                                                    ...(canDelete
                                                        ? [
                                                              {
                                                                  key: 'delete',
                                                                  label: 'Delete',
                                                                  icon: Trash2,
                                                                  onSelect:
                                                                      () =>
                                                                          setDeleteTarget(
                                                                              entry,
                                                                          ),
                                                                  variant:
                                                                      'destructive' as const,
                                                                  separatorBefore:
                                                                      canUpdate,
                                                              },
                                                          ]
                                                        : []),
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 p-3 md:hidden">
                        {paginated.map((entry) => (
                            <article
                                key={`${entry.group}:${entry.key}`}
                                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Badge type="blue">
                                            {entry.group}.php
                                        </Badge>
                                        <p className="mt-2 font-mono text-xs font-black break-all text-slate-800 dark:text-slate-100">
                                            {entry.key}
                                        </p>
                                    </div>
                                    <RowActions
                                        ariaLabel={`Actions for ${entry.key}`}
                                        actions={[
                                            ...(canUpdate
                                                ? [
                                                      {
                                                          key: 'edit',
                                                          label: 'Edit',
                                                          icon: Edit3,
                                                          onSelect: () =>
                                                              openEdit(entry),
                                                      },
                                                  ]
                                                : []),
                                            ...(canDelete
                                                ? [
                                                      {
                                                          key: 'delete',
                                                          label: 'Delete',
                                                          icon: Trash2,
                                                          onSelect: () =>
                                                              setDeleteTarget(
                                                                  entry,
                                                              ),
                                                          variant:
                                                              'destructive' as const,
                                                          separatorBefore:
                                                              canUpdate,
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                    />
                                </div>
                                <TranslationValue label="EN" value={entry.en} />
                                <TranslationValue label="KH" value={entry.kh} />
                            </article>
                        ))}
                    </div>

                    {paginated.length === 0 && (
                        <div className="px-6 py-14 text-center text-sm font-bold text-slate-400">
                            {t('translations_page.empty')}
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <Pagination
                            total={filtered.length}
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                        />
                    )}
                </section>
            </main>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-[min(560px,calc(100vw-24px))] max-w-[560px] gap-0 overflow-hidden rounded-2xl p-0">
                    <form onSubmit={submit}>
                        <DialogHeader className="border-b border-slate-200 p-5 text-left dark:border-slate-700">
                            <DialogTitle>
                                {editing
                                    ? t('translations_page.edit')
                                    : t('translations_page.add')}
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? `${editing.group}.php · ${editing.key}`
                                    : t('translations_page.description')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 p-5">
                            <Field
                                label={t('translations_page.group')}
                                error={form.errors.group}
                            >
                                <select
                                    disabled={editing !== null}
                                    value={form.data.group}
                                    onChange={(event) =>
                                        form.setData(
                                            'group',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                >
                                    {groups.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}.php
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label={t('translations_page.key')}
                                error={form.errors.key}
                            >
                                <input
                                    disabled={editing !== null}
                                    value={form.data.key}
                                    onChange={(event) =>
                                        form.setData('key', event.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="section.label"
                                />
                            </Field>
                            <Field
                                label={t('translations_page.english')}
                                error={form.errors.en}
                            >
                                <textarea
                                    value={form.data.en}
                                    onChange={(event) =>
                                        form.setData('en', event.target.value)
                                    }
                                    className={`${inputClass} min-h-24 resize-y`}
                                />
                            </Field>
                            <Field
                                label={t('translations_page.khmer')}
                                error={form.errors.kh}
                            >
                                <textarea
                                    value={form.data.kh}
                                    onChange={(event) =>
                                        form.setData('kh', event.target.value)
                                    }
                                    className={`${inputClass} min-h-24 resize-y font-['Noto_Sans_Khmer']`}
                                />
                            </Field>
                        </div>
                        <DialogFooter className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDialogOpen(false)}
                                className="min-h-11 rounded-xl font-black"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={form.processing}
                                type="submit"
                                className="min-h-11 rounded-xl bg-blue-600 font-black text-white hover:bg-blue-500"
                            >
                                {t('translations_page.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="w-[min(420px,calc(100vw-24px))] max-w-[420px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('translations_page.delete')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('translations_page.delete_description')}{' '}
                            <strong>
                                {deleteTarget?.group}.{deleteTarget?.key}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmDelete}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminShell>
    );
}

function Metric({
    label,
    value,
    tone,
    icon,
}: {
    label: string;
    value: number;
    tone: 'blue' | 'green' | 'amber' | 'violet';
    icon: ReactNode;
}) {
    const tones = {
        blue: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
        green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
        amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
        violet: 'border-violet-500/20 bg-violet-500/10 text-violet-600',
    };

    return (
        <div className={`rounded-xl border p-4 ${tones[tone]}`}>
            <div className="flex items-center justify-between gap-2">
                {icon}
                <strong className="text-2xl font-black">{value}</strong>
            </div>
            <p className="mt-2 text-xs font-black opacity-75">{label}</p>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-black text-slate-500 uppercase">
                {label}
            </span>
            {children}
            {error && (
                <span className="mt-1.5 block text-xs font-bold text-red-500">
                    {error}
                </span>
            )}
        </label>
    );
}

function TranslationValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="text-[10px] font-black text-slate-400">
                {label}
            </span>
            <p className="mt-1 text-sm leading-6 font-semibold text-slate-700 dark:text-slate-200">
                {value || '-'}
            </p>
        </div>
    );
}
