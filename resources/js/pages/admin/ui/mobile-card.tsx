import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AdminMobileCardMetaItem {
    label: ReactNode;
    value: ReactNode;
}

interface AdminMobileCardProps {
    title: ReactNode;
    subtitle?: ReactNode;
    leading?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    actionLabel?: string;
    meta?: AdminMobileCardMetaItem[];
    footer?: ReactNode;
    className?: string;
}

export function AdminMobileCard({
    title,
    subtitle,
    leading,
    badge,
    actions,
    actionLabel = 'Actions',
    meta = [],
    footer,
    className = '',
}: AdminMobileCardProps) {
    return (
        <div className={`admin-mobile-card ${className}`.trim()}>
            <div className="admin-mobile-card-head">
                <div className="admin-mobile-card-person">
                    {leading}
                    <div>
                        <div className="admin-mobile-card-title">{title}</div>
                        {subtitle && (
                            <div className="admin-mobile-card-subtitle">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
                <div className="admin-mobile-card-head-actions">
                    {badge}
                    {actions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="admin-mobile-card-menu"
                                    aria-label={actionLabel}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {actions}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {meta.length > 0 && (
                <div className="admin-mobile-card-meta">
                    {meta.map((item, index) => (
                        <div key={index}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </div>
            )}

            {footer && <div className="admin-mobile-card-footer">{footer}</div>}
        </div>
    );
}
