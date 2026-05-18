import { KH } from '@/pages/admin/ui';
import { Building2 } from 'lucide-react';

interface AdminFooterLabels {
    schoolName: string;
    schoolSystem: string;
    copyright: string;
    help: string;
    privacy: string;
    version: string;
}

interface AdminFooterProps {
    labels: AdminFooterLabels;
}

export function AdminFooter({ labels }: AdminFooterProps) {
    return (
        <footer
            style={{
                padding: '12px 24px',
                borderTop: '1px solid #e2e8f0',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                flexShrink: 0,
                bottom: 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                    style={{
                        width: 22,
                        height: 22,
                        background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Building2 size={13} color="white" strokeWidth={2.4} />
                </div>
                <KH style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                    {labels.schoolName}
                </KH>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    · {labels.schoolSystem}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {labels.copyright}
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { label: labels.help, href: '#' },
                        { label: labels.privacy, href: '#' },
                        { label: labels.version, href: '#' },
                    ].map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color = '#3b82f6')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color = '#94a3b8')
                            }
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
