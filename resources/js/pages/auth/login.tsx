import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { SharedData } from '@/types';

import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, Eye, EyeOff } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { props } = usePage<SharedData>();
    const school = props.school;
    const loginSecurity = props.loginSecurity;
    const hasBg = !!school?.loginBg;
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        navigator.serviceWorker
            .register('/student/service-worker.js', { scope: '/' })
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (lockoutSeconds <= 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            setLockoutSeconds((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [lockoutSeconds]);

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
                        background: 'rgba(0,0,0,0.38)',
                        zIndex: 0,
                    }}
                />
            )}
            <Head title="Log in" />
            <Head>
                <link rel="manifest" href="/student/manifest.webmanifest" />
                <meta name="theme-color" content="#009c7f" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-title"
                    content={`${school?.nameEn ?? 'Frania English School'} Student`}
                />
                <link
                    rel="apple-touch-icon"
                    href={
                        school?.logo ??
                        school?.favicon ??
                        '/apple-touch-icon.png'
                    }
                />
            </Head>

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 440,
                    background: hasBg ? '' : 'white',
                    backdropFilter: hasBg ? 'blur(2px)' : undefined,
                    WebkitBackdropFilter: hasBg ? 'blur(18px)' : undefined,
                    borderRadius: 24,
                    padding: 40,
                    boxShadow: hasBg
                        ? '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.25)'
                        : '0 20px 60px rgba(0,0,0,0.1)',
                    border: hasBg
                        ? '1px solid rgba(255,255,255,0.3)'
                        : undefined,
                }}
            >
                {/* School branding */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    {school?.logo ? (
                        <img
                            src={school.logo}
                            alt="School logo"
                            style={{
                                maxHeight: 80,
                                maxWidth: 200,
                                objectFit: 'contain',
                                margin: '0 auto 16px',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                background:
                                    'linear-gradient(135deg,#2563eb,#4f46e5)',
                                borderRadius: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                            }}
                        >
                            <Building2
                                size={40}
                                color="white"
                                strokeWidth={2.2}
                            />
                        </div>
                    )}

                    <span
                        style={{
                            fontSize: 26,
                            fontWeight: 800,
                            display: 'block',
                            color: hasBg ? 'white' : '#1e293b',
                            marginBottom: 4,
                            fontFamily:
                                "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                            textShadow: hasBg
                                ? '0 1px 4px rgba(0,0,0,0.4)'
                                : undefined,
                        }}
                    >
                        {school?.nameEn ?? 'Frania English School'}
                    </span>
                    <div
                        style={{
                            color: hasBg ? 'rgba(255,255,255,0.85)' : '#94a3b8',
                            fontSize: 14,
                        }}
                    >
                        {school?.nameEn ?? 'Frania English School'} · Cambodia
                    </div>
                    <div
                        style={{
                            color: hasBg ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                            fontSize: 12,
                            marginTop: 8,
                            fontFamily:
                                "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                        }}
                    >
                        Sign in to your account
                    </div>
                </div>

                {/* Status message */}
                {status && (
                    <div
                        style={{
                            marginBottom: 20,
                            padding: '10px 14px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 10,
                            fontSize: 13,
                            color: '#16a34a',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}
                    >
                        {status}
                    </div>
                )}

                {/* Auth form */}
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
                        <LoginFormFields
                            canResetPassword={canResetPassword}
                            errors={errors}
                            hasBg={hasBg}
                            configuredLockoutSeconds={
                                loginSecurity?.decaySeconds ?? 15
                            }
                            lockoutSeconds={lockoutSeconds}
                            processing={processing}
                            setLockoutSeconds={setLockoutSeconds}
                        />
                    )}
                </Form>

                {/* Footer */}
                <div
                    style={{
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: hasBg
                            ? '1px solid rgba(255,255,255,0.2)'
                            : '1px solid #f1f5f9',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: hasBg ? 'rgba(255,255,255,0.55)' : '#cbd5e1',
                        }}
                    >
                        © {new Date().getFullYear()} Frania School System ·
                        Cambodia
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginFormFields({
    canResetPassword,
    configuredLockoutSeconds,
    errors,
    hasBg,
    lockoutSeconds,
    processing,
    setLockoutSeconds,
}: {
    canResetPassword: boolean;
    configuredLockoutSeconds: number;
    errors: Partial<Record<'email' | 'password', string>>;
    hasBg: boolean;
    lockoutSeconds: number;
    processing: boolean;
    setLockoutSeconds: Dispatch<SetStateAction<number>>;
}) {
    const errorMessage = errors.email ?? errors.password;
    const parsedLockoutSeconds =
        lockoutSecondsFromMessage(errorMessage) ||
        (isLockoutMessage(errorMessage) ? configuredLockoutSeconds : 0);
    const lockoutActive = lockoutSeconds > 0;
    const showError =
        errorMessage && (parsedLockoutSeconds === 0 || lockoutActive);
    const handledLockoutMessage = useRef<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (processing) {
            handledLockoutMessage.current = null;

            return;
        }

        if (
            errorMessage &&
            parsedLockoutSeconds > 0 &&
            handledLockoutMessage.current !== errorMessage
        ) {
            setLockoutSeconds(parsedLockoutSeconds);
            handledLockoutMessage.current = errorMessage;
        }
    }, [errorMessage, parsedLockoutSeconds, processing, setLockoutSeconds]);

    return (
        <>
            {showError && (
                <LoginErrorMessage
                    lockoutSeconds={lockoutSeconds}
                    message={errorMessage}
                />
            )}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}
            >
                <label
                    htmlFor="email"
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: hasBg ? 'white' : '#64748b',
                    }}
                >
                    Email Address / Student Code
                </label>
                <Input
                    id="email"
                    type="text"
                    name="email"
                    required
                    disabled={lockoutActive}
                    autoFocus
                    tabIndex={1}
                    autoComplete="username"
                    placeholder="email@example.com or STU-1001"
                    style={{
                        background: hasBg ? 'transparent' : '#f8fafc',
                        border: hasBg
                            ? '1.5px solid rgba(255,255,255,0.35)'
                            : '1.5px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 14,
                        color: hasBg ? 'white' : '#1e293b',
                    }}
                />
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <label
                        htmlFor="password"
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: hasBg ? 'white' : '#64748b',
                        }}
                    >
                        Password
                    </label>
                    {canResetPassword && (
                        <TextLink
                            href={request()}
                            tabIndex={5}
                            className={
                                hasBg
                                    ? 'text-xs text-white/80 hover:text-white'
                                    : 'text-xs text-blue-600 hover:text-blue-700'
                            }
                        >
                            Forgot password?
                        </TextLink>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        disabled={lockoutActive}
                        tabIndex={2}
                        autoComplete="current-password"
                        placeholder="Password"
                        style={{
                            background: hasBg ? 'transparent' : '#f8fafc',
                            border: hasBg
                                ? '1.5px solid rgba(255,255,255,0.35)'
                                : '1.5px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '10px 44px 10px 14px',
                            fontSize: 14,
                            color: hasBg ? 'white' : '#1e293b',
                        }}
                    />
                    <button
                        type="button"
                        aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                        }
                        title={showPassword ? 'Hide password' : 'Show password'}
                        disabled={lockoutActive}
                        onClick={() => setShowPassword((current) => !current)}
                        style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 28,
                            height: 28,
                            border: 'none',
                            borderRadius: 8,
                            background: 'transparent',
                            color: hasBg ? 'rgba(255,255,255,0.78)' : '#64748b',
                            cursor: lockoutActive ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {showPassword ? (
                            <EyeOff size={18} strokeWidth={2.2} />
                        ) : (
                            <Eye size={18} strokeWidth={2.2} />
                        )}
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <Checkbox
                    id="remember"
                    name="remember"
                    disabled={lockoutActive}
                    tabIndex={3}
                />
                <label
                    htmlFor="remember"
                    style={{
                        fontSize: 13,
                        color: hasBg ? 'rgba(255,255,255,0.85)' : '#64748b',
                        cursor: 'pointer',
                    }}
                >
                    Remember me
                </label>
            </div>

            <button
                type="submit"
                tabIndex={4}
                disabled={processing || lockoutActive}
                data-test="login-button"
                style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 14,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor:
                        processing || lockoutActive ? 'not-allowed' : 'pointer',
                    background:
                        processing || lockoutActive
                            ? '#e2e8f0'
                            : 'linear-gradient(135deg,#2563eb,#4f46e5)',
                    color: processing || lockoutActive ? '#94a3b8' : 'white',
                    boxShadow:
                        processing || lockoutActive
                            ? 'none'
                            : '0 8px 24px rgba(37,99,235,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    fontFamily:
                        "'Noto Sans Khmer','Plus Jakarta Sans',sans-serif",
                    marginTop: 4,
                }}
            >
                {processing && <Spinner />}
                {processing ? (
                    'Signing in...'
                ) : lockoutActive ? (
                    `Wait ${lockoutSeconds}s`
                ) : (
                    <>
                        <span>Log in</span>
                        <ArrowRight size={16} />
                    </>
                )}
            </button>
        </>
    );
}

function LoginErrorMessage({
    message,
    lockoutSeconds,
}: {
    message: string;
    lockoutSeconds: number;
}) {
    const initialSeconds = lockoutSecondsFromMessage(message);

    if (initialSeconds > 0 && lockoutSeconds <= 0) {
        return null;
    }

    return (
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
            {initialSeconds > 0
                ? `Too many login attempts. Please try again in ${lockoutSeconds} seconds.`
                : message}
        </div>
    );
}

function lockoutSecondsFromMessage(message?: string): number {
    const match = message?.match(/try again in (\d+) seconds/i);

    return match ? Number(match[1]) : 0;
}

function isLockoutMessage(message?: string): boolean {
    return !!message?.match(/too many login attempts|throttle/i);
}
