import { store } from '@/actions/App/Http/Controllers/Backends/GradePeriodController';
import GradePeriodForm, { type GradePeriodFormData } from '@/pages/admin/grade-periods/form';

interface CreateGradePeriodPageProps {
    defaults: GradePeriodFormData;
}

export default function CreateGradePeriodPage({ defaults }: CreateGradePeriodPageProps) {
    return (
        <GradePeriodForm
            defaults={defaults}
            mode="create"
            submitUrl={store.url()}
            title="Create Grade Period"
        />
    );
}
