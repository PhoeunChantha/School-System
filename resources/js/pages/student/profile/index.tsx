import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import StudentShell, {
    type StudentProfile,
    SAvatar,
} from '@/pages/student/shell';
import { logout } from '@/routes';
import { notifications } from '@/routes/student';
import { update as updateStudentProfile } from '@/routes/student/profile';
import { Link, router, useForm } from '@inertiajs/react';
import {
    BadgeCheck,
    ChevronRight,
    LogOut,
    Pencil,
    Save,
    Upload,
    X,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

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

interface ProfileFormData {
    _method: 'put';
    profile_photo: File | null;
    date_of_birth: string;
    province: string;
    district: string;
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
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors, reset } =
        useForm<ProfileFormData>({
            _method: 'put',
            profile_photo: null,
            date_of_birth: student.dateOfBirth || '',
            province: student.province || '',
            district: student.district || '',
        });

    function handleLogout() {
        router.post(logout());
    }

    const hasStudent = !!student.nameEn;

    function openEditProfile() {
        setData({
            _method: 'put',
            profile_photo: null,
            date_of_birth: student.dateOfBirth || '',
            province: student.province || '',
            district: student.district || '',
        });
        setPhotoPreview(null);
        setIsEditOpen(true);
    }

    function closeEditProfile() {
        reset();
        setPhotoPreview(null);
        setIsEditOpen(false);
    }

    function updateProfilePhoto(file: File | null) {
        setData('profile_photo', file);

        if (!file) {
            setPhotoPreview(null);

            return;
        }

        setPhotoPreview(URL.createObjectURL(file));
    }

    function submitProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        post(updateStudentProfile.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                setIsEditOpen(false);
            },
        });
    }

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
                    {hasStudent && (
                        <button
                            type="button"
                            onClick={openEditProfile}
                            style={{
                                display: 'inline-flex',
                                flexBasis: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                marginTop: 16,
                                padding: '10px 16px',
                                borderRadius: 999,
                                border: '1px solid rgba(16,185,129,0.22)',
                                background: 'rgba(236,253,245,0.92)',
                                color: '#047857',
                                fontSize: 13,
                                fontWeight: 800,
                                boxShadow:
                                    '0 10px 24px rgba(16,185,129,0.12)',
                            }}
                        >
                            <Pencil size={14} />
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* ── Personal info ── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="!left-1/2 !w-[400px] !max-w-[calc(100vw-50px)] !translate-x-[-52%] overflow-hidden rounded-[22px] border-slate-200 bg-white p-0 text-slate-950 shadow-2xl sm:!max-w-[calc(100vw-50px)]">
                    <form onSubmit={submitProfile}>
                        <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left">
                            <DialogTitle className="text-xl font-black tracking-normal text-slate-950">
                                Edit Profile
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-500">
                                Update your personal information.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 px-5 py-4">
                            <div className="flex items-center gap-3 rounded-[18px] bg-slate-50 p-3">
                                <SAvatar
                                    photo={
                                        photoPreview ??
                                        student.photo ??
                                        profile.photo
                                    }
                                    name={profile.name}
                                    size={52}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-black uppercase text-slate-500">
                                        Profile Image
                                    </div>
                                    <label
                                        htmlFor="student-profile-photo"
                                        className="mt-1 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-white px-3 text-xs font-black text-emerald-700 shadow-sm ring-1 ring-slate-200"
                                    >
                                        <Upload size={14} />
                                        Change Photo
                                    </label>
                                    <input
                                        id="student-profile-photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        className="sr-only"
                                        onChange={(event) =>
                                            updateProfilePhoto(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.profile_photo}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="student-date-of-birth"
                                    className="mb-1.5 block text-[11px] font-black uppercase tracking-normal text-slate-500"
                                >
                                    Date of Birth
                                </label>
                                <input
                                    id="student-date-of-birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(event) =>
                                        setData(
                                            'date_of_birth',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-100"
                                />
                                <InputError
                                    message={errors.date_of_birth}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="student-province"
                                    className="mb-1.5 block text-[11px] font-black uppercase tracking-normal text-slate-500"
                                >
                                    Province
                                </label>
                                <input
                                    id="student-province"
                                    type="text"
                                    value={data.province}
                                    onChange={(event) =>
                                        setData('province', event.target.value)
                                    }
                                    className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-100"
                                    placeholder="Enter province"
                                />
                                <InputError
                                    message={errors.province}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="student-district"
                                    className="mb-1.5 block text-[11px] font-black uppercase tracking-normal text-slate-500"
                                >
                                    District
                                </label>
                                <input
                                    id="student-district"
                                    type="text"
                                    value={data.district}
                                    onChange={(event) =>
                                        setData('district', event.target.value)
                                    }
                                    className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-100"
                                    placeholder="Enter district"
                                />
                                <InputError
                                    message={errors.district}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <DialogFooter className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={closeEditProfile}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={16} />
                                Save
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
