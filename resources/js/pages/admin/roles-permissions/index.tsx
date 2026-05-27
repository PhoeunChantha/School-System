import {
    destroyPermission,
    destroyRole,
    storePermission,
    storeRole,
    updatePermission,
    updateRole,
} from '@/actions/App/Http/Controllers/Backends/RolePermissionController';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect, RowActions as RowActionsMenu } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Edit3, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface RoleItem {
    id: number;
    routeKey?: string;
    name: string;
    guardName: string;
    permissionIds: number[];
    permissionNames: string[];
    userCount: number;
    createdAt: string;
}

interface PermissionItem {
    id: number;
    routeKey?: string;
    name: string;
    guardName: string;
    group: string;
    roleCount: number;
    createdAt: string;
}

interface PermissionGroup {
    name: string;
    permissions: PermissionItem[];
}

interface RolePermissionPageProps {
    roles: RoleItem[];
    permissions: PermissionItem[];
    permissionGroups: PermissionGroup[];
    summary: {
        roleCount: number;
        permissionCount: number;
        assignedPermissionCount: number;
        userRoleCount: number;
    };
}

interface RoleFormData {
    name: string;
    guard_name: string;
    permission_ids: number[];
}

interface PermissionFormData {
    name: string;
    guard_name: string;
}

type Tab = 'roles' | 'permissions';
type Mode = 'create' | 'edit';
type DeleteTarget = { type: 'role'; item: RoleItem } | { type: 'permission'; item: PermissionItem };

const pageClass = 'fade-in flex flex-col gap-3 bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]';
const panelClass = 'rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const footerButtonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition';

