import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export function useAdminPermissions() {
    const { props } = usePage<SharedData>();

    const permissions = useMemo(
        () => new Set(props.auth?.permissions ?? []),
        [props.auth?.permissions],
    );

    const can = (permission: string): boolean => permissions.has(permission);
    const canAny = (items: string[]): boolean => items.some(can);
    const canAll = (items: string[]): boolean => items.every(can);

    return { permissions, can, canAny, canAll };
}
