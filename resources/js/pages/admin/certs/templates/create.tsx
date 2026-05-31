import { index as certIndex, storeTemplate } from '@/actions/App/Http/Controllers/Backends/CertificateController';
import AdminShell from '@/pages/admin/shell';
import { CertificateCanvasPreview, CertificateLayout, defaultCertificateLayout, Field, fieldInputClass, FileDrop } from '@/pages/admin/certs/components/certificate-form-ui';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Save, Upload, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CertificateTemplateFormData {
    name: string;
    template_image: File | null;
    logo_image: File | null;
    is_active: boolean;
    layout: CertificateLayout;
}

export default function CreateCertificateTemplatePage() {
    const [templatePreviewUrl, setTemplatePreviewUrl] = useState('');
    const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
    const { data, setData, post, processing, errors, transform } = useForm<CertificateTemplateFormData>({
        name: '',
        template_image: null,
        logo_image: null,
        is_active: true,
        layout: defaultCertificateLayout,
    });

    useEffect(() => {
        if (!data.template_image) return;

        const objectUrl = URL.createObjectURL(data.template_image);
        setTemplatePreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.template_image]);

    useEffect(() => {
        if (!data.logo_image) return;

        const objectUrl = URL.createObjectURL(data.logo_image);
        setLogoPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.logo_image]);

    const updateLayout = (key: keyof CertificateLayout, value: string) => {
        setData(current => ({
            ...current,
            layout: {
                ...current.layout,
                [key]: value,
            },
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform(formData => formData);
        post(storeTemplate.url(), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success('Template created.'),
        });
    };

    return (
        <AdminShell>
            <div className="fade-in bg-slate-50 p-4 dark:bg-slate-950 max-md:bg-[radial-gradient(circle_at_100%_0,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] max-md:px-2.5 max-md:py-3 max-md:pb-[calc(104px+env(safe-area-inset-bottom))] dark:max-md:bg-[radial-gradient(circle_at_100%_0,rgba(96,165,250,0.14),transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                <div className="mb-3 hidden items-center justify-between gap-3 md:flex md:flex-wrap">
                    <div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">Add Certificate Template</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-400">Upload a reusable background and text layout</div>
                    </div>
                    <Link href={certIndex.url()} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowLeft size={15} /> Back
                    </Link>
                </div>

                <form onSubmit={submit} className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/90 md:grid md:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)] md:p-6">
                    <section className="md:col-span-2 flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                        <div>
                            <span className="block text-xs font-black text-slate-400">Certificate template</span>
                            <strong className="mt-1 block text-2xl font-black text-slate-900 dark:text-slate-50">Add Template</strong>
                            <p className="mt-1 text-xs font-extrabold text-slate-400">Create once, then assign it from Add Certificate.</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)]">
                            <ImagePlus size={20} />
                        </div>
                    </section>

                    <div className="grid content-start gap-3 md:grid-cols-2">
                        <Field label="Template name *" error={errors.name} wide>
                            <input className={fieldInputClass} value={data.name} onChange={event => setData('name', event.target.value)} placeholder="e.g. Completion certificate" />
                        </Field>

                        <Field label="Template image *" error={errors.template_image} wide>
                            <FileDrop
                                icon={ImagePlus}
                                label={templatePreviewUrl ? 'Replace certificate background' : 'Upload certificate background'}
                                description="JPG, PNG, or WebP template image"
                                onChange={file => setData('template_image', file)}
                            />
                        </Field>

                        <Field label="Logo image" error={errors.logo_image} wide>
                            <FileDrop
                                icon={Upload}
                                label={logoPreviewUrl ? 'Replace certificate logo' : 'Upload certificate logo'}
                                description="Optional logo shown on the certificate"
                                onChange={file => setData('logo_image', file)}
                            />
                        </Field>

                        <Field label="Heading" error={errors['layout.heading']}>
                            <input className={fieldInputClass} value={data.layout.heading} onChange={event => updateLayout('heading', event.target.value)} />
                        </Field>

                        <Field label="Presented line" error={errors['layout.presented_to']}>
                            <input className={fieldInputClass} value={data.layout.presented_to} onChange={event => updateLayout('presented_to', event.target.value)} />
                        </Field>

                        <Field label="Certificate body" error={errors['layout.body']} wide>
                            <textarea className={`${fieldInputClass} min-h-28 resize-none`} value={data.layout.body} onChange={event => updateLayout('body', event.target.value)} />
                        </Field>

                        <Field label="Grade / award text" error={errors['layout.grade']}>
                            <input className={fieldInputClass} value={data.layout.grade} onChange={event => updateLayout('grade', event.target.value)} />
                        </Field>

                        <Field label="Director name" error={errors['layout.director_name']}>
                            <input className={fieldInputClass} value={data.layout.director_name} onChange={event => updateLayout('director_name', event.target.value)} />
                        </Field>

                        <Field label="Teacher signature label" error={errors['layout.teacher_signature']}>
                            <input className={fieldInputClass} value={data.layout.teacher_signature} onChange={event => updateLayout('teacher_signature', event.target.value)} />
                        </Field>

                        <Field label="Director signature label" error={errors['layout.director_signature']}>
                            <input className={fieldInputClass} value={data.layout.director_signature} onChange={event => updateLayout('director_signature', event.target.value)} />
                        </Field>

                        <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            <input type="checkbox" checked={data.is_active} onChange={event => setData('is_active', event.target.checked)} className="h-4 w-4 accent-blue-600" />
                            Active template
                        </label>
                    </div>

                    <div className="grid content-start gap-3">
                        <CertificateCanvasPreview
                            title={data.layout.grade}
                            studentName="Student name"
                            levelName="Course level"
                            issuedOn={new Date().toISOString().slice(0, 10)}
                            certificateNumber="CERT-PREVIEW"
                            layout={data.layout}
                            templateImageUrl={templatePreviewUrl}
                            logoImageUrl={logoPreviewUrl}
                        />

                        <div className="grid grid-cols-[1fr_2fr] gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/70">
                            <Link href={certIndex.url()} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-500 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
                                <X size={15} /> Cancel
                            </Link>
                            <button disabled={processing} type="submit" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-500 disabled:cursor-default disabled:bg-blue-300">
                                <Save size={15} /> Save Template
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}
