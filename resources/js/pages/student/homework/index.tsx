import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { useForm } from '@inertiajs/react';
import { BookOpen, CheckCircle, Clock, AlertTriangle, Paperclip, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface Submission {
    submitted: string;
    score: number | null;
    status: string;
    note: string;
    attachmentName: string;
    attachmentUrl: string;
}

interface Homework {
    id: number;
    routeKey: string;
    title: string;
    titleKh: string;
    instructions: string;
    points: number;
    due: string;
    status: string;
    submission: Submission | null;
}

interface Props {
    profile: StudentProfile;
    homework: Homework[];
}

type TabKey = 'all' | 'pending' | 'submitted';

function formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPastDue(d: string) {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
}

function submissionBadge(hw: Homework) {
    if (!hw.submission) {
        if (isPastDue(hw.due)) return { label: 'Missing', cls: 's-badge-red' };
        return { label: 'Pending', cls: 's-badge-amber' };
    }
    const s = hw.submission.status;
    if (s === 'graded') return { label: 'Graded', cls: 's-badge-green' };
    if (s === 'late')   return { label: 'Late',   cls: 's-badge-orange' };
    return { label: 'Submitted', cls: 's-badge-blue' };
}

export default function StudentHomework({ profile, homework }: Props) {
    const [tab, setTab] = useState<TabKey>('all');
    const [activeHw, setActiveHw] = useState<Homework | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{ note: string; attachment: File | null }>({
        note: '',
        attachment: null,
    });

    const openSubmit = (hw: Homework) => {
        reset();
        setData({ note: hw.submission?.note ?? '', attachment: null });
        setActiveHw(hw);
    };

    const closeSubmit = () => {
        setActiveHw(null);
        reset();
    };

    const submitHomework = () => {
        if (!activeHw) return;

        post(`/student/homework/${activeHw.routeKey}/submit`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Homework submitted.');
                closeSubmit();
            },
            onError: () => toast.error('Submission failed. Check the file and try again.'),
        });
    };

    const filtered = homework.filter((hw) => {
        if (tab === 'pending')   return !hw.submission;
        if (tab === 'submitted') return !!hw.submission;
        return true;
    });

    const pendingCount   = homework.filter((h) => !h.submission).length;
    const submittedCount = homework.filter((h) => !!h.submission).length;

    return (
        <StudentShell profile={profile} activePage="homework" title="Homework">
            {/* ── Page header ── */}
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#fef3c7' }}>
                    <BookOpen size={18} color="#d97706" />
                </div>
                <div className="s-page-title">Homework</div>
            </div>

            {/* ── Summary row ── */}
            <div
                className="s-fade-up s-delay-1"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}
            >
                {[
                    { label: 'Total',     val: homework.length, color: '#1a1a2e' },
                    { label: 'Pending',   val: pendingCount,   color: '#d97706' },
                    { label: 'Submitted', val: submittedCount, color: '#059669' },
                ].map((s) => (
                    <div key={s.label} className="s-card s-card-pad" style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div
                            style={{
                                fontFamily: 'DM Serif Display, serif',
                                fontSize: 28,
                                color: s.color,
                                lineHeight: 1,
                            }}
                        >
                            {s.val}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 4 }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="s-tabs s-fade-up s-delay-2">
                {[
                    { key: 'all' as TabKey,       label: `All (${homework.length})` },
                    { key: 'pending' as TabKey,   label: `Pending (${pendingCount})` },
                    { key: 'submitted' as TabKey, label: `Submitted (${submittedCount})` },
                ].map((t) => (
                    <button
                        key={t.key}
                        className={`s-tab${tab === t.key ? ' active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {filtered.length === 0 ? (
                <div className="s-card s-fade-up s-delay-3">
                    <div className="s-empty">
                        <span className="s-empty-icon">📝</span>
                        <div className="s-empty-text">No homework in this category</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-3">
                    {filtered.map((hw, i) => {
                        const badge   = submissionBadge(hw);
                        const overdue = !hw.submission && isPastDue(hw.due);
                        const iconBg  = hw.submission
                            ? hw.submission.status === 'graded' ? '#dcfce7' : '#dbeafe'
                            : overdue ? '#fee2e2' : '#fef3c7';
                        const iconColor = hw.submission
                            ? hw.submission.status === 'graded' ? '#059669' : '#2563eb'
                            : overdue ? '#e11d48' : '#d97706';

                        const isGraded = hw.submission?.status === 'graded';
                        const canSubmit = !isGraded;

                        return (
                            <div key={hw.id} className="s-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div
                                        style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 13,
                                            background: iconBg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {hw.submission?.status === 'graded' && <CheckCircle size={17} color={iconColor} />}
                                        {hw.submission && hw.submission.status !== 'graded' && <Clock size={17} color={iconColor} />}
                                        {!hw.submission && overdue && <AlertTriangle size={17} color={iconColor} />}
                                        {!hw.submission && !overdue && <BookOpen size={17} color={iconColor} />}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#1a1a2e',
                                                marginBottom: 3,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {hw.title || hw.titleKh}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: overdue && !hw.submission ? '#e11d48' : '#9ca3af',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Due {formatDate(hw.due)}
                                            {hw.points > 0 && ` · ${hw.points}pts`}
                                        </div>
                                        {hw.submission?.status === 'graded' && hw.submission.score !== null && (
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 3 }}>
                                                Score: {hw.submission.score}/{hw.points}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                        <span className={`s-badge ${badge.cls}`}>{badge.label}</span>
                                        {canSubmit && (
                                            <button
                                                type="button"
                                                onClick={() => openSubmit(hw)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    background: hw.submission ? '#eef2ff' : '#4f46e5',
                                                    color: hw.submission ? '#4f46e5' : '#fff',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    padding: '6px 12px',
                                                    fontSize: 11.5,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Upload size={12} />
                                                {hw.submission ? 'Resubmit' : 'Submit'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {(hw.submission?.attachmentUrl || hw.submission?.note) && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            flexWrap: 'wrap',
                                            marginLeft: 54,
                                            padding: '8px 12px',
                                            background: '#f8fafc',
                                            borderRadius: 10,
                                        }}
                                    >
                                        {hw.submission?.attachmentUrl && (
                                            <a
                                                href={hw.submission.attachmentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#2563eb', textDecoration: 'none', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                <Paperclip size={12} />
                                                {hw.submission.attachmentName || 'View file'}
                                            </a>
                                        )}
                                        {hw.submission?.note && (
                                            <span style={{ fontSize: 11, color: '#6b7280', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                “{hw.submission.note}”
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activeHw && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 200,
                        padding: 16,
                    }}
                    onClick={closeSubmit}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>Submit Homework</div>
                            <button type="button" onClick={closeSubmit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                            {activeHw.title || activeHw.titleKh} · Due {formatDate(activeHw.due)}
                        </div>

                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Note (optional)</label>
                        <textarea
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            rows={3}
                            placeholder="Write a note for your teacher..."
                            style={{
                                width: '100%',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 10,
                                padding: '9px 12px',
                                fontSize: 13,
                                resize: 'vertical',
                                marginBottom: errors.note ? 4 : 14,
                                boxSizing: 'border-box',
                            }}
                        />
                        {errors.note && <div style={{ fontSize: 11, color: '#e11d48', marginBottom: 12 }}>{errors.note}</div>}

                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                            Attachment (pdf, doc, docx, jpg, png · max 10MB)
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setData('attachment', e.target.files?.[0] ?? null)}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                border: '1.5px dashed #c7d2fe',
                                background: '#f5f7ff',
                                borderRadius: 10,
                                padding: '10px 12px',
                                fontSize: 13,
                                color: '#4f46e5',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: errors.attachment ? 4 : 18,
                            }}
                        >
                            <Paperclip size={14} />
                            {data.attachment
                                ? data.attachment.name
                                : activeHw.submission?.attachmentName
                                    ? `Current: ${activeHw.submission.attachmentName} (choose to replace)`
                                    : 'Choose file'}
                        </button>
                        {errors.attachment && <div style={{ fontSize: 11, color: '#e11d48', marginBottom: 14 }}>{errors.attachment}</div>}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                type="button"
                                onClick={closeSubmit}
                                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitHomework}
                                disabled={processing}
                                style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1 }}
                            >
                                {processing ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StudentShell>
    );
}
