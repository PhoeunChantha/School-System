import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { Award, CalendarDays, FileBadge, ImageOff } from 'lucide-react';

interface Certificate {
    id: number;
    title: string;
    type: string;
    academicYear: string;
    issuedOn: string;
    certificateNumber: string;
    level: string;
    className: string;
    imageUrl: string;
}

interface Summary {
    total: number;
    latestIssuedOn: string;
}

interface Props {
    profile: StudentProfile;
    summary: Summary;
    certificates: Certificate[];
}

function formatDate(date: string) {
    if (!date) return 'Not issued yet';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatType(type: string) {
    return type
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StudentCertificates({
    profile,
    summary,
    certificates,
}: Props) {
    return (
        <StudentShell
            profile={profile}
            activePage="certificates"
            title="Certificates"
        >
            <div className="s-page-header s-fade-up">
                <div
                    className="s-page-accent"
                    style={{ background: '#f5f3ff' }}
                >
                    <Award size={18} color="#7c3aed" />
                </div>
                <div>
                    <div className="s-page-title">Certificates</div>
                    <div
                        style={{
                            color: '#8a96aa',
                            fontSize: 12,
                            fontWeight: 600,
                            marginTop: 2,
                        }}
                    >
                        View-only awards from your school
                    </div>
                </div>
            </div>

            <div
                className="s-card s-card-pad s-fade-up s-delay-1"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 14,
                }}
            >
                <div>
                    <div
                        style={{
                            color: '#9ca3af',
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginBottom: 6,
                        }}
                    >
                        Issued
                    </div>
                    <div
                        style={{
                            color: '#7c3aed',
                            fontFamily: 'DM Serif Display, serif',
                            fontSize: 34,
                            lineHeight: 1,
                        }}
                    >
                        {summary.total}
                    </div>
                </div>
                <div>
                    <div
                        style={{
                            color: '#9ca3af',
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginBottom: 8,
                        }}
                    >
                        Latest
                    </div>
                    <div
                        style={{
                            color: '#1a1a2e',
                            fontSize: 13,
                            fontWeight: 800,
                            lineHeight: 1.35,
                        }}
                    >
                        {formatDate(summary.latestIssuedOn)}
                    </div>
                </div>
            </div>

            {certificates.length === 0 ? (
                <div className="s-card s-fade-up s-delay-2">
                    <div className="s-empty">
                        <span className="s-empty-icon">Certificate</span>
                        <div className="s-empty-text">
                            No certificates issued yet
                        </div>
                    </div>
                </div>
            ) : (
                certificates.map((certificate, index) => (
                    <article
                        key={certificate.id}
                        className={`s-card s-card-pad s-fade-up s-delay-${Math.min(index + 2, 5)}`}
                        style={{ marginBottom: 14 }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        color: '#1a1a2e',
                                        fontSize: 15,
                                        fontWeight: 900,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {certificate.title}
                                </div>
                                <div
                                    style={{
                                        color: '#8a96aa',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        marginTop: 3,
                                    }}
                                >
                                    {certificate.level || certificate.className}
                                </div>
                            </div>
                            <span className="s-badge s-badge-violet">
                                {formatType(certificate.type)}
                            </span>
                        </div>

                        <div
                            style={{
                                borderRadius: 16,
                                overflow: 'hidden',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                marginBottom: 12,
                            }}
                        >
                            {certificate.imageUrl ? (
                                <img
                                    src={certificate.imageUrl}
                                    alt={`${certificate.title} certificate`}
                                    draggable={false}
                                    onContextMenu={(event) =>
                                        event.preventDefault()
                                    }
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        aspectRatio: '1.414 / 1',
                                        objectFit: 'contain',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        minHeight: 160,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        color: '#94a3b8',
                                        fontWeight: 700,
                                    }}
                                >
                                    <ImageOff size={24} />
                                    Certificate image unavailable
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    minWidth: 0,
                                }}
                            >
                                <CalendarDays size={15} color="#2563eb" />
                                <span
                                    style={{
                                        color: '#475569',
                                        fontSize: 12,
                                        fontWeight: 700,
                                    }}
                                >
                                    {formatDate(certificate.issuedOn)}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    minWidth: 0,
                                }}
                            >
                                <FileBadge size={15} color="#7c3aed" />
                                <span
                                    style={{
                                        color: '#475569',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {certificate.certificateNumber}
                                </span>
                            </div>
                        </div>
                    </article>
                ))
            )}
        </StudentShell>
    );
}
