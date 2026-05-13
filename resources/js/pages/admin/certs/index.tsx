import { destroy, store, update } from '@/actions/App/Http/Controllers/Backends/CertificateController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminShell from '@/pages/admin/shell';
import { Avatar, Badge, KH } from '@/pages/admin/ui';
import { router, useForm } from '@inertiajs/react';
import { Award, Check, ChevronsUpDown, Edit3, Eye, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

interface CertificateItem {
    id: number;
    studentId: number;
    studentNameKh: string;
    studentNameEn: string;
    className: string;
    levelId: number | null;
    levelName: string;
    type: CertificateType;
    title: string;
    academicYear: string;
    issuedOn: string;
    certificateNumber: string;
    status: CertificateStatus;
}

interface StudentOption {
    id: number;
    nameKh: string;
    nameEn: string;
    levelId: number | null;
    level: string;
    className: string;
}

interface LevelOption {
    id: number;
    name: string;
}

interface CertificatesPageProps {
    certificates: CertificateItem[];
    students: StudentOption[];
    levels: LevelOption[];
    summary: {
        certificateCount: number;
        issuedCount: number;
        draftCount: number;
        voidCount: number;
    };
}

interface CertificateFormData {
    student_id: number | null;
    level_id: number | null;
    type: CertificateType;
    title: string;
    academic_year: string;
    issued_on: string;
    certificate_number: string;
    status: CertificateStatus;
}

type CertificateType = 'excellence' | 'merit' | 'completion' | 'participation';
type CertificateStatus = 'issued' | 'draft' | 'void';
type DrawerMode = 'create' | 'edit';

const CERT_TYPES: Record<CertificateType, { label: string; labelKh: string; color: string; bg: string }> = {
    excellence: { label: 'Academic Excellence', labelKh: 'កិត្តិយស', color: '#d97706', bg: '#fffbeb' },
    merit: { label: 'Merit Award', labelKh: 'ល្អប្រសើរ', color: '#2563eb', bg: '#eff6ff' },
    completion: { label: 'Course Completion', labelKh: 'បញ្ចប់ថ្នាក់', color: '#7c3aed', bg: '#f5f3ff' },
    participation: { label: 'Participation', labelKh: 'ការចូលរួម', color: '#059669', bg: '#ecfdf5' },
};

const statusType = {
    issued: 'green',
    draft: 'amber',
    void: 'red',
} as const;

const fieldStyle = {
    width: '100%',
    minHeight: 42,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
};

const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 800,
    color: '#64748b',
    marginBottom: 6,
};

