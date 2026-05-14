import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { Student } from './data';

interface KHProps { children: ReactNode; className?: string; style?: CSSProperties; }
export function KH({ children, className = '', style }: KHProps) {
    return <span className={`font-khmer ${className}`} style={style}>{children}</span>;
}

interface AvatarProps { name: string; size?: number; src?: string | null; }
export function Avatar({ name, size = 36, src }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const clean = (name || '').replace(/[ក-៿\s]/g, '').trim();
    const initials = clean.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || (name || '?')[0];
    const pal = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#f97316'];
    const bg = pal[(name || '').charCodeAt(0) % pal.length];

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setImgError(true)}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
            />
        );
    }

    return (
        <div style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: Math.max(10, size * 0.36), flexShrink: 0 }}>
            {initials}
        </div>
    );
}

interface PBarProps { value: number; max?: number; color?: string; height?: number; }
export function PBar({ value, max = 100, color = '#3b82f6', height = 6 }: PBarProps) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const map: Record<string, string> = { blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444', purple: '#8b5cf6' };
    const c = color.startsWith('#') ? color : (map[color] ?? '#3b82f6');
    return (
        <div className="pbar" style={{ height }}>
            <div className="pbar-fill" style={{ width: `${pct}%`, background: c }} />
        </div>
    );
}

export type BadgeType = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray';
interface BadgeProps { type?: BadgeType; children: ReactNode; }
export function Badge({ type = 'blue', children }: BadgeProps) {
    return <span className={`badge badge-${type}`}>{children}</span>;
}

interface FeeTagProps { status: Student['fees']; }
function badgeContent(Icon: typeof Check, label: string) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon size={12} strokeWidth={2.6} />{label}</span>;
}

export function FeeTag({ status }: FeeTagProps) {
    if (status === 'Paid')    return <Badge type="green">{badgeContent(Check, 'Paid')}</Badge>;
    if (status === 'Unpaid')  return <Badge type="red">{badgeContent(X, 'Unpaid')}</Badge>;
    if (status === 'Partial') return <Badge type="amber">~ Partial</Badge>;
    return null;
}

interface ScoreChipProps { score: number; }
export function ScoreChip({ score }: ScoreChipProps) {
    const type: BadgeType = score >= 75 ? 'green' : score >= 50 ? 'blue' : score >= 35 ? 'amber' : 'red';
    return <Badge type={type}>{score}</Badge>;
}

// ── Reusable Pagination ───────────────────────────────────
export interface PaginationProps {
    total: number;
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
    showPerPage?: boolean;
}

export function Pagination({
    total, page, perPage,
    onPageChange, onPerPageChange,
    perPageOptions = [5, 10, 25, 50],
    showPerPage = true,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total);
    const to   = Math.min(page * perPage, total);

    // Build visible page numbers with ellipsis
    const pageNums: (number | '…')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageNums.push(i);
    } else {
        pageNums.push(1);
        if (page > 3) pageNums.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
        if (page < totalPages - 2) pageNums.push('…');
        pageNums.push(totalPages);
    }

    const btn = (active: boolean, disabled: boolean): CSSProperties => ({
        minWidth: 32, height: 32, borderRadius: 8, padding: '0 10px',
        border: `1.5px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
        background: active ? '#2563eb' : disabled ? '#f8fafc' : 'white',
        color: active ? 'white' : disabled ? '#cbd5e1' : '#374151',
        fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 10 }}>
            {/* Result info */}
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {total === 0
                    ? 'No results'
                    : <>Showing <strong style={{ color: '#1e293b' }}>{from}–{to}</strong> of <strong style={{ color: '#1e293b' }}>{total}</strong></>
                }
            </div>

            {/* Page buttons */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    style={btn(false, page === 1)}>
                    <ArrowLeft size={14} />
                </button>
                {pageNums.map((p, i) =>
                    p === '…'
                        ? <span key={`e${i}`} style={{ width: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>…</span>
                        : <button key={p} onClick={() => onPageChange(p as number)} style={btn(p === page, false)}>{p}</button>
                )}
                <button
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                    style={btn(false, page === totalPages)}>
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* Per page — only shown when showPerPage=true */}
            {showPerPage && (
                <select
                    value={perPage}
                    onChange={e => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                    {perPageOptions.map(n => (
                        <option key={n} value={n}>{n} per page</option>
                    ))}
                </select>
            )}
        </div>
    );
}
