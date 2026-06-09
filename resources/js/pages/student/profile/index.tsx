import StudentShell, {
    type StudentProfile,
    SAvatar,
} from '@/pages/student/shell';
import { logout } from '@/routes';
import { notifications } from '@/routes/student';
import { Link, router } from '@inertiajs/react';
import { BadgeCheck, ChevronRight, LogOut } from 'lucide-react';

interface StudentDetail {
    nameEn: string;
    nameKh: string;
    code: string;
    gender: string;
    dateOfBirth: string;
    province: string;
    district: string;
    commune: string;
    village: string;
    parentPhone: string;
    telegramUsername: string;
    monthlyFee: number;
    scholarshipAmount: number;
    feeStatus: string;
    status: string;
    enrolledOn: string;
    photo: string | null;
    className: string;
    level: string;
}

interface Props {
    profile: StudentProfile;
    student: StudentDetail;
}

function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function feeStatusBadge(s: string) {
    if (s === 'paid') return 's-badge-green';
    if (s === 'partial') return 's-badge-amber';
    return 's-badge-red';
}

function InfoSection({
    title,
    items,
}: {
    title: string;
    items: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ size?: number; color?: string }>;
    }[];
}) {
    return (
        <div className="s-card" style={{ marginBottom: 12 }}>
            <div
                style={{
                    padding: '14px 20px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid rgba(26,26,46,0.06)',
                }}
            >
                {title}
            </div>
            {items.map((item, i) => (
                <div key={i} className="s-info-row">
                    <div className="s-info-label">{item.label}</div>
                    <div className="s-info-value">{item.value || '—'}</div>
                </div>
            ))}
        </div>
    );
}

export default function StudentProfile({ profile, student }: Props) {
    function handleLogout() {
        router.post(logout());
    }

    const hasStudent = !!student.nameEn;

    return (
        <StudentShell profile={profile} activePage="profile" title="My Profile">
            {/* ── Profile hero ── */}
            <div
                className="s-fade-up"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px 20px 20px',
                    textAlign: 'center',
                }}
            >
                {/* Big avatar */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <SAvatar
                        photo={student.photo ?? profile.photo}
                        name={profile.name}
                        size={88}
                        showOnline
                    />
                </div>

                <div
                    style={{
                        fontFamily: 'DM Serif Display, serif',
                        fontSize: 22,
                        color: '#1a1a2e',
                        marginBottom: 4,
                    }}
                >
                    {profile.name}
                </div>
                {profile.nameKh && (
                    <div
                        style={{
                            fontSize: 14,
                            color: '#6b7280',
                            fontFamily: 'Noto Sans Khmer, sans-serif',
                            marginBottom: 6,
                        }}
                    >
                        {profile.nameKh}
                    </div>
                )}
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {profile.code && (
                        <span className="s-badge s-badge-blue">
                            <BadgeCheck size={10} style={{ marginRight: 3 }} />
                            {profile.code}
                        </span>
                    )}
                    {profile.level && (
                        <span className="s-badge s-badge-violet">
                            {profile.level}
                        </span>
                    )}
                    {profile.className && (
                        <span className="s-badge s-badge-gray">
                            {profile.className}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Personal info ── */}
            {hasStudent && (
                <>
                    <InfoSection
                        title="Personal Information"
                        items={[
                            {
                                label: 'Gender',
                                value: student.gender
                                    ? student.gender.charAt(0).toUpperCase() +
                                      student.gender.slice(1)
                                    : '',
                            },
                            {
                                label: 'Date of Birth',
                                value: formatDate(student.dateOfBirth),
                            },
                            { label: 'Province', value: student.province },
                            { label: 'District', value: student.district },
                        ]}
                    />

                    <InfoSection
                        title="Contact"
                        items={[
                            {
                                label: 'Parent Phone',
                                value: student.parentPhone,
                            },
                            {
                                label: 'Telegram',
                                value: student.telegramUsername
                                    ? '@' + student.telegramUsername
                                    : '',
                            },
                        ]}
                    />

                    <InfoSection
                        title="Academic"
                        items={[
                            { label: 'Level', value: student.level },
                            { label: 'Class', value: student.className },
                            {
                                label: 'Enrolled On',
                                value: formatDate(student.enrolledOn),
                            },
                            {
                                label: 'Status',
                                value: student.status
                                    ? student.status.charAt(0).toUpperCase() +
                                      student.status.slice(1)
                                    : '',
                            },
                        ]}
                    />

                    <div
                        className="s-card s-fade-up s-delay-2"
                        style={{ display: 'none', marginBottom: 12 }}
                    >
                        <div
                            style={{
                                padding: '14px 20px 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderBottom: '1px solid rgba(26,26,46,0.06)',
                            }}
                        >
                            Fees
                        </div>
                        <div className="s-info-row">
                            <div className="s-info-label">Monthly Fee</div>
                            <div className="s-info-value">
                                ${student.monthlyFee.toFixed(2)}
                            </div>
                        </div>
                        {student.scholarshipAmount > 0 && (
                            <div className="s-info-row">
                                <div className="s-info-label">Scholarship</div>
                                <div
                                    className="s-info-value"
                                    style={{ color: '#059669' }}
                                >
                                    -${student.scholarshipAmount.toFixed(2)}
                                </div>
                            </div>
                        )}
                        <div className="s-info-row">
                            <div className="s-info-label">Fee Status</div>
                            <div className="s-info-value">
                                <span
                                    className={`s-badge ${feeStatusBadge(student.feeStatus)}`}
                                >
                                    {student.feeStatus
                                        ? student.feeStatus
                                              .charAt(0)
                                              .toUpperCase() +
                                          student.feeStatus.slice(1)
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!hasStudent && (
                <div
                    className="s-card s-fade-up s-delay-1"
                    style={{ marginBottom: 12 }}
                >
                    <div className="s-empty">
                        <span className="s-empty-icon">👤</span>
                        <div className="s-empty-text">
                            No student profile linked to this account
                        </div>
                    </div>
                </div>
            )}

            {/* ── Quick links ── */}
            <div
                className="s-card s-fade-up s-delay-3"
                style={{ marginBottom: 16 }}
            >
                <Link
                    href="#"
                    style={{
                        display: 'none',
                        alignItems: 'center',
                        padding: '14px 20px',
                        textDecoration: 'none',
                        borderBottom: '1px solid rgba(26,26,46,0.06)',
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1a1a2e',
                        }}
                    >
                        Fee History
                    </span>
                    <ChevronRight size={16} color="#d1d5db" />
                </Link>
                <Link
                    href={notifications()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 20px',
                        textDecoration: 'none',
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1a1a2e',
                        }}
                    >
                        Notifications
                    </span>
                    <ChevronRight size={16} color="#d1d5db" />
                </Link>
            </div>

            {/* ── Logout ── */}
            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    marginBottom: 8,
                }}
            >
                <LogOut size={16} color="#e11d48" />
                <span
                    style={{ fontSize: 14, fontWeight: 700, color: '#e11d48' }}
                >
                    Sign Out
                </span>
            </button>
        </StudentShell>
    );
}