function defaultCertificateNumber(): string {
    return `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function emptyForm(students: StudentOption[]): CertificateFormData {
    const student = students[0];

    return {
        student_id: student?.id ?? null,
        level_id: student?.levelId ?? null,
        type: 'completion',
        title: CERT_TYPES.completion.label,
        academic_year: new Date().getFullYear().toString(),
        issued_on: new Date().toISOString().slice(0, 10),
        certificate_number: defaultCertificateNumber(),
        status: 'issued',
    };
}

export default function CertificatesPage({ certificates, students, levels, summary }: CertificatesPageProps) {
    const [filter, setFilter] = useState<CertificateType | 'all'>('all');
    const [studentPickerOpen, setStudentPickerOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingCertificate, setEditingCertificate] = useState<CertificateItem | null>(null);
    const [preview, setPreview] = useState<CertificateItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CertificateItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<CertificateFormData>(emptyForm(students));

    const filteredCertificates = useMemo(
        () => filter === 'all' ? certificates : certificates.filter(certificate => certificate.type === filter),
        [certificates, filter],
    );

    const selectedStudent = useMemo(
        () => students.find(student => student.id === data.student_id) ?? null,
        [students, data.student_id],
    );

    const searchableStudents = useMemo(() => {
        const q = studentSearch.toLowerCase();

        return students.filter(student =>
            !q ||
            student.nameKh.includes(studentSearch) ||
            student.nameEn.toLowerCase().includes(q) ||
            student.className.toLowerCase().includes(q) ||
            student.level.toLowerCase().includes(q)
        );
    }, [students, studentSearch]);

    const openCreateDrawer = () => {
        reset();
        setData(emptyForm(students));
        setStudentSearch('');
        setStudentPickerOpen(false);
        setEditingCertificate(null);
        setDrawerMode('create');
    };

    const openEditDrawer = (certificate: CertificateItem) => {
        setData({
            student_id: certificate.studentId,
            level_id: certificate.levelId,
            type: certificate.type,
            title: certificate.title,
            academic_year: certificate.academicYear,
            issued_on: certificate.issuedOn,
            certificate_number: certificate.certificateNumber,
            status: certificate.status,
        });
        setStudentSearch('');
        setStudentPickerOpen(false);
        setEditingCertificate(certificate);
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setStudentSearch('');
        setStudentPickerOpen(false);
        setDrawerMode(null);
        setEditingCertificate(null);
    };

    const selectStudent = (studentId: number) => {
        const student = students.find(item => item.id === studentId);
        setData(current => ({
            ...current,
            student_id: studentId,
            level_id: student?.levelId ?? current.level_id,
        }));
        setStudentPickerOpen(false);
        setStudentSearch('');
    };

    const selectType = (type: CertificateType) => {
        setData(current => ({
            ...current,
            type,
            title: CERT_TYPES[type].label,
        }));
    };

    const submitCertificate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(drawerMode === 'edit' ? 'Certificate updated.' : 'Certificate created.');
                closeDrawer();
            },
        };

        if (drawerMode === 'edit' && editingCertificate) {
            put(update.url(editingCertificate.id), options);
            return;
        }

        post(store.url(), options);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Certificate deleted.');
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminShell>
            <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Certificates</div>
                        <KH style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>វិញ្ញាបនបត្រ · Manage issued certificates</KH>
                    </div>
                    <button onClick={openCreateDrawer} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} />
                        Add Certificate
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {[
                        { label: 'Total', value: summary.certificateCount, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Issued', value: summary.issuedCount, color: '#10b981', bg: '#f0fdf4' },
                        { label: 'Drafts', value: summary.draftCount, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Void', value: summary.voidCount, color: '#ef4444', bg: '#fff1f2' },
                    ].map(card => (
                        <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: 14, padding: 16 }}>
                            <div style={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</div>
                            <div style={{ color: card.color, opacity: 0.72, fontSize: 11 }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ id: 'all' as const, label: `All (${certificates.length})` }, ...Object.entries(CERT_TYPES).map(([id, meta]) => ({ id: id as CertificateType, label: meta.label }))].map(option => (
                        <button key={option.id} onClick={() => setFilter(option.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 800, borderColor: filter === option.id ? '#3b82f6' : '#e2e8f0', background: filter === option.id ? '#eff6ff' : 'white', color: filter === option.id ? '#2563eb' : '#64748b' }}>
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Certificate</th>
                                <th>Level</th>
                                <th>Issued On</th>
                                <th>Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '38px 24px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                                        No certificates found
                                    </td>
                                </tr>
                            ) : filteredCertificates.map(certificate => {
                                const certType = CERT_TYPES[certificate.type];
                                return (
                                    <tr key={certificate.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={certificate.studentNameEn} size={34} />
                                                <div>
                                                    <KH style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>{certificate.studentNameKh}</KH>
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{certificate.studentNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 10, background: certType.bg, color: certType.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Award size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{certificate.title}</div>
                                                    <KH style={{ fontSize: 11, color: certType.color }}>{certType.labelKh}</KH>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{certificate.levelName || certificate.className || '-'}</td>
                                        <td style={{ fontSize: 12, color: '#64748b' }}>{certificate.issuedOn}</td>
                                        <td style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{certificate.certificateNumber}</td>
                                        <td><Badge type={statusType[certificate.status]}>{certificate.status}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => setPreview(certificate)} style={actionButton('#f8fafc', '#64748b', '#e2e8f0')} title="Preview"><Eye size={14} /></button>
                                                <button onClick={() => window.print()} style={actionButton('#f0fdf4', '#16a34a', '#bbf7d0')} title="Print"><Printer size={14} /></button>
                                                <button onClick={() => openEditDrawer(certificate)} style={actionButton('#eff6ff', '#2563eb', '#bfdbfe')} title="Edit"><Edit3 size={14} /></button>
                                                <button onClick={() => setDeleteTarget(certificate)} style={actionButton('#fff1f2', '#ef4444', '#fecaca')} title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Sheet open={drawerMode !== null} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
                <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
                    {drawerMode && (
                        <form onSubmit={submitCertificate} className="flex min-h-full flex-col bg-white">
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <SheetTitle className="text-lg font-black text-slate-800">
                                    {drawerMode === 'create' ? 'Add Certificate' : 'Edit Certificate'}
                                </SheetTitle>
                                <SheetDescription>
                                    {drawerMode === 'create' ? 'Issue a certificate for a student' : editingCertificate?.certificateNumber}
                                </SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Student *</label>
                                    <SearchablePicker
                                        open={studentPickerOpen}
                                        onOpenChange={setStudentPickerOpen}
                                        search={studentSearch}
                                        onSearchChange={setStudentSearch}
                                        placeholder="Select student"
                                        searchPlaceholder="Search students..."
                                        selectedLabel={selectedStudent ? `${selectedStudent.nameEn} - ${selectedStudent.className || selectedStudent.level}` : null}
                                        emptyLabel="No students found"
                                    >
                                        {searchableStudents.map(student => {
                                            const selected = student.id === data.student_id;

                                            return (
                                                <PickerOption key={student.id} selected={selected} onClick={() => selectStudent(student.id)}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.nameEn}</span>
                                                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {student.nameKh} - {student.className || student.level}
                                                    </span>
                                                </PickerOption>
                                            );
                                        })}
                                    </SearchablePicker>
                                    {errors.student_id && <div className="field-error">{errors.student_id}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Type *</label>
                                    <Select value={data.type} onValueChange={value => selectType(value as CertificateType)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CERT_TYPES).map(([id, meta]) => <SelectItem key={id} value={id}>{meta.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <div className="field-error">{errors.type}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Status *</label>
                                    <Select value={data.status} onValueChange={value => setData('status', value as CertificateStatus)}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="issued">Issued</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="void">Void</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <div className="field-error">{errors.status}</div>}
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Title *</label>
                                    <input style={fieldStyle} value={data.title} onChange={event => setData('title', event.target.value)} />
                                    {errors.title && <div className="field-error">{errors.title}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Level</label>
                                    <Select value={data.level_id ? String(data.level_id) : 'student-level'} onValueChange={value => setData('level_id', value === 'student-level' ? null : Number(value))}>
                                        <SelectTrigger className="f-input" style={{ minHeight: 42 }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student-level">Use student level</SelectItem>
                                            {levels.map(level => <SelectItem key={level.id} value={String(level.id)}>{level.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.level_id && <div className="field-error">{errors.level_id}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Academic Year</label>
                                    <input style={fieldStyle} value={data.academic_year} onChange={event => setData('academic_year', event.target.value)} />
                                    {errors.academic_year && <div className="field-error">{errors.academic_year}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Issued On *</label>
                                    <input type="date" style={fieldStyle} value={data.issued_on} onChange={event => setData('issued_on', event.target.value)} />
                                    {errors.issued_on && <div className="field-error">{errors.issued_on}</div>}
                                </div>

                                <div>
                                    <label style={labelStyle}>Certificate No. *</label>
                                    <input style={fieldStyle} value={data.certificate_number} onChange={event => setData('certificate_number', event.target.value)} />
                                    {errors.certificate_number && <div className="field-error">{errors.certificate_number}</div>}
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', padding: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                                <button type="button" onClick={closeDrawer} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button disabled={processing} type="submit" style={{ flex: 2, background: processing ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, cursor: processing ? 'default' : 'pointer' }}>
                                    {drawerMode === 'create' ? 'Save Certificate' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {preview && <CertificatePreview certificate={preview} onClose={() => setPreview(null)} />}

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: 16 }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Delete Certificate?</div>
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Remove <strong>{deleteTarget.certificateNumber}</strong> for {deleteTarget.studentNameEn}?</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function SearchablePicker({
    open,
    onOpenChange,
    search,
    onSearchChange,
    placeholder,
    searchPlaceholder,
    selectedLabel,
    emptyLabel,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    selectedLabel: string | null;
    emptyLabel: string;
    children: ReactNode;
}) {
    const hasOptions = Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="f-input"
                    style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', cursor: 'pointer' }}
                >
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedLabel ?? placeholder}
                    </span>
                    <ChevronsUpDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        autoFocus
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#1e293b' }}
                    />
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}>
                    {hasOptions ? children : (
                        <div style={{ padding: '18px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>
                            {emptyLabel}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PickerOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ width: '100%', border: 'none', background: selected ? '#eff6ff' : 'transparent', color: '#1e293b', borderRadius: 8, padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
        >
            <Check size={15} style={{ color: selected ? '#2563eb' : 'transparent', flexShrink: 0 }} />
            <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
        </button>
    );
}

function CertificatePreview({ certificate, onClose }: { certificate: CertificateItem; onClose: () => void }) {
    const meta = CERT_TYPES[certificate.type];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 240, padding: 16 }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 0, maxWidth: 620, width: '100%', overflow: 'hidden' }}>
                <div id="certificate-preview" style={{ background: 'linear-gradient(135deg,#1e293b,#2563eb)', padding: '42px 46px', textAlign: 'center', color: 'white' }}>
                    <Award size={54} style={{ margin: '0 auto 12px', color: meta.color }} />
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', opacity: 0.62, textTransform: 'uppercase', marginBottom: 8 }}>Certificate of {meta.label}</div>
                    <KH style={{ fontSize: 18, fontWeight: 800, display: 'block', marginBottom: 18 }}>{meta.labelKh}</KH>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>This certifies that</div>
                    <KH style={{ fontSize: 30, fontWeight: 900, display: 'block', marginBottom: 4 }}>{certificate.studentNameKh}</KH>
                    <div style={{ fontSize: 17, opacity: 0.86, marginBottom: 20 }}>{certificate.studentNameEn}</div>
                    <div style={{ fontSize: 13, opacity: 0.72 }}>has received <strong>{certificate.title}</strong></div>
                    <div style={{ fontSize: 12, opacity: 0.58, marginTop: 8 }}>{certificate.levelName} · {certificate.academicYear}</div>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 22 }}>{certificate.certificateNumber} · Issued {certificate.issuedOn}</div>
                </div>
                <div style={{ padding: 22, display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                    <button onClick={() => window.print()} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, cursor: 'pointer' }}>Print Certificate</button>
                </div>
            </div>
        </div>
    );
}

function actionButton(background: string, color: string, border: string): React.CSSProperties {
    return {
        background,
        color,
        border: `1px solid ${border}`,
        borderRadius: 7,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}
