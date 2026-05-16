import {
    destroyPermission,
    destroyRole,
    storePermission,
    storeRole,
    updatePermission,
    updateRole,
} from '@/actions/App/Http/Controllers/Backends/RolePermissionController';
import AdminShell from '@/pages/admin/shell';
import { AdminSelect } from '@/pages/admin/ui';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Edit3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
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
        if (!deleteTarget) {
            return;
        }

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
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: '#1e293b' }}>Roles & Permissions</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Manage access groups and permission keys</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {canCreatePermission && (
                            <button onClick={openCreatePermission} style={secondaryButton}>
                                <Plus size={15} />
                                Permission
                            </button>
                        )}
                        {canCreateRole && (
                            <button onClick={openCreateRole} style={primaryButton}>
                                <ShieldCheck size={15} />
                                Role
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Roles', value: summary.roleCount, color: '#2563eb', bg: '#eff6ff' },
                        { label: 'Permissions', value: summary.permissionCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Assignments', value: summary.assignedPermissionCount, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'User Roles', value: summary.userRoleCount, color: '#f59e0b', bg: '#fffbeb' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div style={{ display: 'inline-flex', padding: 4, borderRadius: 10, background: '#f1f5f9', gap: 4 }}>
                            <TabButton active={tab === 'roles'} onClick={() => setTab('roles')}>Roles</TabButton>
                            <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')}>Permissions</TabButton>
                        </div>
                        <input
                            className="f-input"
                            style={{ maxWidth: 320 }}
                            placeholder={`Search ${tab}...`}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                        />
                    </div>

                    {tab === 'roles' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: showRoleForm ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr', gap: 18, alignItems: 'start' }}>
                            {showRoleForm && (
                            <form onSubmit={submitRole} style={formPanel}>
                                <FormTitle>{roleMode === 'edit' ? `Edit ${editingRole?.name}` : 'Add Role'}</FormTitle>
                                <Field label="Role Name" error={roleForm.errors.name}>
                                    <input className="f-input" value={roleForm.data.name} onChange={event => roleForm.setData('name', event.target.value)} placeholder="admin" />
                                </Field>
                                <Field label="Guard" error={roleForm.errors.guard_name}>
                                    <AdminSelect
                                        value={roleForm.data.guard_name}
                                        onChange={value => roleForm.setData('guard_name', value)}
                                        options={[{ value: 'web', label: 'web' }]}
                                    />
                                </Field>
                                <Field label="Permissions" error={roleForm.errors.permission_ids}>
                                    <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                                        {permissionGroups.length === 0 ? (
                                            <div style={emptyText}>Create permissions first, then assign them to roles.</div>
                                        ) : permissionGroups.map(group => {
                                            const checkedCount = group.permissions.filter(permission => roleForm.data.permission_ids.includes(permission.id)).length;
                                            const isGroupChecked = checkedCount === group.permissions.length && group.permissions.length > 0;

                                            return (
                                            <div key={group.name} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, cursor: 'pointer' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>{group.name}</span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'none' }}>
                                                        All
                                                        <input
                                                            type="checkbox"
                                                            checked={isGroupChecked}
                                                            onChange={event => togglePermissionGroup(group, event.target.checked)}
                                                        />
                                                    </span>
                                                </label>
                                                <div style={{ display: 'grid', gap: 7 }}>
                                                    {group.permissions.map(permission => (
                                                        <label key={permission.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={roleForm.data.permission_ids.includes(permission.id)}
                                                                onChange={event => togglePermission(permission.id, event.target.checked)}
                                                            />
                                                            {permission.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </Field>
                                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                    <button type="button" onClick={openCreateRole} style={cancelButton}>Clear</button>
                                    <button type="submit" disabled={roleForm.processing} style={{ ...saveButton, opacity: roleForm.processing ? 0.65 : 1 }}>
                                        {roleMode === 'edit' ? 'Update Role' : 'Save Role'}
                                    </button>
                                </div>
                            </form>
                            )}

                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Role</th>
                                            <th>Permissions</th>
                                            <th>Users</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRoles.length === 0 ? (
                                            <tr><td colSpan={4} style={emptyCell}>No roles found</td></tr>
                                        ) : filteredRoles.map(role => (
                                            <tr key={role.id}>
                                                <td>
                                                    <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 13 }}>{role.name}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{role.guardName}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 360 }}>
                                                        {role.permissionNames.length === 0
                                                            ? <span style={{ fontSize: 12, color: '#94a3b8' }}>No permissions</span>
                                                            : role.permissionNames.slice(0, 5).map(permission => <Chip key={permission}>{permission}</Chip>)}
                                                        {role.permissionNames.length > 5 && <Chip>+{role.permissionNames.length - 5}</Chip>}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{role.userCount}</td>
                                                <td>
                                                    <RowActions
                                                        canEdit={canUpdateRole}
                                                        canDelete={canDeleteRole}
                                                        onEdit={() => openEditRole(role)}
                                                        onDelete={() => setDeleteTarget({ type: 'role', item: role })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: showPermissionForm ? 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' : '1fr', gap: 18, alignItems: 'start' }}>
                            {showPermissionForm && (
                            <form onSubmit={submitPermission} style={formPanel}>
                                <FormTitle>{permissionMode === 'edit' ? `Edit ${editingPermission?.name}` : 'Add Permission'}</FormTitle>
                                <Field label="Permission Name" error={permissionForm.errors.name}>
                                    <input className="f-input" value={permissionForm.data.name} onChange={event => permissionForm.setData('name', event.target.value)} placeholder="students.view" />
                                </Field>
                                <Field label="Guard" error={permissionForm.errors.guard_name}>
                                    <AdminSelect
                                        value={permissionForm.data.guard_name}
                                        onChange={value => permissionForm.setData('guard_name', value)}
                                        options={[{ value: 'web', label: 'web' }]}
                                    />
                                </Field>
                                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                    <button type="button" onClick={openCreatePermission} style={cancelButton}>Clear</button>
                                    <button type="submit" disabled={permissionForm.processing} style={{ ...saveButton, opacity: permissionForm.processing ? 0.65 : 1 }}>
                                        {permissionMode === 'edit' ? 'Update Permission' : 'Save Permission'}
                                    </button>
                                </div>
                            </form>
                            )}

                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Permission</th>
                                            <th>Group</th>
                                            <th>Roles</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPermissions.length === 0 ? (
                                            <tr><td colSpan={4} style={emptyCell}>No permissions found</td></tr>
                                        ) : filteredPermissions.map(permission => (
                                            <tr key={permission.id}>
                                                <td>
                                                    <div style={{ fontWeight: 900, color: '#1e293b', fontSize: 13 }}>{permission.name}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{permission.guardName}</div>
                                                </td>
                                                <td><Chip>{permission.group}</Chip></td>
                                                <td style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{permission.roleCount}</td>
                                                <td>
                                                    <RowActions
                                                        canEdit={canUpdatePermission}
                                                        canDelete={canDeletePermission}
                                                        onEdit={() => openEditPermission(permission)}
                                                        onDelete={() => setDeleteTarget({ type: 'permission', item: permission })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 6 }}>
                                Delete {deleteTarget.type === 'role' ? 'Role' : 'Permission'}?
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                Remove <strong>{deleteTarget.item.name}</strong> from access management?
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                background: active ? '#fff' : 'transparent',
                color: active ? '#2563eb' : '#64748b',
                boxShadow: active ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
            }}
        >
            {children}
        </button>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 6 }}>{label}</label>
            {children}
            {error && <div className="field-error">{error}</div>}
        </div>
    );
}

function FormTitle({ children }: { children: ReactNode }) {
    return <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', marginBottom: 14 }}>{children}</div>;
}

function Chip({ children }: { children: ReactNode }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 800, padding: '3px 8px' }}>
            {children}
        </span>
    );
}

function RowActions({ canEdit, canDelete, onEdit, onDelete }: { canEdit: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
    if (! canEdit && ! canDelete) {
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>;
    }

    return (
        <div style={{ display: 'flex', gap: 6 }}>
            {canEdit && <button onClick={onEdit} style={iconButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit"><Edit3 size={14} /></button>}
            {canDelete && <button onClick={onDelete} style={iconButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete"><Trash2 size={14} /></button>}
        </div>
    );
}

function iconButton(background: string, color: string, border: string): CSSProperties {
    return {
        background,
        color,
        border: `1px solid ${border}`,
        borderRadius: 7,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

const formPanel: CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 16,
    background: '#fff',
};

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

const secondaryButton: CSSProperties = {
    ...primaryButton,
    background: '#f1f5f9',
    color: '#475569',
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

const emptyText: CSSProperties = {
    color: '#94a3b8',
    fontSize: 12,
    padding: 12,
    borderRadius: 10,
    background: '#f8fafc',
};



