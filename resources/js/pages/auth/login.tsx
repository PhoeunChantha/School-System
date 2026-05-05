import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword, canRegister }: LoginProps) {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg,#f8fafc,#eff6ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: "'Plus Jakarta Sans','Noto Sans Khmer',sans-serif",
        }}>
            <Head title="Log in" />

            <div style={{
                width: '100%',
                maxWidth: 440,
                background: 'white',
                borderRadius: 24,
                padding: 40,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }}>
                {/* School branding */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 80, height: 80,
                        background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                        borderRadius: 24,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 40,
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                    }}>🏫</div>

                    <span style={{
                        fontSize: 26, fontWeight: 800, display: 'block',
                        color: '#1e293b', marginBottom: 4,
                        fontFamily: "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                    }}>
                        សាលា Frania
                    </span>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>
                        Frania English School · Cambodia
                    </div>
                    <div style={{
                        color: '#94a3b8', fontSize: 12,
                        marginTop: 8,
                        fontFamily: "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                    }}>
                        ចូលគណនីរបស់អ្នក / Sign in to your account
                    </div>
                </div>

                {/* Status message */}
                {status && (
                    <div style={{
                        marginBottom: 20, padding: '10px 14px',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 10, fontSize: 13,
                        color: '#16a34a', fontWeight: 600, textAlign: 'center',
                    }}>
                        {status}
                    </div>
                )}

                {/* Auth form */}
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Email */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label htmlFor="email" style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                    Email Address / អ៊ីម៉ែល
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    style={{
                                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                        borderRadius: 10, padding: '10px 14px', fontSize: 14,
                                    }}
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label htmlFor="password" style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                        Password / លេខសម្ងាត់
                                    </label>
                                    {canResetPassword && (
                                        <TextLink href={request()} tabIndex={5} className="text-xs text-blue-600 hover:text-blue-700">
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    style={{
                                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                        borderRadius: 10, padding: '10px 14px', fontSize: 14,
                                    }}
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember me */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <label htmlFor="remember" style={{ fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
                                    Remember me
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                                style={{
                                    width: '100%', padding: '13px',
                                    borderRadius: 14, border: 'none',
                                    fontWeight: 800, fontSize: 15,
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    background: processing
                                        ? '#e2e8f0'
                                        : 'linear-gradient(135deg,#2563eb,#4f46e5)',
                                    color: processing ? '#94a3b8' : 'white',
                                    boxShadow: processing ? 'none' : '0 8px 24px rgba(37,99,235,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s',
                                    fontFamily: "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                                    marginTop: 4,
                                }}
                            >
                                {processing && <Spinner />}
                                {processing ? 'កំពុងចូល...' : 'ចូលប្រព័ន្ធ → Log in'}
                            </button>

                            {/* Register link */}
                            {canRegister && (
                                <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                                    Don't have an account?{' '}
                                    <TextLink href={register()} tabIndex={6} className="font-semibold text-blue-600 hover:text-blue-700">
                                        Sign up
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>

                {/* Footer */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                        © {new Date().getFullYear()} Frania School System · Cambodia
                    </div>
                </div>
            </div>
        </div>
    );
}
