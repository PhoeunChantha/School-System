import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Backends/UserController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, RowActions } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Camera, Edit3, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { FormEvent, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
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
            !query ||
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.roleNames.some(role => role.toLowerCase().includes(query)),
        );
    }, [users, search]);

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
        if (! canUpdate) {
            return;
        }

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

        if ((mode === 'create' && ! canCreate) || (mode === 'edit' && ! canUpdate)) {
            return;
        }

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
        if (!deleteTarget) {
            return;
        }

        if (! canDelete) {
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

    return (
        <AdminShell>
            <div className="fade-in users-page" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: '#1e293b' }}>Users</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Manage accounts, avatars, and role assignments</div>
                    </div>
                    {canCreate && (
                        <button onClick={resetForm} style={primaryButton}>
                            <Plus size={15} />
                            New User
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                    <Metric label="Users" value={summary.userCount} />
                    <Metric label="Verified" value={summary.verifiedCount} />
                    <Metric label="Role Assignments" value={summary.roleAssignmentCount} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr', gap: 18, alignItems: 'start' }}>
                    {showForm && (
                    <form className="card" onSubmit={submit} style={{ padding: 18 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', marginBottom: 14 }}>
                            {mode === 'edit' ? `Edit ${editing?.name}` : 'Create User'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ width: 92, height: 92, borderRadius: '50%', border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="User avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <UserRound size={34} color="#94a3b8" />
                                )}
                                <span style={{ position: 'absolute', right: 4, bottom: 4, width: 24, height: 24, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Camera size={12} color="#fff" />
                                </span>
                            </button>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                {form.data.avatar ? form.data.avatar.name : 'Upload profile photo'}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                style={{ display: 'none' }}
                                onChange={event => {
                                    const file = event.target.files?.[0] ?? null;
                                    form.setData('avatar', file);
                                    setAvatarPreview(file ? URL.createObjectURL(file) : (editing?.avatar ?? null));
                                }}
                            />
                            <FieldError message={form.errors.avatar as string | undefined} />
                        </div>

                        <Field label="Name" error={form.errors.name}>
                            <input className="f-input" value={form.data.name} onChange={event => form.setData('name', event.target.value)} />
                        </Field>
                        <Field label="Email" error={form.errors.email}>
                            <input className="f-input" type="email" value={form.data.email} onChange={event => form.setData('email', event.target.value)} />
                        </Field>
                        <Field label={mode === 'edit' ? 'New Password' : 'Password'} error={form.errors.password}>
                            <input className="f-input" type="password" value={form.data.password} onChange={event => form.setData('password', event.target.value)} />
                        </Field>
                        <Field label="Confirm Password" error={form.errors.password_confirmation}>
                            <input className="f-input" type="password" value={form.data.password_confirmation} onChange={event => form.setData('password_confirmation', event.target.value)} />
                        </Field>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#475569', margin: '8px 0 14px' }}>
                            <input
                                type="checkbox"
                                checked={form.data.email_verified}
                                onChange={event => form.setData('email_verified', event.target.checked)}
                            />
                            Email verified
                        </label>

                        <Field label="Role" error={form.errors.role_ids}>
                            <Select
                                value={form.data.role_ids[0]?.toString() ?? ''}
                                onValueChange={value => form.setData('role_ids', value === 'none' ? [] : [Number(value)])}
                            >
                                <SelectTrigger className="f-input">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No role</SelectItem>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button type="button" onClick={resetForm} style={cancelButton}>Clear</button>
                            <button type="submit" disabled={form.processing} style={{ ...saveButton, opacity: form.processing ? 0.65 : 1 }}>
                                {mode === 'edit' ? 'Update User' : 'Save User'}
                            </button>
                        </div>
                    </form>
                    )}

                    <div className="card users-table-card">
                        <div style={{ padding: 14, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>User Accounts</div>
                            <input className="f-input" style={{ width: 280, maxWidth: '100%' }} placeholder="Search users..." value={search} onChange={event => setSearch(event.target.value)} />
                        </div>
                        <div className="users-table-scroll" role="region" aria-label="User accounts table">
                            <table className={`data-table users-table${canUpdate || canDelete ? ' has-actions' : ''}`}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Roles</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        {(canUpdate || canDelete) && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={canUpdate || canDelete ? 5 : 4} style={emptyCell}>No users found</td></tr>
                                    ) : filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                    <Avatar name={user.name} src={user.avatar} size={36} />
                                                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                        <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                    {user.roleNames.length === 0 ? (
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>No roles</span>
                                                    ) : user.roleNames.map(role => <Chip key={role}>{role}</Chip>)}
                                                </div>
                                            </td>
                                            <td><Badge type={user.emailVerified ? 'green' : 'amber'}>{user.emailVerified ? 'verified' : 'unverified'}</Badge></td>
                                            <td style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{user.createdAt}</td>
                                            {(canUpdate || canDelete) && (
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <RowActions
                                                            ariaLabel={`Actions for ${user.name}`}
                                                            actions={[
                                                                { key: 'edit', label: 'Edit', icon: Edit3, onSelect: () => editUser(user), hidden: !canUpdate },
                                                                { key: 'delete', label: 'Delete', icon: Trash2, onSelect: () => setDeleteTarget(user), variant: 'destructive', separatorBefore: true, hidden: !canDelete },
                                                            ]}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 6 }}>Delete User?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                Remove <strong>{deleteTarget.name}</strong> from the system?
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={cancelButton}>Cancel</button>
                            <button onClick={confirmDelete} style={{ ...saveButton, background: '#ef4444' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontSize: 24, fontWeight: 900 }}>
                <ShieldCheck size={18} />
                {value}
            </div>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 800 }}>{label}</div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 6 }}>{label}</label>
            {children}
            <FieldError message={error} />
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    return message ? <div className="field-error">{message}</div> : null;
}

function Chip({ children }: { children: ReactNode }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 800, padding: '3px 8px' }}>
            {children}
        </span>
    );
}

const primaryButton: CSSProperties = {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '9px 16px',
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
};

const cancelButton: CSSProperties = {
    flex: 1,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: 10,
    padding: '11px',
    fontWeight: 800,
    cursor: 'pointer',
};

const saveButton: CSSProperties = {
    flex: 2,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '11px',
    fontWeight: 800,
    cursor: 'pointer',
};

const emptyCell: CSSProperties = {
    padding: '34px 16px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
};


