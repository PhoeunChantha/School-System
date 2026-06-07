import { update } from '@/actions/App/Http/Controllers/Backends/GradePeriodController';
import GradePeriodForm, { type GradePeriodFormData } from '@/pages/admin/grade-periods/form';

interface GradePeriod {
    routeKey?: string;
    id: number;
    name: string;
    type: GradePeriodFormData['type'];
    academicYear: string;
    startsOn: string;
    endsOn: string;
    isCurrent: boolean;
}

interface EditGradePeriodPageProps {
    period: GradePeriod;
}

export default function EditGradePeriodPage({ period }: EditGradePeriodPageProps) {
    return (
        <GradePeriodForm
            defaults={{
                name: period.name,
                type: period.type,
                academic_year: period.academicYear,
                starts_on: period.startsOn,
                ends_on: period.endsOn,
                is_current: period.isCurrent,
            }}
            mode="edit"
            submitUrl={update.url((period.routeKey ?? period.id) as never)}
            title="Edit Grade Period"
        />
    );
}
