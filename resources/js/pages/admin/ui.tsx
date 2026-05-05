import type { CSSProperties, ReactNode } from 'react';
import type { Student } from './data';

interface KHProps { children: ReactNode; className?: string; style?: CSSProperties; }
export function KH({ children, className = '', style }: KHProps) {
    return <span className={`font-khmer ${className}`} style={style}>{children}</span>;
}

interface AvatarProps { name: string; size?: number; }
export function Avatar({ name, size = 36 }: AvatarProps) {
    const clean = (name || '').replace(/[ក-៿\s]/g, '').trim();
    const initials = clean.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || (name || '?')[0];
    const pal = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#f97316'];
    const bg = pal[(name || '').charCodeAt(0) % pal.length];
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
export function FeeTag({ status }: FeeTagProps) {
    if (status === 'Paid')    return <Badge type="green">✓ Paid</Badge>;
    if (status === 'Unpaid')  return <Badge type="red">✗ Unpaid</Badge>;
    if (status === 'Partial') return <Badge type="amber">~ Partial</Badge>;
    return null;
}

interface ScoreChipProps { score: number; }
export function ScoreChip({ score }: ScoreChipProps) {
    const type: BadgeType = score >= 75 ? 'green' : score >= 50 ? 'blue' : score >= 35 ? 'amber' : 'red';
    return <Badge type={type}>{score}</Badge>;
}
