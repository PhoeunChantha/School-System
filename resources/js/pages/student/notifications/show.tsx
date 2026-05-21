import StudentShell, { type StudentProfile } from '@/pages/student/shell';
import { homework, notifications } from '@/routes/student';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    CheckCircle,
    Clock,
    FileText,
    Paperclip,
} from 'lucide-react';

interface NotificationDetail {
    id: number;
    routeKey: string;
    category: string;
    title: string;
    body: string;
    severity: string;
    read: boolean;
    createdAt: string;
}

interface HomeworkDetail {
    type: 'homework';
    routeKey: string;
    title: string;
    titleKh: string;
    instructions: string;
    points: number;
    due: string;
    status: string;
    attachmentName: string;
    attachmentUrl: string;
    submission: {
        submitted: string;
        score: number | null;
        status: string;
        note: string;
        attachmentName: string;
        attachmentUrl: string;
    } | null;
}

interface LessonPlanDetail {
    type: 'lesson_plan';
    title: string;
    lessonDate: string;
    teacher: string;
    objective: string;
    content: string;
    materials: string;
    homework: string;
    status: string;
}

interface Props {
    profile: StudentProfile;
    notification: NotificationDetail;
    detail: HomeworkDetail | LessonPlanDetail | null;
}

function formatDate(date: string) {
    if (!date) {
        return '';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
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

export default function StudentNotificationShow({
    profile,
    notification,
    detail,
}: Props) {
    const isHomework = detail?.type === 'homework';

    return (
        <StudentShell
            profile={profile}
            activePage="notifications"
            title="Message"
        >
            <div className="s-page-header s-fade-up">
                <Link
                    href={notifications()}
                    className="student-detail-back"
                    aria-label="Back to messages"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div
                    className="s-page-accent"
                    style={{ background: isHomework ? '#fef3c7' : '#dbeafe' }}
                >
                    {isHomework ? (
                        <BookOpen size={18} color="#d97706" />
                    ) : (
                        <FileText size={18} color="#2563eb" />
                    )}
                </div>
                <div className="s-page-title">Message</div>
            </div>

            <div className="s-card s-card-pad s-fade-up s-delay-1 student-detail-card">
                <div className="student-detail-kicker">
                    {notification.title}
                </div>
                <div className="student-detail-message">
                    {notification.body}
                </div>
                <div className="student-detail-time">
                    {formatDate(notification.createdAt)}
                </div>
            </div>

            {!detail && (
                <div className="s-card s-card-pad s-fade-up s-delay-2 student-detail-card">
                    <div className="student-detail-message">
                        This message has no extra details.
                    </div>
                </div>
            )}

            {detail?.type === 'homework' && (
                <div className="s-card s-card-pad s-fade-up s-delay-2 student-detail-card">
                    <div className="student-detail-heading">{detail.title}</div>
                    {detail.titleKh && (
                        <div className="student-detail-subtitle">
                            {detail.titleKh}
                        </div>
                    )}

                    <div className="student-detail-meta-grid">
                        <div>
                            <CalendarDays size={16} />
                            <span>Due {formatDate(detail.due)}</span>
                        </div>
                        <div>
                            <CheckCircle size={16} />
                            <span>{detail.points} pts</span>
                        </div>
                        <div>
                            <Clock size={16} />
                            <span>
                                {detail.submission?.status ?? 'Pending'}
                            </span>
                        </div>
                    </div>

                    {detail.instructions && (
                        <div className="student-detail-section">
                            <span>Instructions</span>
                            <p>{detail.instructions}</p>
                        </div>
                    )}

                    {detail.attachmentUrl && (
                        <a
                            href={detail.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="student-detail-file"
                        >
                            <Paperclip size={15} />
                            {detail.attachmentName || 'View attachment'}
                        </a>
                    )}

                    {detail.submission && (
                        <div className="student-detail-section">
                            <span>Your Submission</span>
                            <DetailRow
                                label="Status"
                                value={detail.submission.status}
                            />
                            <DetailRow
                                label="Submitted"
                                value={formatDate(detail.submission.submitted)}
                            />
                            <DetailRow
                                label="Score"
                                value={
                                    detail.submission.score !== null
                                        ? `${detail.submission.score}/${detail.points}`
                                        : ''
                                }
                            />
                            {detail.submission.note && (
                                <p>{detail.submission.note}</p>
                            )}
                        </div>
                    )}

                    <Link href={homework()} className="student-detail-primary">
                        Open Homework
                    </Link>
                </div>
            )}

            {detail?.type === 'lesson_plan' && (
                <div className="s-card s-card-pad s-fade-up s-delay-2 student-detail-card">
                    <div className="student-detail-heading">{detail.title}</div>
                    <div className="student-detail-meta-grid">
                        <div>
                            <CalendarDays size={16} />
                            <span>{formatDate(detail.lessonDate)}</span>
                        </div>
                        <div>
                            <CheckCircle size={16} />
                            <span>{detail.status}</span>
                        </div>
                    </div>

                    <DetailRow label="Teacher" value={detail.teacher} />

                    <div className="student-detail-section">
                        <span>Objective</span>
                        <p>{detail.objective || 'No objective added.'}</p>
                    </div>
                    <div className="student-detail-section">
                        <span>Lesson Content</span>
                        <p>{detail.content || 'No lesson content added.'}</p>
                    </div>
                    <div className="student-detail-section">
                        <span>Materials</span>
                        <p>{detail.materials || 'No materials added.'}</p>
                    </div>
                    <div className="student-detail-section">
                        <span>Homework</span>
                        <p>{detail.homework || 'No lesson homework added.'}</p>
                    </div>
                </div>
            )}
        </StudentShell>
    );
}
