import {
    destroy,
    destroyCategory,
    store,
    storeCategory,
    update,
    updateCategory,
} from '@/actions/App/Http/Controllers/Backends/ExpenseController';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, FolderOpen, Plus, Receipt, Tag, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface ExpenseItem {
    id: number;
    routeKey?: string;
    title: string;
    amount: number;
    expenseDate: string;
    description: string;
    receipt: string | null;
    categoryId: number | null;
    categoryName: string;
    categoryNameKh: string;
    categoryColor: string;
}

export interface CategoryItem {
    id: number;
    routeKey?: string;
    name: string;
    nameKh: string;
    color: string;
    expensesCount: number;
    totalAmount: number;
}

interface ExpensePageProps {
    expenses: ExpenseItem[];
    categories: CategoryItem[];
    summary: {
        totalAmount: number;
        totalCount: number;
        thisMonthAmount: number;
        categoryCount: number;
    };
}

type Tab = 'expenses' | 'categories';
type OrderKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc';

const ORDER_OPTIONS: { value: OrderKey; label: string }[] = [
    { value: 'date-desc', label: 'Date Newest' },
    { value: 'date-asc', label: 'Date Oldest' },
    { value: 'amount-desc', label: 'Amount Highest' },
    { value: 'amount-asc', label: 'Amount Lowest' },
    { value: 'title-asc', label: 'Title A-Z' },
];

const PRESET_COLORS = [
    { value: '#6366f1', className: 'bg-indigo-500' },
    { value: '#3b82f6', className: 'bg-blue-500' },
    { value: '#10b981', className: 'bg-emerald-500' },
    { value: '#f59e0b', className: 'bg-amber-500' },
    { value: '#ef4444', className: 'bg-red-500' },
    { value: '#8b5cf6', className: 'bg-violet-500' },
    { value: '#ec4899', className: 'bg-pink-500' },
    { value: '#14b8a6', className: 'bg-teal-500' },
];

const pageClass = 'fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(239,68,68,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(248,113,113,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const controlInputClass = 'min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const fieldLabelClass = 'text-[11px] font-black uppercase tracking-wide text-slate-400';
const mobileCardClass = 'rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const desktopTableClass = 'hidden min-w-full border-collapse text-left md:table [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-black [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-slate-400 dark:[&_th]:border-slate-700';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

function sortExpenses(list: ExpenseItem[], order: OrderKey): ExpenseItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc': return b.expenseDate.localeCompare(a.expenseDate);
            case 'date-asc': return a.expenseDate.localeCompare(b.expenseDate);
            case 'amount-desc': return b.amount - a.amount;
            case 'amount-asc': return a.amount - b.amount;
            case 'title-asc': return a.title.localeCompare(b.title);
            default: return 0;
        }
    });
}

