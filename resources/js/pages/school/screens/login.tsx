import { useState } from 'react';
import type { Role } from '../data';
import { KH } from '../ui';

interface LoginProps { onLogin: (role: Role) => void; }

export function LoginScreen({ onLogin }: LoginProps) {
    const [sel, setSel] = useState<Role | null>(null);

    const roles: { id: Role; icon: string; lk: string; l: string; g: string }[] = [
        { id: 'admin',   icon: '🏫',  lk: 'អ្នកគ្រប់គ្រង', l: 'Admin / Principal',  g: 'linear-gradient(135deg,#2563eb,#4f46e5)' },
        { id: 'teacher', icon: '👩‍🏫', lk: 'គ្រូបង្រៀន',    l: 'Teacher',            g: 'linear-gradient(135deg,#059669,#0891b2)' },
        { id: 'student', icon: '🎓',  lk: 'សិស្ស',          l: 'Student',            g: 'linear-gradient(135deg,#7c3aed,#db2777)' },
        { id: 'parent',  icon: '👨‍👩‍👧', lk: 'មាតាបិតា',     l: 'Parent / Guardian',  g: 'linear-gradient(135deg,#0891b2,#0d9488)' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc,#eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>🏫</div>
                    <KH style={{ fontSize: 26, fontWeight: 800, display: 'block', color: '#1e293b', marginBottom: 4 }}>សាលា Frania</KH>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>Frania English School · Cambodia</div>
                    <KH style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginTop: 8 }}>ជ្រើសប្រភេទដើម្បីចូល</KH>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {roles.map(r => (
                        <button key={r.id} onClick={() => setSel(r.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, border: `2px solid ${sel === r.id ? '#2563eb' : '#e8edf5'}`, background: sel === r.id ? '#f8faff' : 'white', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                            <div style={{ width: 46, height: 46, borderRadius: 14, background: r.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{r.icon}</div>
                            <div style={{ flex: 1 }}>
                                <KH style={{ fontWeight: 800, fontSize: 16, display: 'block', color: '#1e293b' }}>{r.lk}</KH>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.l}</div>
                            </div>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel === r.id ? '#2563eb' : '#e2e8f0'}`, background: sel === r.id ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                {sel === r.id && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
                            </div>
                        </button>
                    ))}
                </div>

                <button onClick={() => sel && onLogin(sel)} disabled={!sel}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontWeight: 800, fontSize: 16, cursor: sel ? 'pointer' : 'not-allowed', transition: 'all 0.2s', background: sel ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : '#f1f5f9', color: sel ? 'white' : '#94a3b8', boxShadow: sel ? '0 8px 24px rgba(37,99,235,0.3)' : 'none', fontFamily: "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif" }}>
                    {sel ? 'ចូលប្រព័ន្ធ → Enter System' : 'ជ្រើសរើសជាមុនសិន'}
                </button>
            </div>
        </div>
    );
}
