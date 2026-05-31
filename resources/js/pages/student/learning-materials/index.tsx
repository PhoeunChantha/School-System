import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { BookOpen, ExternalLink, FileText, Library } from 'lucide-react';

interface Material {
    id: string;
    title: string;
    type: string;
    date: string;
    description: string;
    fileName: string;
    fileUrl: string;
    hasFile: boolean;
}

interface Props {
    profile: StudentProfile;
    summary: {
        total: number;
        files: number;
    };
    materials: Material[];
}

function formatDate(date: string) {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export default function StudentLearningMaterials({
    profile,
    summary,
    materials,
}: Props) {
    return (
        <StudentShell
            profile={profile}
            activePage="learning-materials"
            title="Learning Materials"
        >
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#ecfdf5' }}>
                    <Library size={18} color="#059669" />
                </div>
                <div>
                    <div className="s-page-title">Learning Materials</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Homework files, exam files, and lesson notes
                    </div>
                </div>
            </div>

            <div className="s-card s-card-pad s-fade-up s-delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                    <div style={{ color: '#059669', fontSize: 30, fontWeight: 950, lineHeight: 1 }}>{summary.total}</div>
                    <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800, marginTop: 4 }}>Materials</div>
                </div>
                <div>
                    <div style={{ color: '#2563eb', fontSize: 30, fontWeight: 950, lineHeight: 1 }}>{summary.files}</div>
                    <div style={{ color: '#8a96aa', fontSize: 11, fontWeight: 800, marginTop: 4 }}>Files</div>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="s-card">
                    <div className="s-empty">
                        <span className="s-empty-icon">Materials</span>
                        <div className="s-empty-text">No learning materials yet</div>
                    </div>
                </div>
            ) : (
                <div className="s-card s-fade-up s-delay-2">
                    {materials.map((material) => (
                        <div key={material.id} className="s-list-item" style={{ alignItems: 'flex-start' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 14, background: material.hasFile ? '#dbeafe' : '#ecfdf5', color: material.hasFile ? '#2563eb' : '#059669', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                {material.hasFile ? <FileText size={17} /> : <BookOpen size={17} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 900 }}>
                                        {material.title}
                                    </span>
                                    <span className="s-badge s-badge-blue">{material.type}</span>
                                </div>
                                {material.description && (
                                    <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginTop: 5, lineHeight: 1.4 }}>
                                        {material.description}
                                    </div>
                                )}
                                <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                                    {formatDate(material.date)}
                                </div>
                            </div>
                            {material.fileUrl && (
                                <a
                                    href={material.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Open ${material.fileName}`}
                                    style={{ color: '#2563eb', padding: 8 }}
                                >
                                    <ExternalLink size={17} />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </StudentShell>
    );
}
