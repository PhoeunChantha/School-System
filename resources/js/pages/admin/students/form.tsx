import { FormEvent, useRef, useState } from 'react';
import { index as studentIndex, store, update } from '@/actions/App/Http/Controllers/Backends/StudentController';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/pages/admin/shell';
import { Link, useForm } from '@inertiajs/react';
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';

export interface LevelOption {
    id: number;
    name: string;
    monthly_fee: string;
}

export interface ClassOption {
    id: number;
    levelId: number | null;
    name: string;
    level: string | null;
    time: string;
}

export interface StudentFormData {
    id?: number;
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
    monthly_fee: string | number;
    scholarship_amount: string | number;
    fee_status: 'paid' | 'unpaid' | 'partial';
    status: 'active' | 'inactive';
    enrolled_on: string;
}

export interface StudentEditData extends Omit<StudentFormData, 'profile_photo'> {
    profile_photo_url?: string | null;
}

interface StudentFormPageProps {
    mode: 'create' | 'edit';
    student?: StudentEditData;
    levels: LevelOption[];
    classes: ClassOption[];
}

export default function StudentFormPage({ mode, student, levels, classes }: StudentFormPageProps) {
    const isEdit = mode === 'edit';
    const [step, setStep] = useState(1);
    const [photoPreview, setPhotoPreview] = useState<string | null>(student?.profile_photo_url ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, put, processing, errors, transform } = useForm<StudentFormData>({
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
        monthly_fee: student?.monthly_fee ?? 0,
        scholarship_amount: student?.scholarship_amount ?? 0,
        fee_status: student?.fee_status ?? 'unpaid',
        status: student?.status ?? 'active',
        enrolled_on: student?.enrolled_on ?? new Date().toISOString().slice(0, 10),
    });

    const filteredClasses = data.level_id
        ? classes.filter(schoolClass => schoolClass.levelId === data.level_id)
        : classes;

    const selectedLevel = levels.find(level => level.id === data.level_id);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => ({
            ...formData,
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
            scholarship_amount: formData.scholarship_amount || 0,
            enrolled_on: formData.enrolled_on || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isEdit ? 'Student updated successfully!' : 'Student added successfully!', {
                    description: isEdit ? `${data.name_en} has been updated.` : 'New student has been enrolled.',
                });
            },
        };

        if (isEdit && student?.id) {
            put(update.url(student.id), options);

            return;
        }

        post(store.url(), options);
    };

    const inputError = (message?: string) => message ? <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{message}</div> : null;

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24 }}>
                <form className="card" onSubmit={submit} style={{ padding: 28, maxWidth: 720, width: '100%', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: isEdit ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {isEdit ? 'Edit' : 'Add'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{isEdit ? 'Edit Student' : 'Add New Student'}</div>
                            {isEdit && <div style={{ fontSize: 12, color: '#94a3b8' }}>{student?.name_en}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                        {[1, 2, 3].map((number, index) => (
                            <div key={number} style={{ display: 'flex', alignItems: 'center', flex: index < 2 ? 1 : undefined, minWidth: 0 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= number ? '#2563eb' : '#f1f5f9', color: step >= number ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{number}</div>
                                {index < 2 && <div style={{ flex: 1, minWidth: 20, height: 2, background: step > number ? '#2563eb' : '#f1f5f9', margin: '0 8px' }} />}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ width: 96, height: 96, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0 }}
                                >
                                    {photoPreview
                                        ? <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <User size={36} color="#94a3b8" />
                                    }
                                    <div style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={12} color="white" />
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                                    {data.profile_photo ? data.profile_photo.name : 'Click to upload profile photo'}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={event => {
                                        const file = event.target.files?.[0] ?? null;
                                        setData('profile_photo', file);
                                        setPhotoPreview(file ? URL.createObjectURL(file) : (student?.profile_photo_url ?? null));
                                    }}
                                />
                                {inputError(errors.profile_photo as string | undefined)}
                            </div>
                            <div className="f-group"><label className="f-label">Student Code</label><input className="f-input" value={data.code} onChange={event => setData('code', event.target.value)} />{inputError(errors.code)}</div>
                            <div className="f-group"><label className="f-label">Enrolled On</label><DatePicker value={data.enrolled_on} onChange={value => setData('enrolled_on', value)} />{inputError(errors.enrolled_on)}</div>
                            <div className="f-group"><label className="f-label">ឈ្មោះ (ខ្មែរ) *</label><input className="f-input" value={data.name_kh} onChange={event => setData('name_kh', event.target.value)} />{inputError(errors.name_kh)}</div>
                            <div className="f-group"><label className="f-label">English Name *</label><input className="f-input" value={data.name_en} onChange={event => setData('name_en', event.target.value)} />{inputError(errors.name_en)}</div>
                            <div className="f-group"><label className="f-label">Date of Birth</label><DatePicker value={data.date_of_birth} onChange={value => setData('date_of_birth', value)} placeholder="Pick date of birth" />{inputError(errors.date_of_birth)}</div>
                            <div className="f-group">
                                <label className="f-label">Gender</label>
                                <Select value={data.gender} onValueChange={value => setData('gender', value as StudentFormData['gender'])}>
                                    <SelectTrigger className="f-input">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                {inputError(errors.gender)}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                            <div className="f-group">
                                <label className="f-label">Level *</label>
                                <Select value={data.level_id?.toString() ?? ''} onValueChange={event => {
                                    const level = levels.find(item => item.id === Number(event));
                                    setData(current => ({ ...current, level_id: level?.id ?? null, monthly_fee: level?.monthly_fee ?? current.monthly_fee, school_class_id: null }));
                                }}>
                                    <SelectTrigger className="f-input">
                                        <SelectValue placeholder="Select level..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map(level => (
                                            <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {inputError(errors.level_id)}
                            </div>
                            <div className="f-group">
                                <label className="f-label">Class *</label>
                                <Select value={data.school_class_id?.toString() ?? ''} onValueChange={event => setData('school_class_id', event ? Number(event) : null)}>
                                    <SelectTrigger className="f-input">
                                        <SelectValue placeholder="Select class..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses.map(schoolClass => (
                                            <SelectItem key={schoolClass.id} value={schoolClass.id.toString()}>{schoolClass.name} {schoolClass.time ? `(${schoolClass.time})` : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {inputError(errors.school_class_id)}
                            </div>
                            <div className="f-group"><label className="f-label">Monthly Fee</label><input type="number" className="f-input" value={data.monthly_fee} min={0} onChange={event => setData('monthly_fee', event.target.value)} />{selectedLevel && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Level default: ${selectedLevel.monthly_fee}</div>}{inputError(errors.monthly_fee)}</div>
                            <div className="f-group"><label className="f-label">Scholarship Amount</label><input type="number" className="f-input" value={data.scholarship_amount} min={0} onChange={event => setData('scholarship_amount', event.target.value)} />{inputError(errors.scholarship_amount)}</div>
                            <div className="f-group">
                                <label className="f-label">Fee Status</label>
                                <Select value={data.fee_status} onValueChange={value => setData('fee_status', value as StudentFormData['fee_status'])}>
                                    <SelectTrigger className="f-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                                {inputError(errors.fee_status)}
                            </div>
                            <div className="f-group">
                                <label className="f-label">Status</label>
                                <Select value={data.status} onValueChange={value => setData('status', value as StudentFormData['status'])}>
                                    <SelectTrigger className="f-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {inputError(errors.status)}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                            <div className="f-group"><label className="f-label">Province</label><input className="f-input" value={data.province} onChange={event => setData('province', event.target.value)} />{inputError(errors.province)}</div>
                            <div className="f-group"><label className="f-label">District</label><input className="f-input" value={data.district} onChange={event => setData('district', event.target.value)} />{inputError(errors.district)}</div>
                            <div className="f-group"><label className="f-label">Commune</label><input className="f-input" value={data.commune} onChange={event => setData('commune', event.target.value)} />{inputError(errors.commune)}</div>
                            <div className="f-group"><label className="f-label">Village</label><input className="f-input" value={data.village} onChange={event => setData('village', event.target.value)} />{inputError(errors.village)}</div>
                            <div className="f-group"><label className="f-label">Parent Phone</label><input className="f-input" value={data.parent_phone} onChange={event => setData('parent_phone', event.target.value)} />{inputError(errors.parent_phone)}</div>
                            <div className="f-group"><label className="f-label">Telegram Username</label><input className="f-input" value={data.telegram_username} onChange={event => setData('telegram_username', event.target.value)} />{inputError(errors.telegram_username)}</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                        <Link href={studentIndex.url()} style={{ flex: '1 1 140px', textAlign: 'center', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>Cancel</Link>
                        {step > 1 && <button type="button" onClick={() => setStep(value => value - 1)} style={{ flex: '1 1 140px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer' }}>Back</button>}
                        {step < 3
                            ? <button type="button" onClick={() => setStep(value => value + 1)} style={{ flex: '2 1 180px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Next</button>
                            : <button type="submit" disabled={processing} style={{ flex: '2 1 180px', background: isEdit ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{processing ? 'Saving...' : isEdit ? 'Update Student' : 'Save Student'}</button>
                        }
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
