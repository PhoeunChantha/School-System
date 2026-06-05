import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';
import type { SharedData } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function ConfirmPassword() {
    const { props } = usePage<SharedData>();
    const school = props.school;
    const hasBg = !!school?.loginBg;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: hasBg
                    ? `url(${school!.loginBg}) center/cover no-repeat`
                    : 'linear-gradient(135deg,#f8fafc,#eff6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                fontFamily: "'Plus Jakarta Sans','Noto Sans Khmer',sans-serif",
                position: 'relative',
            }}
        >
            {hasBg && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.42)',
                        zIndex: 0,
                    }}
                />
            )}

            <Head title="Confirm password" />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 440,
                    background: hasBg ? 'rgba(255,255,255,0.12)' : 'white',
                    backdropFilter: hasBg ? 'blur(18px)' : undefined,
                    WebkitBackdropFilter: hasBg ? 'blur(18px)' : undefined,
                    borderRadius: 24,
                    padding: 40,
                    boxShadow: hasBg
                        ? '0 20px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.24)'
                        : '0 20px 60px rgba(15,23,42,0.1)',
                    border: hasBg
                        ? '1px solid rgba(255,255,255,0.28)'
                        : '1px solid #e2e8f0',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    {school?.logo ? (
                        <img
                            src={school.logo}
                            alt="School logo"
                            style={{
                                maxHeight: 74,
                                maxWidth: 180,
                                objectFit: 'contain',
                                margin: '0 auto 16px',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 74,
                                height: 74,
                                background:
                                    'linear-gradient(135deg,#2563eb,#4f46e5)',
                                borderRadius: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(37,99,235,0.28)',
                            }}
                        >
                            <Building2
                                size={36}
                                color="white"
                                strokeWidth={2.2}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            margin: '0 auto 14px',
                            display: 'grid',
                            placeItems: 'center',
                            background: hasBg
                                ? 'rgba(255,255,255,0.16)'
                                : '#eff6ff',
                            color: hasBg ? 'white' : '#2563eb',
                        }}
                    >
                        <ShieldCheck size={22} strokeWidth={2.4} />
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            color: hasBg ? 'white' : '#0f172a',
                            fontSize: 26,
                            fontWeight: 900,
                            lineHeight: 1.2,
                            textShadow: hasBg
                                ? '0 1px 4px rgba(0,0,0,0.35)'
                                : undefined,
                        }}
                    >
                        Confirm your password
                    </h1>
                    <p
                        style={{
                            margin: '10px 0 0',
                            color: hasBg ? 'rgba(255,255,255,0.78)' : '#64748b',
                            fontSize: 14,
                            lineHeight: 1.6,
                        }}
                    >
                        Enter your password to continue with this protected
                        account action.
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnError={['password']}
                    resetOnSuccess={['password']}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            {errors.password && (
                                <div
                                    style={{
                                        border: '1px solid #fecaca',
                                        borderRadius: 12,
                                        background: '#fef2f2',
                                        color: '#b91c1c',
                                        fontSize: 13,
                                        fontWeight: 800,
                                        lineHeight: 1.5,
                                        padding: '11px 14px',
                                    }}
                                    role="alert"
                                >
                                    {errors.password}
                                </div>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <label
                                    htmlFor="password"
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: hasBg ? 'white' : '#64748b',
                                    }}
                                >
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        autoFocus
                                        placeholder="Password"
                                        style={{
                                            background: hasBg
                                                ? 'rgba(255,255,255,0.08)'
                                                : '#f8fafc',
                                            border: hasBg
                                                ? '1.5px solid rgba(255,255,255,0.36)'
                                                : '1.5px solid #e2e8f0',
                                            borderRadius: 12,
                                            padding: '11px 44px 11px 14px',
                                            fontSize: 14,
                                            color: hasBg ? 'white' : '#1e293b',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        title={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current,
                                            )
                                        }
                                        style={{
                                            position: 'absolute',
                                            right: 10,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 30,
                                            height: 30,
                                            border: 'none',
                                            borderRadius: 8,
                                            background: 'transparent',
                                            color: hasBg
                                                ? 'rgba(255,255,255,0.78)'
                                                : '#64748b',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={18}
                                                strokeWidth={2.2}
                                            />
                                        ) : (
                                            <Eye size={18} strokeWidth={2.2} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="confirm-password-button"
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    borderRadius: 14,
                                    border: 'none',
                                    fontWeight: 900,
                                    fontSize: 15,
                                    cursor: processing
                                        ? 'not-allowed'
                                        : 'pointer',
                                    background: processing
                                        ? '#e2e8f0'
                                        : 'linear-gradient(135deg,#2563eb,#4f46e5)',
                                    color: processing ? '#94a3b8' : 'white',
                                    boxShadow: processing
                                        ? 'none'
                                        : '0 8px 24px rgba(37,99,235,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s',
                                    marginTop: 2,
                                }}
                            >
                                {processing && <Spinner />}
                                {processing ? (
                                    'Confirming...'
                                ) : (
                                    <>
                                        <span>Continue</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </Form>

                <div
                    style={{
                        marginTop: 22,
                        paddingTop: 18,
                        borderTop: hasBg
                            ? '1px solid rgba(255,255,255,0.18)'
                            : '1px solid #f1f5f9',
                        textAlign: 'center',
                        color: hasBg ? 'rgba(255,255,255,0.58)' : '#94a3b8',
                        fontSize: 11,
                        lineHeight: 1.5,
                    }}
                >
                    {school?.nameEn ?? 'Frania English School'} secure account
                    check
                </div>
            </div>
        </div>
    );
}