function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function ExpensesPage({ expenses, categories, summary }: ExpensePageProps) {
    const [tab, setTab] = useState<Tab>('expenses');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderKey>('date-desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [catFilter, setCatFilter] = useState('all');

    const [expenseModal, setExpenseModal] = useState<'create' | 'edit' | null>(null);
    const [editTarget, setEditTarget] = useState<ExpenseItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);
    const [catModal, setCatModal] = useState<'create' | 'edit' | null>(null);
    const [editCatTarget, setEditCatTarget] = useState<CategoryItem | null>(null);
    const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryItem | null>(null);

    const expForm = useForm({ category_id: '', title: '', amount: '', expense_date: today(), description: '' });
    const catForm = useForm({ name: '', name_kh: '', color: '#6366f1' });

    const catOptions = [
        { value: 'all', label: 'All Categories' },
        ...categories.map(category => ({ value: String(category.id), label: category.name })),
    ];

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        const base = expenses.filter(expense =>
            (catFilter === 'all' || String(expense.categoryId) === catFilter)
            && (!query || expense.title.toLowerCase().includes(query) || expense.categoryName.toLowerCase().includes(query) || expense.expenseDate.includes(search)),
        );
        return sortExpenses(base, orderBy);
    }, [catFilter, expenses, orderBy, search]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page, perPage],
    );

    const openCreate = () => {
        expForm.setData({ category_id: '', title: '', amount: '', expense_date: today(), description: '' });
        setEditTarget(null);
        setExpenseModal('create');
    };

    const openEdit = (item: ExpenseItem) => {
        setEditTarget(item);
        expForm.setData({ category_id: item.categoryId ? String(item.categoryId) : '', title: item.title, amount: String(item.amount), expense_date: item.expenseDate, description: item.description });
        setExpenseModal('edit');
    };

    const submitExpense = (event: FormEvent) => {
        event.preventDefault();
        const isEdit = expenseModal === 'edit' && editTarget;
        const url = isEdit ? update.url((editTarget.routeKey ?? editTarget.id) as never) : store.url();
        router[isEdit ? 'put' : 'post'](url, expForm.data as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Expense updated.' : 'Expense recorded.');
                setExpenseModal(null);
                expForm.reset();
            },
            onError: () => toast.error('Please check the form.'),
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Expense deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const openCreateCat = () => {
        catForm.setData({ name: '', name_kh: '', color: '#6366f1' });
        setEditCatTarget(null);
        setCatModal('create');
    };

    const openEditCat = (category: CategoryItem) => {
        setEditCatTarget(category);
        catForm.setData({ name: category.name, name_kh: category.nameKh, color: category.color });
        setCatModal('edit');
    };

    const submitCat = (event: FormEvent) => {
        event.preventDefault();
        const isEdit = catModal === 'edit' && editCatTarget;
        const url = isEdit ? updateCategory.url((editCatTarget.routeKey ?? editCatTarget.id) as never) : storeCategory.url();
        router[isEdit ? 'put' : 'post'](url, catForm.data as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Category updated.' : 'Category created.');
                setCatModal(null);
                catForm.reset();
            },
            onError: () => toast.error('Please check the form.'),
        });
    };

    const confirmDeleteCat = () => {
        if (!deleteCatTarget) return;
        router.delete(destroyCategory.url((deleteCatTarget.routeKey ?? deleteCatTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Category deleted.');
                setDeleteCatTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="min-w-0">
                        <span className="block text-xs font-black text-slate-400">Expense management</span>
                        <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">{fmt(summary.totalAmount)}</strong>
                        <p className="mt-1 truncate text-xs font-extrabold text-slate-400">{summary.totalCount} records - {summary.categoryCount} categories</p>
                    </div>
                    <button onClick={tab === 'expenses' ? openCreate : openCreateCat} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label={tab === 'expenses' ? 'Add expense' : 'Add category'}>
                        <Plus size={18} />
                    </button>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                        { label: 'Total Expenses', value: fmt(summary.totalAmount), className: 'border-red-500/25 bg-red-500/10 text-red-500' },
                        { label: 'This Month', value: fmt(summary.thisMonthAmount), className: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500' },
                        { label: 'Total Records', value: String(summary.totalCount), className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
                        { label: 'Categories', value: String(summary.categoryCount), className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' },
                    ].map(item => (
                        <div key={item.label} className={`rounded-[18px] border p-3 ${item.className}`}>
                            <div className="text-xl font-black leading-none">{item.value}</div>
                            <div className="mt-1 text-[11px] font-black opacity-70">{item.label}</div>
                        </div>
                    ))}
                </div>

                <div className={panelClass}>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                        {(['expenses', 'categories'] as Tab[]).map(item => (
                            <button
                                key={item}
                                onClick={() => setTab(item)}
                                className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${tab === item ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {item === 'expenses' ? `Expenses (${expenses.length})` : `Categories (${categories.length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'expenses' && (
                    <section className="overflow-visible rounded-[24px] border-0 bg-transparent shadow-none md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white md:shadow-sm dark:md:border-slate-700 dark:md:bg-slate-800/90">
                        <div className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 md:mb-0 md:flex md:flex-wrap md:items-center md:border-x-0 md:border-t-0 md:shadow-none">
                            <AdminSelect value={catFilter} onChange={value => { setCatFilter(value); setPage(1); }} options={catOptions} className="min-w-0 md:min-w-[150px]" triggerClassName={controlInputClass} />
                            <AdminSelect value={orderBy} onChange={value => { setOrderBy(value as OrderKey); setPage(1); }} options={ORDER_OPTIONS} className="min-w-0 md:min-w-[150px]" triggerClassName={controlInputClass} />
                            <span className="hidden text-[11px] font-bold text-slate-400 md:inline">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                            <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={`${controlInputClass} col-span-2 w-full md:ml-auto md:w-[260px]`} placeholder="Search expenses..." />
                        </div>

                        <table className={desktopTableClass}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-9 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                            {search ? <>No expenses found for <strong>"{search}"</strong></> : 'No expenses yet'}
                                        </td>
                                    </tr>
                                ) : paginated.map(expense => (
                                    <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                                        <td className="whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-300">{expense.expenseDate}</td>
                                        <td>
                                            <div className="text-xs font-black text-slate-900 dark:text-slate-50">{expense.title}</div>
                                            {expense.description && <div className="mt-0.5 max-w-[260px] truncate text-[11px] font-bold text-slate-400">{expense.description}</div>}
                                        </td>
                                        <td>{expense.categoryName ? <CategoryBadge name={expense.categoryName} /> : <span className="text-xs font-bold text-slate-300">-</span>}</td>
                                        <td><span className="text-xs font-black text-red-500">{fmt(expense.amount)}</span></td>
                                        <td>
                                            <RowActions
                                                ariaLabel={`Actions for ${expense.title}`}
                                                actions={[
                                                    { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEdit(expense) },
                                                    { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(expense), variant: 'destructive', separatorBefore: true },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="grid gap-3 md:hidden">
                            {paginated.length === 0 ? (
                                <EmptyState icon={<FolderOpen size={30} />} title={search ? `No expenses found for "${search}"` : 'No expenses yet'} />
                            ) : paginated.map(expense => (
                                <article key={expense.id} className={mobileCardClass}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                                                    <Receipt size={17} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{expense.title}</h3>
                                                    <p className="mt-0.5 text-[11px] font-bold text-slate-400">{expense.expenseDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <RowActions
                                            ariaLabel={`Actions for ${expense.title}`}
                                            actions={[
                                                { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEdit(expense) },
                                                { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(expense), variant: 'destructive', separatorBefore: true },
                                            ]}
                                        />
                                    </div>
                                    {expense.description && <p className="mt-3 line-clamp-2 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{expense.description}</p>}
                                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                                        {expense.categoryName ? <CategoryBadge name={expense.categoryName} /> : <span className="text-xs font-black text-slate-400">No Category</span>}
                                        <strong className="text-sm font-black text-red-500">{fmt(expense.amount)}</strong>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {filtered.length > 0 && (
                            <Pagination
                                total={filtered.length}
                                page={page}
                                perPage={perPage}
                                onPageChange={setPage}
                                onPerPageChange={value => { setPerPage(value); setPage(1); }}
                                showPerPage={false}
                            />
                        )}
                    </section>
                )}

                {tab === 'categories' && (
                    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {categories.length === 0 ? (
                            <div className="md:col-span-2 lg:col-span-3">
                                <EmptyState icon={<Tag size={32} />} title="No categories yet" subtitle="Add a category to organize your expenses" />
                            </div>
                        ) : categories.map(category => (
                            <article key={category.id} className={mobileCardClass}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <ColorIcon value={category.color} />
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{category.name}</h3>
                                            {category.nameKh && <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">{category.nameKh}</p>}
                                        </div>
                                    </div>
                                    <RowActions
                                        ariaLabel={`Actions for ${category.name}`}
                                        actions={[
                                            { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => openEditCat(category) },
                                            { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteCatTarget(category), variant: 'destructive', separatorBefore: true },
                                        ]}
                                    />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <MetricTile label="Expenses" value={`${category.expensesCount}`} />
                                    <MetricTile label="Total" value={fmt(category.totalAmount)} tone="red" />
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
                                    <div className={`h-full rounded-full ${progressWidth(category.totalAmount, summary.totalAmount)} ${colorClass(category.color)}`} />
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                {expenseModal && (
                    <Modal onClose={() => setExpenseModal(null)}>
                        <form onSubmit={submitExpense} className="grid gap-3">
                            <ModalHeader title={expenseModal === 'create' ? 'Add Expense' : 'Edit Expense'} subtitle="Fill in the expense details below" onClose={() => setExpenseModal(null)} />
                            <Field label="Category">
                                <select value={expForm.data.category_id} onChange={event => expForm.setData('category_id', event.target.value)} className={inputClass}>
                                    <option value="">No Category</option>
                                    {categories.map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
                                </select>
                                {expForm.errors.category_id && <Err>{expForm.errors.category_id}</Err>}
                            </Field>
                            <Field label="Title *">
                                <input className={inputClass} value={expForm.data.title} onChange={event => expForm.setData('title', event.target.value)} placeholder="e.g. Office Supplies" required />
                                {expForm.errors.title && <Err>{expForm.errors.title}</Err>}
                            </Field>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Amount *">
                                    <input className={inputClass} type="number" min="0.01" step="0.01" value={expForm.data.amount} onChange={event => expForm.setData('amount', event.target.value)} placeholder="0.00" required />
                                    {expForm.errors.amount && <Err>{expForm.errors.amount}</Err>}
                                </Field>
                                <Field label="Date *">
                                    <input className={inputClass} type="date" value={expForm.data.expense_date} onChange={event => expForm.setData('expense_date', event.target.value)} required />
                                    {expForm.errors.expense_date && <Err>{expForm.errors.expense_date}</Err>}
                                </Field>
                            </div>
                            <Field label="Description">
                                <textarea className={`${inputClass} min-h-24 resize-y`} value={expForm.data.description} onChange={event => expForm.setData('description', event.target.value)} placeholder="Optional notes..." />
                            </Field>
                            <FormFooter onCancel={() => setExpenseModal(null)} processing={expForm.processing} submitLabel={expenseModal === 'create' ? 'Save Expense' : 'Update Expense'} />
                        </form>
                    </Modal>
                )}

                {catModal && (
                    <Modal onClose={() => setCatModal(null)}>
                        <form onSubmit={submitCat} className="grid gap-3">
                            <ModalHeader title={catModal === 'create' ? 'Add Category' : 'Edit Category'} subtitle="Organize your expenses by category" onClose={() => setCatModal(null)} />
                            <Field label="Name (English) *">
                                <input className={inputClass} value={catForm.data.name} onChange={event => catForm.setData('name', event.target.value)} placeholder="e.g. Utilities" required />
                                {catForm.errors.name && <Err>{catForm.errors.name}</Err>}
                            </Field>
                            <Field label="Name (Khmer)">
                                <input className={inputClass} value={catForm.data.name_kh} onChange={event => catForm.setData('name_kh', event.target.value)} placeholder="Category name in Khmer" />
                            </Field>
                            <Field label="Color">
                                <div className="flex flex-wrap items-center gap-2">
                                    {PRESET_COLORS.map(color => (
                                        <button key={color.value} type="button" onClick={() => catForm.setData('color', color.value)} className={`h-8 w-8 rounded-full border transition ${color.className} ${catForm.data.color === color.value ? 'border-slate-950 ring-2 ring-blue-500 dark:border-white' : 'border-transparent'}`} aria-label={`Use ${color.value}`} />
                                    ))}
                                    <span className="ml-auto rounded-xl bg-slate-100 px-2 py-1 font-mono text-xs font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">{catForm.data.color}</span>
                                </div>
                            </Field>
                            <FormFooter onCancel={() => setCatModal(null)} processing={catForm.processing} submitLabel={catModal === 'create' ? 'Save Category' : 'Update Category'} />
                        </form>
                    </Modal>
                )}

                {deleteTarget && (
                    <DeleteDialog
                        title="Delete Expense?"
                        message={<>Remove <strong>"{deleteTarget.title}"</strong> ({fmt(deleteTarget.amount)})? This cannot be undone.</>}
                        onCancel={() => setDeleteTarget(null)}
                        onDelete={confirmDelete}
                    />
                )}

                {deleteCatTarget && (
                    <DeleteDialog
                        title="Delete Category?"
                        message={<>Delete <strong>"{deleteCatTarget.name}"</strong>? Expenses will become uncategorized.</>}
                        onCancel={() => setDeleteCatTarget(null)}
                        onDelete={confirmDeleteCat}
                    />
                )}
            </div>
        </AdminShell>
    );
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <label className={fieldLabelClass}>{label}</label>
            {children}
        </div>
    );
}

function Err({ children }: { children: ReactNode }) {
    return <p className="text-xs font-bold text-red-500">{children}</p>;
}

function CategoryBadge({ name }: { name: string }) {
    return (
        <Badge type="blue">
            <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                {name}
            </span>
        </Badge>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
    return (
        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-9 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-950">{icon}</div>
            <div>{title}</div>
            {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
        </div>
    );
}

function MetricTile({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'red' }) {
    return (
        <div className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
            <span className="block text-[9px] font-black uppercase text-slate-400">{label}</span>
            <strong className={`mt-1 block text-sm font-black ${tone === 'red' ? 'text-red-500' : 'text-slate-900 dark:text-slate-50'}`}>{value}</strong>
        </div>
    );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="max-h-[calc(100dvh-32px)] w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className="text-lg font-black text-slate-900 dark:text-slate-50">{title}</div>
                <div className="mt-0.5 text-xs font-bold text-slate-400">{subtitle}</div>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">
                <X size={16} />
            </button>
        </div>
    );
}

function FormFooter({ onCancel, processing, submitLabel }: { onCancel: () => void; processing: boolean; submitLabel: string }) {
    return (
        <div className="mt-1 grid grid-cols-[1fr_2fr] gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
            <button type="button" onClick={onCancel} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                <X size={15} /> Cancel
            </button>
            <button type="submit" disabled={processing} className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                <CheckCircle2 size={15} /> {processing ? 'Saving...' : submitLabel}
            </button>
        </div>
    );
}

function DeleteDialog({ title, message, onCancel, onDelete }: { title: string; message: ReactNode; onCancel: () => void; onDelete: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-5 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <Trash2 size={24} />
                    </div>
                    <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">{title}</div>
                    <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">{message}</div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={onCancel} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900`}>
                        <X size={15} /> Cancel
                    </button>
                    <button onClick={onDelete} className={`${footerButtonClass} bg-red-500 text-white hover:bg-red-600`}>
                        <Trash2 size={15} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function ColorIcon({ value }: { value: string }) {
    return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorSoftClass(value)}`}>
            <Tag size={18} className={colorTextClass(value)} />
        </div>
    );
}

function colorClass(value: string) {
    return PRESET_COLORS.find(color => color.value === value)?.className ?? 'bg-blue-500';
}

function colorTextClass(value: string) {
    const map: Record<string, string> = {
        '#6366f1': 'text-indigo-500',
        '#3b82f6': 'text-blue-500',
        '#10b981': 'text-emerald-500',
        '#f59e0b': 'text-amber-500',
        '#ef4444': 'text-red-500',
        '#8b5cf6': 'text-violet-500',
        '#ec4899': 'text-pink-500',
        '#14b8a6': 'text-teal-500',
    };
    return map[value] ?? 'text-blue-500';
}

function colorSoftClass(value: string) {
    const map: Record<string, string> = {
        '#6366f1': 'bg-indigo-500/10',
        '#3b82f6': 'bg-blue-500/10',
        '#10b981': 'bg-emerald-500/10',
        '#f59e0b': 'bg-amber-500/10',
        '#ef4444': 'bg-red-500/10',
        '#8b5cf6': 'bg-violet-500/10',
        '#ec4899': 'bg-pink-500/10',
        '#14b8a6': 'bg-teal-500/10',
    };
    return map[value] ?? 'bg-blue-500/10';
}

function progressWidth(amount: number, total: number) {
    if (total <= 0) return 'w-0';
    const percent = (amount / total) * 100;
    if (percent >= 90) return 'w-full';
    if (percent >= 75) return 'w-3/4';
    if (percent >= 50) return 'w-1/2';
    if (percent >= 25) return 'w-1/4';
    if (percent > 0) return 'w-[12%]';
    return 'w-0';
}
