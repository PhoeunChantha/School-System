import StudentShell, { SAvatar, type StudentProfile } from '@/pages/student/shell';
import { IdCard } from 'lucide-react';

interface StudentCard {
    name: string;
    nameKh: string;
    code: string;
    photo: string | null;
    level: string;
    className: string;
    gender: string;
    enrolledOn: string;
}

interface Props {
    profile: StudentProfile;
    student: StudentCard;
}

function patternBits(value: string) {
    const source = value || 'student';
    const bits: boolean[] = [];

    for (let i = 0; i < 121; i += 1) {
        const code = source.charCodeAt(i % source.length);
        bits.push(((code + i * 7 + source.length) % 5) < 2);
    }

    return bits;
}

export default function StudentIdCard({ profile, student }: Props) {
    const bits = patternBits(student.code || profile.name);

    return (
        <StudentShell profile={profile} activePage="id-card" title="Student ID Card">
            <div className="s-page-header s-fade-up">
                <div className="s-page-accent" style={{ background: '#dbeafe' }}>
                    <IdCard size={18} color="#2563eb" />
                </div>
                <div>
                    <div className="s-page-title">Student ID Card</div>
                    <div style={{ color: '#8a96aa', fontSize: 12, fontWeight: 700 }}>
                        Digital school identity
                    </div>
                </div>
            </div>

            <section
                className="s-card s-card-pad s-fade-up s-delay-1"
                style={{
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #061827 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    position: 'relative',
                }}
            >
                <div style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.72, textTransform: 'uppercase' }}>
                                Frania English School
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 950, marginTop: 4 }}>
                                Student ID
                            </div>
                        </div>
                        <SAvatar photo={student.photo ?? profile.photo} name={student.name || profile.name} size={58} />
                    </div>

                    <div style={{ fontSize: 24, fontWeight: 950, lineHeight: 1.12 }}>
                        {student.name || profile.name}
                    </div>
                    {student.nameKh && (
                        <div style={{ fontSize: 13, opacity: 0.78, fontWeight: 700, marginTop: 4 }}>
                            {student.nameKh}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 104px', gap: 16, marginTop: 22, alignItems: 'end' }}>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {[
                                ['Code', student.code],
                                ['Class', student.className],
                                ['Level', student.level],
                                ['Enrolled', student.enrolledOn],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 10, opacity: 0.62, fontWeight: 900, textTransform: 'uppercase' }}>
                                        {label}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 900, marginTop: 2 }}>
                                        {value || '-'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: 18, padding: 9 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 2 }}>
                                {bits.map((bit, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: 2,
                                            background: bit ? '#061827' : '#ffffff',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </StudentShell>
    );
}
