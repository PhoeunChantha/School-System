import { KH } from '@/pages/admin/ui';

export function AdminFooter() {
    const year = new Date().getFullYear();

    return (
        <footer style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            flexShrink: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏫</div>
                <KH style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>សាលា Frania</KH>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>· Frania English School</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    © {year} Frania School System. All rights reserved.
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { label: 'Help', href: '#' },
                        { label: 'Privacy', href: '#' },
                        { label: 'v1.0.0', href: '#' },
                    ].map(link => (
                        <a key={link.label} href={link.href}
                            style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
