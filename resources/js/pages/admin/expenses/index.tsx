import {
    destroy,
    destroyCategory,
    store,
    storeCategory,
    update,
    updateCategory,
} from '@/actions/App/Http/Controllers/Backends/ExpenseController';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, Badge, Pagination } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import {
    Edit3,
    FolderOpen,
    Layers,
    Plus,
    Receipt,
    Tag,
    Trash2,
    TrendingDown,
    X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
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

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function sortExpenses(list: ExpenseItem[], order: OrderKey): ExpenseItem[] {
    return [...list].sort((a, b) => {
        switch (order) {
            case 'date-desc': return b.expenseDate.localeCompare(a.expenseDate);
            case 'date-asc':  return a.expenseDate.localeCompare(b.expenseDate);
            case 'amount-desc': return b.amount - a.amount;
            case 'amount-asc':  return a.amount - b.amount;
            case 'title-asc':   return a.title.localeCompare(b.title);
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
        ...categories.map(c => ({ value: String(c.id), label: c.name })),
    ];

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = expenses.filter(e =>
            (catFilter === 'all' || String(e.categoryId) === catFilter) &&
            (!q || e.title.toLowerCase().includes(q) || e.categoryName.toLowerCase().includes(q) || e.expenseDate.includes(search)),
        );
        return sortExpenses(base, orderBy);
    }, [expenses, search, orderBy, catFilter]);

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

    const submitExpense = (e: FormEvent) => {
        e.preventDefault();
        const isEdit = expenseModal === 'edit' && editTarget;
        const url = isEdit ? update.url((editTarget.routeKey ?? editTarget.id) as never) : store.url();
        router[isEdit ? 'put' : 'post'](url, expForm.data as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => { toast.success(isEdit ? 'Expense updated.' : 'Expense recorded.'); setExpenseModal(null); expForm.reset(); },
            onError: () => toast.error('Please check the form.'),
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(destroy.url((deleteTarget.routeKey ?? deleteTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Expense deleted.'); setDeleteTarget(null); },
        });
    };

    const openCreateCat = () => {
        catForm.setData({ name: '', name_kh: '', color: '#6366f1' });
        setEditCatTarget(null);
        setCatModal('create');
    };

    const openEditCat = (cat: CategoryItem) => {
        setEditCatTarget(cat);
        catForm.setData({ name: cat.name, name_kh: cat.nameKh, color: cat.color });
        setCatModal('edit');
    };

    const submitCat = (e: FormEvent) => {
        e.preventDefault();
        const isEdit = catModal === 'edit' && editCatTarget;
        const url = isEdit ? updateCategory.url((editCatTarget.routeKey ?? editCatTarget.id) as never) : storeCategory.url();
        router[isEdit ? 'put' : 'post'](url, catForm.data as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => { toast.success(isEdit ? 'Category updated.' : 'Category created.'); setCatModal(null); catForm.reset(); },
            onError: () => toast.error('Please check the form.'),
        });
    };

    const confirmDeleteCat = () => {
        if (!deleteCatTarget) return;
        router.delete(destroyCategory.url((deleteCatTarget.routeKey ?? deleteCatTarget.id) as never), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Category deleted.'); setDeleteCatTarget(null); },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Expense Management</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Track and manage school expenses by category</div>
                    </div>
                    <button
                        onClick={tab === 'expenses' ? openCreate : openCreateCat}
                        style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Plus size={15} /> {tab === 'expenses' ? 'Add Expense' : 'Add Category'}
                    </button>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                    {[
                        { l: 'Total Expenses', v: fmt(summary.totalAmount), c: '#ef4444', bg: '#fff1f2' },
                        { l: 'This Month',     v: fmt(summary.thisMonthAmount), c: '#6366f1', bg: '#f5f3ff' },
                        { l: 'Total Records',  v: String(summary.totalCount), c: '#3b82f6', bg: '#eff6ff' },
                        { l: 'Categories',     v: String(summary.categoryCount), c: '#10b981', bg: '#f0fdf4' },
                    ].map(item => (
                        <div key={item.l} style={{ background: item.bg, borderRadius: 14, padding: 16, border: `1px solid ${item.c}30` }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: item.c, marginBottom: 2 }}>{item.v}</div>
                            <div style={{ fontSize: 11, color: item.c, opacity: 0.7 }}>{item.l}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #f1f5f9' }}>
                    {(['expenses', 'categories'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '8px 20px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: tab === t ? 800 : 600,
                                color: tab === t ? '#2563eb' : '#64748b',
                                borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
                                marginBottom: -2,
                                transition: 'all 0.15s',
                                textTransform: 'capitalize',
                            }}
                        >
                            {t === 'expenses' ? `Expenses (${expenses.length})` : `Categories (${categories.length})`}
                        </button>
                    ))}
                </div>

                {/* EXPENSES TAB */}
                {tab === 'expenses' && (
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                            <AdminSelect
                                value={catFilter}
                                onChange={v => { setCatFilter(v); setPage(1); }}
                                options={catOptions}
                                triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                            />
                            <AdminSelect
                                value={orderBy}
                                onChange={v => { setOrderBy(v as OrderKey); setPage(1); }}
                                options={ORDER_OPTIONS}
                                triggerClassName="f-input h-9 min-h-9 px-3 py-1 text-xs font-bold"
                            />
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="f-input"
                                style={{ width: 240, maxWidth: '100%', marginLeft: 'auto' }}
                                placeholder="Search expenses..."
                            />
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
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
                                            <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                                <FolderOpen size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                                                {search ? <>No expenses found for <strong>"{search}"</strong></> : 'No expenses yet'}
                                            </td>
                                        </tr>
                                    ) : paginated.map(e => (
                                        <tr key={e.id}>
                                            <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{e.expenseDate}</td>
                                            <td>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                                                {e.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>}
                                            </td>
                                            <td>
                                                {e.categoryName
                                                    ? <Badge type="blue"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: e.categoryColor, display: 'inline-block', flexShrink: 0 }} />{e.categoryName}</span></Badge>
                                                    : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                                                }
                                            </td>
                                            <td><span style={{ fontWeight: 800, color: '#ef4444' }}>{fmt(e.amount)}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => openEdit(e)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                        <Edit3 size={12} /> Edit
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(e)} style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filtered.length > 0 && (
                            <Pagination
                                total={filtered.length}
                                page={page}
                                perPage={perPage}
                                onPageChange={setPage}
                                onPerPageChange={v => { setPerPage(v); setPage(1); }}
                            />
                        )}
                    </div>
                )}

                {/* CATEGORIES TAB */}
                {tab === 'categories' && (
                    <div className="card">
                        {categories.length === 0 ? (
                            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
                                <Tag size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                                <div style={{ fontWeight: 700, fontSize: 14 }}>No categories yet</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Add a category to organize your expenses</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, padding: 16 }}>
                                {categories.map(cat => (
                                    <div key={cat.id} style={{ background: 'white', borderRadius: 14, border: '1.5px solid #f1f5f9', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Tag size={18} color={cat.color} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</div>
                                                {cat.nameKh && <div style={{ fontSize: 11, color: '#94a3b8' }}>{cat.nameKh}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                                            <span style={{ color: '#64748b' }}>{cat.expensesCount} expense{cat.expensesCount !== 1 ? 's' : ''}</span>
                                            <span style={{ fontWeight: 800, color: '#ef4444' }}>{fmt(cat.totalAmount)}</span>
                                        </div>
                                        <div style={{ width: '100%', height: 3, borderRadius: 4, background: '#f1f5f9', marginBottom: 12, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: cat.color, borderRadius: 4, width: summary.totalAmount > 0 ? `${Math.min(100, (cat.totalAmount / summary.totalAmount) * 100)}%` : '0%' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEditCat(cat)} style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                                <Edit3 size={12} /> Edit
                                            </button>
                                            <button onClick={() => setDeleteCatTarget(cat)} style={{ flex: 1, background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* EXPENSE MODAL */}
                {expenseModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                        onClick={e => { if (e.target === e.currentTarget) setExpenseModal(null); }}>
                        <form onSubmit={submitExpense} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{expenseModal === 'create' ? 'Add Expense' : 'Edit Expense'}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Fill in the expense details below</div>
                                </div>
                                <button type="button" onClick={() => setExpenseModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <Field label="Category">
                                <select value={expForm.data.category_id} onChange={e => expForm.setData('category_id', e.target.value)} className="f-input">
                                    <option value="">— No Category —</option>
                                    {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                </select>
                                {expForm.errors.category_id && <Err>{expForm.errors.category_id}</Err>}
                            </Field>

                            <Field label="Title *">
                                <input className="f-input" value={expForm.data.title} onChange={e => expForm.setData('title', e.target.value)} placeholder="e.g. Office Supplies" required />
                                {expForm.errors.title && <Err>{expForm.errors.title}</Err>}
                            </Field>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="Amount (USD) *">
                                    <input className="f-input" type="number" min="0.01" step="0.01" value={expForm.data.amount} onChange={e => expForm.setData('amount', e.target.value)} placeholder="0.00" required />
                                    {expForm.errors.amount && <Err>{expForm.errors.amount}</Err>}
                                </Field>
                                <Field label="Date *">
                                    <input className="f-input" type="date" value={expForm.data.expense_date} onChange={e => expForm.setData('expense_date', e.target.value)} required />
                                    {expForm.errors.expense_date && <Err>{expForm.errors.expense_date}</Err>}
                                </Field>
                            </div>

                            <Field label="Description">
                                <textarea className="f-input" style={{ minHeight: 68, resize: 'vertical' }} value={expForm.data.description} onChange={e => expForm.setData('description', e.target.value)} placeholder="Optional notes..." />
                            </Field>

                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button type="button" onClick={() => setExpenseModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <X size={15} /> Cancel
                                </button>
                                <button type="submit" disabled={expForm.processing} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: expForm.processing ? 0.6 : 1 }}>
                                    {expForm.processing ? 'Saving...' : expenseModal === 'create' ? 'Save Expense' : 'Update Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* CATEGORY MODAL */}
                {catModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                        onClick={e => { if (e.target === e.currentTarget) setCatModal(null); }}>
                        <form onSubmit={submitCat} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{catModal === 'create' ? 'Add Category' : 'Edit Category'}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Organize your expenses by category</div>
                                </div>
                                <button type="button" onClick={() => setCatModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <Field label="Name (English) *">
                                <input className="f-input" value={catForm.data.name} onChange={e => catForm.setData('name', e.target.value)} placeholder="e.g. Utilities" required />
                                {catForm.errors.name && <Err>{catForm.errors.name}</Err>}
                            </Field>

                            <Field label="Name (Khmer)">
                                <input className="f-input" value={catForm.data.name_kh} onChange={e => catForm.setData('name_kh', e.target.value)} placeholder="ឈ្មោះជាភាសាខ្មែរ" />
                            </Field>

                            <Field label="Color">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {PRESET_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => catForm.setData('color', c)}
                                            style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: catForm.data.color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer', outline: 'none', transition: 'border 0.1s' }} />
                                    ))}
                                    <input type="color" value={catForm.data.color} onChange={e => catForm.setData('color', e.target.value)}
                                        style={{ width: 32, height: 28, padding: 2, border: '1.5px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }} />
                                    <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{catForm.data.color}</span>
                                </div>
                            </Field>

                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button type="button" onClick={() => setCatModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <X size={15} /> Cancel
                                </button>
                                <button type="submit" disabled={catForm.processing} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: catForm.processing ? 0.6 : 1 }}>
                                    {catForm.processing ? 'Saving...' : catModal === 'create' ? 'Save Category' : 'Update Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* DELETE EXPENSE */}
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
                        <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <Trash2 size={24} color="#ef4444" />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Expense?</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                    Remove <strong>"{deleteTarget.title}"</strong> ({fmt(deleteTarget.amount)})? This cannot be undone.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <X size={15} /> Cancel
                                </button>
                                <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Trash2 size={15} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE CATEGORY */}
                {deleteCatTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
                        <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <Trash2 size={24} color="#ef4444" />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Category?</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                    Delete <strong>"{deleteCatTarget.name}"</strong>? Expenses will become uncategorized.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setDeleteCatTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <X size={15} /> Cancel
                                </button>
                                <button onClick={confirmDeleteCat} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Trash2 size={15} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            {children}
        </div>
    );
}

function Err({ children }: { children: React.ReactNode }) {
    return <p style={{ margin: 0, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{children}</p>;
}
