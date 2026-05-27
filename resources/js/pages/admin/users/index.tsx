import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/UserController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, Pagination, RowActions } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Camera, Edit3, Plus, Search, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface RoleItem {
    id: number;
    routeKey?: string;
    name: string;
}

interface UserItem {
    id: number;
    routeKey?: string;
    name: string;
    email: string;
    avatar: string | null;
    emailVerified: boolean;
    roleIds: number[];
    roleNames: string[];
    createdAt: string;
}

interface UsersPageProps {
    users: UserItem[];
    roles: RoleItem[];
    summary: {
        userCount: number;
        verifiedCount: number;
        roleAssignmentCount: number;
    };
}

interface UserFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    avatar: File | null;
    email_verified: boolean;
    role_ids: number[];
    _method?: 'put';
}

type Mode = 'create' | 'edit';

const pageClass = 'fade-in mx-auto flex w-full max-w-[1280px] flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] md:gap-5 md:p-6';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

export default function UsersPage({ users, roles, summary }: UsersPageProps) {
    const { props } = usePage<SharedData>();
    const permissions = useMemo(() => new Set(props.auth?.permissions ?? []), [props.auth?.permissions]);
    const canCreate = permissions.has('users.create');
    const canUpdate = permissions.has('users.update');
    const canDelete = permissions.has('users.delete');
    const [mode, setMode] = useState<Mode>('create');
    const [editing, setEditing] = useState<UserItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const showForm = canCreate || (mode === 'edit' && canUpdate);

    const form = useForm<UserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        avatar: null,
        email_verified: true,
        role_ids: [],
    });

    const filteredUsers = useMemo(() => {
        const query = search.toLowerCase();

        return users.filter(user =>
            !query
            || user.name.toLowerCase().includes(query)
            || user.email.toLowerCase().includes(query)
            || user.roleNames.some(role => role.toLowerCase().includes(query)),
        );
    }, [users, search]);

    useEffect(() => {
        setPage(1);
    }, [search, users.length, perPage]);

    const paginatedUsers = useMemo(
        () => filteredUsers.slice((page - 1) * perPage, page * perPage),
        [filteredUsers, page, perPage],
    );

    const resetForm = () => {
        form.setData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            avatar: null,
            email_verified: true,
            role_ids: [],
        });
        form.clearErrors();
        setAvatarPreview(null);
        setEditing(null);
        setMode('create');

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const editUser = (user: UserItem) => {
        if (!canUpdate) return;

        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            avatar: null,
            email_verified: user.emailVerified,
            role_ids: user.roleIds,
        });
        form.clearErrors();
        setAvatarPreview(user.avatar);
        setEditing(user);
        setMode('edit');
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if ((mode === 'create' && !canCreate) || (mode === 'edit' && !canUpdate)) return;

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(mode === 'edit' ? 'User updated.' : 'User created.');
                resetForm();
            },
        };

        if (mode === 'edit' && editing) {
            form.transform(data => ({ ...data, _method: 'put' }));
            form.post(update.url((editing.routeKey ?? editing.id) as never), options);
            return;
        }

        form.transform(data => data);
        form.post(store.url(), options);
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
                toast.success('User deleted.');
                setDeleteTarget(null);
            },
        });
    };

    const actionsFor = (user: UserItem) => [
        { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => editUser(user), hidden: !canUpdate },
        { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(user), variant: 'destructive' as const, separatorBefore: true, hidden: !canDelete },
    ];

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-black text-blue-500">Access control</p>
                            <h1 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">Users</h1>
                            <p className="mt-1 truncate text-xs font-bold text-slate-400">Manage accounts, avatars, and role assignments</p>
                        </div>
                        {canCreate && (
                            <button onClick={resetForm} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="New user">
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-3 gap-2">
                    <Metric label="Users" value={summary.userCount} />
                    <Metric label="Verified" value={summary.verifiedCount} />
                    <Metric label="Roles" value={summary.roleAssignmentCount} />
                </div>

                {showForm && (
                    <form onSubmit={submit} className={`${panelClass} md:mx-auto md:w-full md:max-w-[900px] md:p-5`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-slate-50">{mode === 'edit' ? `Edit ${editing?.name}` : 'Create User'}</h2>
                                <p className="mt-1 text-xs font-bold text-slate-400">{mode === 'edit' ? 'Update account access' : 'Create a new staff account'}</p>
                            </div>
                            {mode === 'edit' && (
                                <button type="button" onClick={resetForm} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                                    New
                                </button>
                            )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-start">
                            <div className="flex flex-col items-center gap-2 rounded-[22px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                                    {avatarPreview ? <img src={avatarPreview} alt="User avatar preview" className="h-full w-full object-cover" /> : <UserRound size={34} />}
                                    <span className="absolute right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                                        <Camera size={13} />
                                    </span>
                                </button>
                                <p className="max-w-full truncate text-center text-xs font-bold text-slate-400">{form.data.avatar ? form.data.avatar.name : 'Upload profile photo'}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={event => {
                                        const file = event.target.files?.[0] ?? null;
                                        form.setData('avatar', file);
                                        setAvatarPreview(file ? URL.createObjectURL(file) : (editing?.avatar ?? null));
                                    }}
                                />
                                <FieldError message={form.errors.avatar as string | undefined} />
                            </div>

                            <div className="grid gap-3">
                            <Field label="Name" error={form.errors.name}>
                                <input className={inputClass} value={form.data.name} onChange={event => form.setData('name', event.target.value)} />
                            </Field>
                            <Field label="Email" error={form.errors.email}>
                                <input className={inputClass} type="email" value={form.data.email} onChange={event => form.setData('email', event.target.value)} />
                            </Field>
                            <div className="grid gap-2 md:grid-cols-2">
                                <Field label={mode === 'edit' ? 'New Password' : 'Password'} error={form.errors.password}>
                                    <input className={inputClass} type="password" value={form.data.password} onChange={event => form.setData('password', event.target.value)} />
                                </Field>
                                <Field label="Confirm Password" error={form.errors.password_confirmation}>
                                    <input className={inputClass} type="password" value={form.data.password_confirmation} onChange={event => form.setData('password_confirmation', event.target.value)} />
                                </Field>
                            </div>
                            <Field label="Role" error={form.errors.role_ids}>
                                <Select value={form.data.role_ids[0]?.toString() ?? 'none'} onValueChange={value => form.setData('role_ids', value === 'none' ? [] : [Number(value)])}>
                                    <SelectTrigger className={inputClass}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No role</SelectItem>
                                        {roles.map(role => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                <input type="checkbox" checked={form.data.email_verified} onChange={event => form.setData('email_verified', event.target.checked)} />
                                Email verified
                            </label>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                            <button type="button" onClick={resetForm} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                <X size={15} /> Clear
                            </button>
                            <button type="submit" disabled={form.processing} className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                {mode === 'edit' ? 'Update User' : 'Save User'}
                            </button>
                        </div>
                    </form>
                )}

                <section className={panelClass}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-slate-50">User Accounts</h2>
                            <p className="text-xs font-bold text-slate-400">{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'} found</p>
                        </div>
                        <Select value={perPage.toString()} onValueChange={value => setPerPage(Number(value))}>
                            <SelectTrigger className="min-h-10 w-[116px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-black dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(value => <SelectItem key={value} value={value.toString()}>{value} / page</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-3 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                        <Search size={16} className="shrink-0 text-slate-400" />
                        <input placeholder="Search users..." value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredUsers.length === 0 && (
                            <div className="rounded-[22px] border border-dashed border-slate-300 px-4 py-10 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No users found
                            </div>
                        )}
                        {paginatedUsers.map(user => (
                            <article key={user.id} className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                                <div className="flex items-start gap-3">
                                    <Avatar name={user.name} src={user.avatar} size={44} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{user.name}</p>
                                                <p className="truncate text-[11px] font-bold text-slate-400">{user.email}</p>
                                            </div>
                                            {(canUpdate || canDelete) && <RowActions ariaLabel={`Actions for ${user.name}`} actions={actionsFor(user)} />}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            <Badge type={user.emailVerified ? 'green' : 'amber'}>{user.emailVerified ? 'verified' : 'unverified'}</Badge>
                                            {user.roleNames.length === 0 ? <Chip>No roles</Chip> : user.roleNames.map(role => <Chip key={role}>{role}</Chip>)}
                                        </div>
                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                            Created {user.createdAt}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {filteredUsers.length > 0 && (
                        <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                            <Pagination total={filteredUsers.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} showPerPage={false} />
                        </div>
                    )}
                </section>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete User?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.name}</strong> from the system?</div>
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

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-[18px] border border-blue-500/25 bg-blue-500/10 p-3 text-blue-500">
            <div className="flex items-center gap-1.5 text-2xl font-black leading-none">
                <ShieldCheck size={17} />
                {value}
            </div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</label>
            {children}
            <FieldError message={error} />
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    return message ? <div className="mt-1.5 text-xs font-bold text-red-500">{message}</div> : null;
}

function Chip({ children }: { children: ReactNode }) {
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">{children}</span>;
}
