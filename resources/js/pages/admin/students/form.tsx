import {
    store,
    index as studentIndex,
    update,
} from '@/actions/App/Http/Controllers/Backends/StudentController';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminTranslation } from '@/hooks/use-admin-translation';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Camera, Save, User, X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface LevelOption {
    id: number;
    routeKey?: string;
    name: string;
    monthly_fee: string;
}

export interface ClassOption {
    id: number;
    routeKey?: string;
    levelId: number | null;
    name: string;
    level: string | null;
    time: string;
}

export interface StudentFormData {
    id?: number;
    _method?: 'put';
    level_id: number | null;
    school_class_id: number | null;
    code: string;
    profile_photo: File | null;
    name_kh: string;
    name_en: string;
    date_of_birth: string;
    gender: 'male' | 'female' | '';
    province: string;
    district: string;
    commune: string;
    village: string;
    parent_phone: string;
    telegram_username: string;
    parent_telegram_id: string;
    monthly_fee: string | number;
    scholarship_amount: string | number;
    fee_status: 'paid' | 'unpaid' | 'partial';
    status: 'active' | 'inactive';
    enrolled_on: string;
}

export interface StudentEditData
    extends Omit<StudentFormData, 'profile_photo'> {
    routeKey?: string;
    profile_photo_url?: string | null;
}

interface StudentFormPageProps {
    mode: 'create' | 'edit';
    student?: StudentEditData;
    levels: LevelOption[];
    classes: ClassOption[];
}

