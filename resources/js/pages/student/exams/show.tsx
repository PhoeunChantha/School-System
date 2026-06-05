import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { exams } from '@/routes/student';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    Clock,
    FileText,
    Paperclip,
    Trophy,
} from 'lucide-react';

interface ExamResult {
    score: number;
    maxScore: number;
    status: string;
    note: string;
}

interface ExamDetail {
    id: number;
    routeKey: string;
    title: string;
    subject: string;
    academicYear: string;
    date: string;
    duration: number;
    status: string;
    content: string;
    attachmentUrl: string;
    attachmentName: string;
    result: ExamResult | null;
}

interface Props {
    profile: StudentProfile;
    exam: ExamDetail;
}

function formatDate(date: string) {
    if (!date) {
        return '';
    }

    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function examState(date: string) {
    if (!date) {
        return 'Scheduled';
    }

    return new Date(date).getTime() < Date.now() ? 'Past' : 'Upcoming';
}

function scorePercent(result: ExamResult) {
    if (result.maxScore === 0) {
        return 0;
    }

    return Math.round((result.score / result.maxScore) * 100);
}

function resultBadgeClass(status: string) {
    if (status === 'passed') {
        return 's-badge s-badge-green';
    }

    if (status === 'failed') {
        return 's-badge s-badge-red';
    }

    return 's-badge s-badge-gray';
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return (
        <div className="student-detail-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

export default function StudentExamShow({ profile, exam }: Props) {
    const result = exam.result;

    return (
        <StudentShell profile={profile} activePage="exams" title={exam.title}>
            <div className="s-page-header s-fade-up">
                <Link
                    href={exams()}
                    className="student-detail-back"
                    aria-label="Back to exams"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div className="s-page-accent">
                    <FileText size={18} />
                </div>
                <div className="s-page-title">Exam Detail</div>
            </div>

            <div className="s-card s-card-pad s-fade-up s-delay-1 student-detail-card">
                <div className="student-detail-kicker">
                    {exam.subject || 'Exam'}
                </div>
                <div className="student-detail-heading">{exam.title}</div>
                <div className="student-detail-meta-grid">
                    <div>
                        <CalendarDays size={16} />
                        <span>{formatDate(exam.date) || 'No date'}</span>
                    </div>
                    <div>
                        <Clock size={16} />
                        <span>{exam.duration} min</span>
                    </div>
                    <div>
                        <CheckCircle size={16} />
                        <span>{examState(exam.date)}</span>
                    </div>
                </div>

                <DetailRow label="Academic year" value={exam.academicYear} />
                <DetailRow label="Status" value={exam.status} />

                {exam.content && (
                    <div className="student-detail-section">
                        <span>Details</span>
                        <div
                            className="student-detail-message"
                            dangerouslySetInnerHTML={{ __html: exam.content }}
                        />
                    </div>
                )}

                {exam.attachmentUrl && (
                    <a
                        href={exam.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="student-detail-file"
                    >
                        <Paperclip size={15} />
                        {exam.attachmentName || 'View attachment'}
                    </a>
                )}
            </div>

            {result ? (
                <div className="s-card s-card-pad s-fade-up s-delay-2 student-detail-card">
                    <div className="student-detail-kicker">Your Result</div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    color: 'var(--student-ink)',
                                    fontFamily:
                                        'DM Serif Display, Georgia, serif',
                                    fontSize: 44,
                                    lineHeight: 1,
                                }}
                            >
                                {scorePercent(result)}%
                            </div>
                            <div className="student-detail-time">
                                {result.score}/{result.maxScore} points
                            </div>
                        </div>
                        <span className={resultBadgeClass(result.status)}>
                            <Trophy size={12} />
                            {result.status || 'Graded'}
                        </span>
                    </div>

                    {result.note && (
                        <div className="student-detail-section">
                            <span>Teacher Note</span>
                            <p>{result.note}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="s-card s-card-pad s-fade-up s-delay-2 student-detail-card">
                    <div className="student-detail-kicker">Result</div>
                    <div className="student-detail-message">
                        Your score is not available yet.
                    </div>
                </div>
            )}
        </StudentShell>
    );
}