export default function RolePermissionPage({ roles, permissions, permissionGroups, summary }: RolePermissionPageProps) {
    const { props } = usePage<SharedData>();
    const userPermissions = useMemo(() => new Set(props.auth?.permissions ?? []), [props.auth?.permissions]);
    const canCreateRole = userPermissions.has('roles.create');
    const canUpdateRole = userPermissions.has('roles.update');
    const canDeleteRole = userPermissions.has('roles.delete');
    const canCreatePermission = userPermissions.has('permissions.create');
    const canUpdatePermission = userPermissions.has('permissions.update');
    const canDeletePermission = userPermissions.has('permissions.delete');
    const [tab, setTab] = useState<Tab>('roles');
    const [roleMode, setRoleMode] = useState<Mode>('create');
    const [permissionMode, setPermissionMode] = useState<Mode>('create');
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [search, setSearch] = useState('');
    const [rolePage, setRolePage] = useState(1);
    const [permissionPage, setPermissionPage] = useState(1);
    const [rolePerPage, setRolePerPage] = useState(5);
    const [permissionPerPage, setPermissionPerPage] = useState(5);
    const showRoleForm = roleMode === 'edit' ? canUpdateRole : canCreateRole;
    const showPermissionForm = permissionMode === 'edit' ? canUpdatePermission : canCreatePermission;

    const roleForm = useForm<RoleFormData>({
        name: '',
        guard_name: 'web',
        permission_ids: [],
    });

    const permissionForm = useForm<PermissionFormData>({
        name: '',
        guard_name: 'web',
    });

    const filteredRoles = useMemo(
        () => roles.filter(role => !search || role.name.toLowerCase().includes(search.toLowerCase())),
        [roles, search],
    );

    const filteredPermissions = useMemo(
        () => permissions.filter(permission => !search || permission.name.toLowerCase().includes(search.toLowerCase())),
        [permissions, search],
    );

    const paginatedRoles = useMemo(
        () => filteredRoles.slice((rolePage - 1) * rolePerPage, rolePage * rolePerPage),
        [filteredRoles, rolePage, rolePerPage],
    );

    const paginatedPermissions = useMemo(
        () => filteredPermissions.slice((permissionPage - 1) * permissionPerPage, permissionPage * permissionPerPage),
        [filteredPermissions, permissionPage, permissionPerPage],
    );

    useEffect(() => {
        setRolePage(1);
        setPermissionPage(1);
    }, [search, tab]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredRoles.length / rolePerPage));

        if (rolePage > maxPage) {
            setRolePage(maxPage);
        }
    }, [filteredRoles.length, rolePage, rolePerPage]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredPermissions.length / permissionPerPage));

        if (permissionPage > maxPage) {
            setPermissionPage(maxPage);
        }
    }, [filteredPermissions.length, permissionPage, permissionPerPage]);

    const openCreateRole = () => {
        roleForm.setData({ name: '', guard_name: 'web', permission_ids: [] });
        roleForm.clearErrors();
        setEditingRole(null);
        setRoleMode('create');
        setTab('roles');
    };

    const openEditRole = (role: RoleItem) => {
        roleForm.setData({
            name: role.name,
            guard_name: role.guardName,
            permission_ids: role.permissionIds,
        });
        roleForm.clearErrors();
        setEditingRole(role);
        setRoleMode('edit');
        setTab('roles');
    };

    const openCreatePermission = () => {
        permissionForm.setData({ name: '', guard_name: 'web' });
        permissionForm.clearErrors();
        setEditingPermission(null);
        setPermissionMode('create');
        setTab('permissions');
    };

    const openEditPermission = (permission: PermissionItem) => {
        permissionForm.setData({
            name: permission.name,
            guard_name: permission.guardName,
        });
        permissionForm.clearErrors();
        setEditingPermission(permission);
        setPermissionMode('edit');
        setTab('permissions');
    };

    const submitRole = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(roleMode === 'edit' ? 'Role updated.' : 'Role created.');
                openCreateRole();
            },
        };

        if (roleMode === 'edit' && editingRole) {
            roleForm.put(updateRole.url((editingRole.routeKey ?? editingRole.id) as never), options);
            return;
        }

        roleForm.post(storeRole.url(), options);
    };

    const submitPermission = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(permissionMode === 'edit' ? 'Permission updated.' : 'Permission created.');
                openCreatePermission();
            },
        };

        if (permissionMode === 'edit' && editingPermission) {
            permissionForm.put(updatePermission.url((editingPermission.routeKey ?? editingPermission.id) as never), options);
            return;
        }

        permissionForm.post(storePermission.url(), options);
    };

    const togglePermission = (permissionId: number, checked: boolean) => {
        roleForm.setData(
            'permission_ids',
            checked
                ? [...roleForm.data.permission_ids, permissionId]
                : roleForm.data.permission_ids.filter(id => id !== permissionId),
        );
    };

    const togglePermissionGroup = (group: PermissionGroup, checked: boolean) => {
        const groupPermissionIds = group.permissions.map(permission => permission.id);

        roleForm.setData(
            'permission_ids',
            checked
                ? Array.from(new Set([...roleForm.data.permission_ids, ...groupPermissionIds]))
                : roleForm.data.permission_ids.filter(id => !groupPermissionIds.includes(id)),
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        const route = deleteTarget.type === 'role'
            ? destroyRole.url((deleteTarget.item.routeKey ?? deleteTarget.item.id) as never)
            : destroyPermission.url((deleteTarget.item.routeKey ?? deleteTarget.item.id) as never);

        router.delete(route, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${deleteTarget.type === 'role' ? 'Role' : 'Permission'} deleted.`);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className={pageClass}>
                <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-black text-blue-500">Access management</p>
                            <h1 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">Roles & Permissions</h1>
                            <p className="mt-1 truncate text-xs font-bold text-slate-400">Manage access groups and permission keys</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {canCreatePermission && (
                                <button onClick={openCreatePermission} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" aria-label="Add permission">
                                    <Plus size={17} />
                                </button>
                            )}
                            {canCreateRole && (
                                <button onClick={openCreateRole} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:bg-blue-500" aria-label="Add role">
                                    <ShieldCheck size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Metric label="Roles" value={summary.roleCount} tone="blue" />
                    <Metric label="Permissions" value={summary.permissionCount} tone="green" />
                    <Metric label="Assignments" value={summary.assignedPermissionCount} tone="violet" />
                    <Metric label="User Roles" value={summary.userRoleCount} tone="amber" />
                </div>

                <section className={panelClass}>
                    <div className="mb-3 flex items-center gap-2">
                        <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                            <TabButton active={tab === 'roles'} onClick={() => setTab('roles')}>Roles</TabButton>
                            <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')}>Permissions</TabButton>
                        </div>
                    </div>
                </section>

                {tab === 'roles' ? (
                    <>
                        {showRoleForm && (
                            <form onSubmit={submitRole} className={panelClass}>
                                <FormTitle>{roleMode === 'edit' ? `Edit ${editingRole?.name}` : 'Add Role'}</FormTitle>
                                <div className="grid gap-3">
                                    <Field label="Role Name" error={roleForm.errors.name}>
                                        <input className={inputClass} value={roleForm.data.name} onChange={event => roleForm.setData('name', event.target.value)} placeholder="admin" />
                                    </Field>
                                    <Field label="Guard" error={roleForm.errors.guard_name}>
                                        <AdminSelect value={roleForm.data.guard_name} onChange={value => roleForm.setData('guard_name', value)} options={[{ value: 'web', label: 'web' }]} triggerClassName={inputClass} />
                                    </Field>
                                    <Field label="Permissions" error={roleForm.errors.permission_ids}>
                                        <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1">
                                            {permissionGroups.length === 0 ? (
                                                <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400 dark:bg-slate-950">Create permissions first, then assign them to roles.</div>
                                            ) : permissionGroups.map(group => (
                                                <PermissionGroupBox key={group.name} group={group} selectedIds={roleForm.data.permission_ids} onToggleGroup={togglePermissionGroup} onTogglePermission={togglePermission} />
                                            ))}
                                        </div>
                                    </Field>
                                </div>
                                <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                                    <button type="button" onClick={openCreateRole} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                        <X size={15} /> Clear
                                    </button>
                                    <button type="submit" disabled={roleForm.processing} className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                        {roleMode === 'edit' ? 'Update Role' : 'Save Role'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <section className="grid gap-3">
                            <ListToolbar
                                resultLabel={`${filteredRoles.length} roles`}
                                search={search}
                                searchPlaceholder="Search roles..."
                                onSearchChange={setSearch}
                                perPage={rolePerPage}
                                onPerPageChange={value => {
                                    setRolePerPage(value);
                                    setRolePage(1);
                                }}
                            />
                            {filteredRoles.length === 0 && <EmptyState>No roles found</EmptyState>}
                            {paginatedRoles.map(role => (
                                <article key={role.id} className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{role.name}</p>
                                            <p className="mt-0.5 text-[11px] font-bold text-slate-400">{role.guardName} guard - {role.userCount} users</p>
                                        </div>
                                        <RowActions canEdit={canUpdateRole} canDelete={canDeleteRole} onEdit={() => openEditRole(role)} onDelete={() => setDeleteTarget({ type: 'role', item: role })} />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {role.permissionNames.length === 0
                                            ? <Chip>No permissions</Chip>
                                            : role.permissionNames.slice(0, 6).map(permission => <Chip key={permission}>{permission}</Chip>)}
                                        {role.permissionNames.length > 6 && <Chip>+{role.permissionNames.length - 6}</Chip>}
                                    </div>
                                </article>
                            ))}
                            {filteredRoles.length > 0 && (
                                <ListPagination
                                    total={filteredRoles.length}
                                    page={rolePage}
                                    perPage={rolePerPage}
                                    onPageChange={setRolePage}
                                />
                            )}
                        </section>
                    </>
                ) : (
                    <>
                        {showPermissionForm && (
                            <form onSubmit={submitPermission} className={panelClass}>
                                <FormTitle>{permissionMode === 'edit' ? `Edit ${editingPermission?.name}` : 'Add Permission'}</FormTitle>
                                <div className="grid gap-3">
                                    <Field label="Permission Name" error={permissionForm.errors.name}>
                                        <input className={inputClass} value={permissionForm.data.name} onChange={event => permissionForm.setData('name', event.target.value)} placeholder="students.view" />
                                    </Field>
                                    <Field label="Guard" error={permissionForm.errors.guard_name}>
                                        <AdminSelect value={permissionForm.data.guard_name} onChange={value => permissionForm.setData('guard_name', value)} options={[{ value: 'web', label: 'web' }]} triggerClassName={inputClass} />
                                    </Field>
                                </div>
                                <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                                    <button type="button" onClick={openCreatePermission} className={`${footerButtonClass} bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800`}>
                                        <X size={15} /> Clear
                                    </button>
                                    <button type="submit" disabled={permissionForm.processing} className={`${footerButtonClass} bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300`}>
                                        {permissionMode === 'edit' ? 'Update Permission' : 'Save Permission'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <section className="grid gap-3">
                            <ListToolbar
                                resultLabel={`${filteredPermissions.length} permissions`}
                                search={search}
                                searchPlaceholder="Search permissions..."
                                onSearchChange={setSearch}
                                perPage={permissionPerPage}
                                onPerPageChange={value => {
                                    setPermissionPerPage(value);
                                    setPermissionPage(1);
                                }}
                            />
                            {filteredPermissions.length === 0 && <EmptyState>No permissions found</EmptyState>}
                            {paginatedPermissions.map(permission => (
                                <article key={permission.id} className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{permission.name}</p>
                                            <p className="mt-0.5 text-[11px] font-bold text-slate-400">{permission.guardName} guard - {permission.roleCount} roles</p>
                                        </div>
                                        <RowActions canEdit={canUpdatePermission} canDelete={canDeletePermission} onEdit={() => openEditPermission(permission)} onDelete={() => setDeleteTarget({ type: 'permission', item: permission })} />
                                    </div>
                                    <div className="mt-3">
                                        <Chip>{permission.group}</Chip>
                                    </div>
                                </article>
                            ))}
                            {filteredPermissions.length > 0 && (
                                <ListPagination
                                    total={filteredPermissions.length}
                                    page={permissionPage}
                                    perPage={permissionPerPage}
                                    onPageChange={setPermissionPage}
                                />
                            )}
                        </section>
                    </>
                )}
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <div className="mb-1.5 text-lg font-black text-slate-900 dark:text-slate-50">Delete {deleteTarget.type === 'role' ? 'Role' : 'Permission'}?</div>
                            <div className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">Remove <strong>{deleteTarget.item.name}</strong> from access management?</div>
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

function PermissionGroupBox({ group, selectedIds, onToggleGroup, onTogglePermission }: { group: PermissionGroup; selectedIds: number[]; onToggleGroup: (group: PermissionGroup, checked: boolean) => void; onTogglePermission: (permissionId: number, checked: boolean) => void }) {
    const checkedCount = group.permissions.filter(permission => selectedIds.includes(permission.id)).length;
    const isGroupChecked = checkedCount === group.permissions.length && group.permissions.length > 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
            <label className="mb-2 flex cursor-pointer items-center justify-between gap-3">
                <span className="truncate text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{group.name}</span>
                <span className="inline-flex items-center gap-2 text-[11px] font-black text-slate-400">
                    All
                    <input type="checkbox" checked={isGroupChecked} onChange={event => onToggleGroup(group, event.target.checked)} />
                </span>
            </label>
            <div className="grid gap-1.5">
                {group.permissions.map(permission => (
                    <label key={permission.id} className="flex min-h-8 cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-2 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <input type="checkbox" checked={selectedIds.includes(permission.id)} onChange={event => onTogglePermission(permission.id, event.target.checked)} />
                        <span className="truncate">{permission.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" onClick={onClick} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${active ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
            {children}
        </button>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</label>
            {children}
            {error && <div className="mt-1.5 text-xs font-bold text-red-500">{error}</div>}
        </div>
    );
}

function FormTitle({ children }: { children: ReactNode }) {
    return <div className="mb-3 text-base font-black text-slate-900 dark:text-slate-50">{children}</div>;
}

function Chip({ children }: { children: ReactNode }) {
    return <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">{children}</span>;
}

function RowActions({ canEdit, canDelete, onEdit, onDelete }: { canEdit: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
    if (!canEdit && !canDelete) return <span className="text-xs font-bold text-slate-400">-</span>;

    return (
        <RowActionsMenu
            actions={[
                { key: 'edit', label: 'Edit', icon: Edit3, onSelect: onEdit, hidden: !canEdit },
                { key: 'delete', label: 'Delete', icon: Trash2, onSelect: onDelete, variant: 'destructive', separatorBefore: true, hidden: !canDelete },
            ]}
        />
    );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'violet' | 'amber' }) {
    return (
        <div className={`rounded-[18px] border p-3 ${metricClass(tone)}`}>
            <div className="text-2xl font-black leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-black opacity-70">{label}</div>
        </div>
    );
}

function EmptyState({ children }: { children: ReactNode }) {
    return <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">{children}</div>;
}

function ListToolbar({ resultLabel, search, searchPlaceholder, onSearchChange, perPage, onPerPageChange }: { resultLabel: string; search: string; searchPlaceholder: string; onSearchChange: (search: string) => void; perPage: number; onPerPageChange: (perPage: number) => void }) {
    return (
        <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90">
            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <div className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950 lg:max-w-[360px]">
                    <Search size={16} className="shrink-0 text-slate-400" />
                    <input
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                    />
                </div>
                <AdminSelect
                    value={perPage.toString()}
                    onChange={value => onPerPageChange(Number(value))}
                    options={[5, 10, 25, 50].map(value => ({ value: value.toString(), label: `${value} per page` }))}
                    triggerClassName="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 lg:w-[138px]"
                />
                <div className="px-1 text-xs font-black text-slate-500 dark:text-slate-300 lg:ml-1">{resultLabel}</div>
            </div>
        </div>
    );
}

function ListPagination({ total, page, perPage, onPageChange }: { total: number; page: number; perPage: number; onPageChange: (page: number) => void }) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(total, page * perPage);
    const pages = paginationPages(page, totalPages);

    return (
        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-black text-slate-500 dark:text-slate-300">
                Showing <span className="text-slate-900 dark:text-slate-50">{from} - {to}</span> of <span className="text-slate-900 dark:text-slate-50">{total}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <PageButton disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                        &lt;
                    </PageButton>
                    {pages.map((item, index) => item === '...'
                        ? <span key={`ellipsis-${index}`} className="flex h-10 min-w-9 items-center justify-center text-xs font-black text-slate-400">...</span>
                        : (
                            <PageButton key={item} active={item === page} onClick={() => onPageChange(item)}>
                                {item}
                            </PageButton>
                        ))}
                    <PageButton disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
                        &gt;
                    </PageButton>
                </div>
            </div>
        </div>
    );
}

function PageButton({ active = false, disabled = false, onClick, children }: { active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-xs font-black transition ${
                active
                    ? 'border-blue-600 bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:disabled:text-slate-600'
            }`}
        >
            {children}
        </button>
    );
}

function paginationPages(page: number, totalPages: number): (number | '...')[] {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: (number | '...')[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) {
        pages.push('...');
    }

    for (let item = start; item <= end; item += 1) {
        pages.push(item);
    }

    if (end < totalPages - 1) {
        pages.push('...');
    }

    pages.push(totalPages);

    return pages;
}

function metricClass(tone: 'blue' | 'green' | 'violet' | 'amber') {
    if (tone === 'green') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500';
    if (tone === 'violet') return 'border-violet-500/25 bg-violet-500/10 text-violet-500';
    if (tone === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-500';
    return 'border-blue-500/25 bg-blue-500/10 text-blue-500';
}
