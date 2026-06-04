import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SchoolSharedData {
    nameEn: string;
    logo: string | null;
    favicon: string | null;
    loginBg: string | null;
}

export interface LoginSecuritySharedData {
    maxAttempts: number;
    decaySeconds: number;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    school: SchoolSharedData;
    loginSecurity: LoginSecuritySharedData;
    notificationSound?: string | null;
    homeworkSubmissionAlerts?: {
        unreadCount: number;
        latest: {
            id: number;
            routeKey: string;
            studentName: string;
            assignmentTitle: string;
            className: string;
            submittedAt: string;
        } | null;
    };
    translations?: {
        admin?: Record<'en' | 'kh', Record<string, unknown>>;
        student?: Record<'en' | 'kh', Record<string, unknown>>;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