const fieldGroupClass = 'grid gap-1.5';
const fieldLabelClass = 'text-[11px] font-black uppercase text-slate-500 dark:text-slate-400';
const fieldInputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export default function StudentFormPage({
    mode,
    student,
    levels,
    classes,
}: StudentFormPageProps) {
    const isEdit = mode === 'edit';
    const { translateText } = useAdminTranslation();
    const [step, setStep] = useState(1);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        student?.profile_photo_url ?? null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        data,
        setData,
        post,
        processing,
        errors,
        transform,
        setError,
        clearErrors,
    } = useForm<StudentFormData>({
            level_id: student?.level_id ?? null,
            school_class_id: student?.school_class_id ?? null,
            code: student?.code ?? '',
            profile_photo: null,
            name_kh: student?.name_kh ?? '',
            name_en: student?.name_en ?? '',
            date_of_birth: student?.date_of_birth ?? '',
            gender: student?.gender ?? '',
            province: student?.province ?? '',
            district: student?.district ?? '',
            commune: student?.commune ?? '',
            village: student?.village ?? '',
            parent_phone: student?.parent_phone ?? '',
            telegram_username: student?.telegram_username ?? '',
            parent_telegram_id: student?.parent_telegram_id ?? '',
            monthly_fee: student?.monthly_fee ?? 0,
            scholarship_amount: student?.scholarship_amount ?? 0,
            fee_status: student?.fee_status ?? 'unpaid',
            status: student?.status ?? 'active',
            enrolled_on:
                student?.enrolled_on ?? new Date().toISOString().slice(0, 10),
        });

    const filteredClasses = data.level_id
        ? classes.filter((schoolClass) => schoolClass.levelId === data.level_id)
        : classes;

    const preventNativeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    const validateStep = (targetStep: number) => {
        if (targetStep !== 2) {
            return true;
        }

        clearErrors('level_id', 'school_class_id');

        if (!data.level_id) {
            setError('level_id', translateText('Please select a level.'));
        }

        if (!data.school_class_id) {
            setError('school_class_id', translateText('Please select a class.'));
        }

        return Boolean(data.level_id && data.school_class_id);
    };

    const goNextStep = () => {
        if (!validateStep(step)) {
            return;
        }

        setStep((value) => value + 1);
    };

    const saveStudent = () => {
        if (!validateStep(2)) {
            setStep(2);

            return;
        }

        transform((formData) => ({
            ...formData,
            ...(isEdit ? { _method: 'put' as const } : {}),
            level_id: formData.level_id || null,
            school_class_id: formData.school_class_id || null,
            code: formData.code || null,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            province: formData.province || null,
            district: formData.district || null,
            commune: formData.commune || null,
            village: formData.village || null,
            parent_phone: formData.parent_phone || null,
            telegram_username: formData.telegram_username || null,
            parent_telegram_id: formData.parent_telegram_id || null,
            scholarship_amount: formData.scholarship_amount || 0,
            enrolled_on: formData.enrolled_on || null,
        }));

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    isEdit
                        ? 'Student updated successfully!'
                        : 'Student added successfully!',
                    {
                        description: isEdit
                            ? `${data.name_en} has been updated.`
                            : 'New student has been enrolled.',
                    },
                );
            },
        };

        if (isEdit && student?.id) {
            post(
                update.url((student.routeKey ?? student.id) as never),
                options,
            );

            return;
        }

        post(store.url(), options);
    };

    const inputError = (message?: string) =>
        message ? (
            <div className="mt-1 text-[11px] font-bold text-red-500">
                {message}
            </div>
        ) : null;

    return (
        <AdminShell>
            <div className="fade-in bg-slate-50 p-6 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <form
                    data-no-translate="true"
                    className="mx-auto w-full max-w-[720px] rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
                    onSubmit={preventNativeSubmit}
                >
                    <div className="mb-5 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-800/90 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${isEdit ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
                            {isEdit
                                ? translateText('Edit')
                                : translateText('Add')}
                        </div>
                        <div>
                            <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                                {isEdit
                                    ? translateText('Edit Student')
                                    : translateText('Add New Student')}
                            </div>
                            {isEdit && (
                                <div className="text-xs font-extrabold text-slate-400">
                                    {student?.name_en}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 flex items-center justify-between gap-2 rounded-[22px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/90">
                        {[1, 2, 3].map((number, index) => (
                            <div
                                key={number}
                                className={`flex min-w-0 items-center ${index < 2 ? 'flex-1' : ''}`}
                            >
                                <div
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${step >= number ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-950 dark:text-slate-500'}`}
                                >
                                    {number}
                                </div>
                                {index < 2 && (
                                    <div
                                        className={`mx-2 h-0.5 min-w-5 flex-1 rounded-full ${step > number ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-950'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div
                            className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
                        >
                            <div
                                className="col-span-full mb-1 flex flex-col items-center gap-2.5 rounded-[22px] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/90"
                            >
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-950"
                                >
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User size={36} color="#94a3b8" />
                                    )}
                                    <div
                                        className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-blue-600"
                                    >
                                        <Camera size={12} color="white" />
                                    </div>
                                </div>
                                <div
                                    className="text-center text-xs font-extrabold text-slate-400"
                                >
                                    {data.profile_photo
                                        ? data.profile_photo.name
                                        : translateText(
                                              'Click to upload profile photo',
                                          )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] ?? null;
                                        setData('profile_photo', file);
                                        setPhotoPreview(
                                            file
                                                ? URL.createObjectURL(file)
                                                : (student?.profile_photo_url ??
                                                      null),
                                        );
                                    }}
                                />
                                {inputError(
                                    errors.profile_photo as string | undefined,
                                )}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Student Code')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.code}
                                    onChange={(event) =>
                                        setData('code', event.target.value)
                                    }
                                />
                                {inputError(errors.code)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Enrolled On')}
                                </label>
                                <DatePicker
                                    className={`${fieldInputClass} flex items-center justify-start`}
                                    value={data.enrolled_on}
                                    onChange={(value) =>
                                        setData('enrolled_on', value)
                                    }
                                />
                                {inputError(errors.enrolled_on)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Khmer Name')} *
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.name_kh}
                                    onChange={(event) =>
                                        setData('name_kh', event.target.value)
                                    }
                                />
                                {inputError(errors.name_kh)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('English Name')} *
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.name_en}
                                    onChange={(event) =>
                                        setData('name_en', event.target.value)
                                    }
                                />
                                {inputError(errors.name_en)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Date of Birth')}
                                </label>
                                <DatePicker
                                    className={`${fieldInputClass} flex items-center justify-start`}
                                    value={data.date_of_birth}
                                    onChange={(value) =>
                                        setData('date_of_birth', value)
                                    }
                                    placeholder={translateText(
                                        'Pick date of birth',
                                    )}
                                />
                                {inputError(errors.date_of_birth)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Gender')}
                                </label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(value) =>
                                        setData(
                                            'gender',
                                            value as StudentFormData['gender'],
                                        )
                                    }
                                >
                                    <SelectTrigger className={fieldInputClass}>
                                        <SelectValue
                                            placeholder={translateText(
                                                'Select...',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">
                                            {translateText('Male')}
                                        </SelectItem>
                                        <SelectItem value="female">
                                            {translateText('Female')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {inputError(errors.gender)}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div
                            className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
                        >
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Level')} *
                                </label>
                                <Select
                                    value={data.level_id?.toString() ?? ''}
                                    onValueChange={(event) => {
                                        const level = levels.find(
                                            (item) => item.id === Number(event),
                                        );
                                        clearErrors(
                                            'level_id',
                                            'school_class_id',
                                        );
                                        setData((current) => ({
                                            ...current,
                                            level_id: level?.id ?? null,
                                            monthly_fee:
                                                level?.monthly_fee ??
                                                current.monthly_fee,
                                            school_class_id: null,
                                        }));
                                    }}
                                >
                                    <SelectTrigger className={fieldInputClass}>
                                        <SelectValue
                                            placeholder={translateText(
                                                'Select level...',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map((level) => (
                                            <SelectItem
                                                key={level.id}
                                                value={level.id.toString()}
                                            >
                                                {level.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {inputError(errors.level_id)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Class')} *
                                </label>
                                <Select
                                    value={
                                        data.school_class_id?.toString() ?? ''
                                    }
                                    onValueChange={(event) => {
                                        clearErrors('school_class_id');
                                        setData(
                                            'school_class_id',
                                            event ? Number(event) : null,
                                        );
                                    }}
                                >
                                    <SelectTrigger className={fieldInputClass}>
                                        <SelectValue
                                            placeholder={translateText(
                                                'Select class...',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses.map((schoolClass) => (
                                            <SelectItem
                                                key={schoolClass.id}
                                                value={schoolClass.id.toString()}
                                            >
                                                {schoolClass.name}{' '}
                                                {schoolClass.time
                                                    ? `(${schoolClass.time})`
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {inputError(errors.school_class_id)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Scholarship Amount')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldInputClass}
                                    value={data.scholarship_amount}
                                    min={0}
                                    onChange={(event) =>
                                        setData(
                                            'scholarship_amount',
                                            event.target.value,
                                        )
                                    }
                                />
                                {inputError(errors.scholarship_amount)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Status')}
                                </label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData(
                                            'status',
                                            value as StudentFormData['status'],
                                        )
                                    }
                                >
                                    <SelectTrigger className={fieldInputClass}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            {translateText('Active')}
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            {translateText('Inactive')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {inputError(errors.status)}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div
                            className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
                        >
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Province')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.province}
                                    onChange={(event) =>
                                        setData('province', event.target.value)
                                    }
                                />
                                {inputError(errors.province)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('District')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.district}
                                    onChange={(event) =>
                                        setData('district', event.target.value)
                                    }
                                />
                                {inputError(errors.district)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Commune')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.commune}
                                    onChange={(event) =>
                                        setData('commune', event.target.value)
                                    }
                                />
                                {inputError(errors.commune)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Village')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.village}
                                    onChange={(event) =>
                                        setData('village', event.target.value)
                                    }
                                />
                                {inputError(errors.village)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Parent Phone')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.parent_phone}
                                    onChange={(event) =>
                                        setData(
                                            'parent_phone',
                                            event.target.value,
                                        )
                                    }
                                />
                                {inputError(errors.parent_phone)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Telegram Username')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.telegram_username}
                                    onChange={(event) =>
                                        setData(
                                            'telegram_username',
                                            event.target.value,
                                        )
                                    }
                                />
                                {inputError(errors.telegram_username)}
                            </div>
                            <div className={fieldGroupClass}>
                                <label className={fieldLabelClass}>
                                    {translateText('Parent Telegram Chat ID')}
                                </label>
                                <input
                                    className={fieldInputClass}
                                    value={data.parent_telegram_id}
                                    onChange={(event) =>
                                        setData(
                                            'parent_telegram_id',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. 123456789"
                                />
                                <div
                                    className="mt-1 text-[11px] font-bold text-slate-400"
                                >
                                    {translateText(
                                        'Numeric ID from Telegram. Parent must message the school bot first to get their ID.',
                                    )}
                                </div>
                                {inputError(errors.parent_telegram_id)}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 max-md:sticky max-md:bottom-[74px] max-md:z-10 max-md:rounded-[22px] max-md:border max-md:border-slate-200 max-md:bg-white/90 max-md:p-2 max-md:shadow-[0_18px_42px_rgba(15,23,42,0.14)] max-md:backdrop-blur dark:max-md:border-slate-700 dark:max-md:bg-slate-900/90">
                        <Link
                            href={studentIndex.url()}
                            className="inline-flex min-h-12 flex-[1_1_140px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm font-black text-slate-500 no-underline dark:bg-slate-950 dark:text-slate-300"
                        >
                            <X size={16} /> {translateText('Cancel')}
                        </Link>
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep((value) => value - 1)}
                                className="inline-flex min-h-12 flex-[1_1_140px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 p-3 text-sm font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                            >
                                <ArrowLeft size={16} /> {translateText('Back')}
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={goNextStep}
                                className="inline-flex min-h-12 flex-[2_1_180px] items-center justify-center gap-1.5 rounded-2xl bg-blue-600 p-3 text-sm font-black text-white"
                            >
                                {translateText('Next')} <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={saveStudent}
                                disabled={processing}
                                className={`inline-flex min-h-12 flex-[2_1_180px] items-center justify-center gap-1.5 rounded-2xl p-3 text-sm font-black text-white disabled:opacity-70 ${isEdit ? 'bg-blue-600' : 'bg-emerald-600'}`}
                            >
                                <Save size={16} />{' '}
                                {processing
                                    ? translateText('Saving...')
                                    : isEdit
                                      ? translateText('Update Student')
                                      : translateText('Save Student')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}

