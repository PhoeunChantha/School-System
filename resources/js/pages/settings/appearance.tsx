import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import AdminShell from '@/pages/admin/shell';
import { type BreadcrumbItem } from '@/types';

import { useAdminTranslation } from '@/hooks/use-admin-translation';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const { t } = useAdminTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.appearance.breadcrumb'),
            href: editAppearance().url,
        },
    ];

    return (
        <AdminShell breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearance.head_title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.appearance.title')}
                        description={t('settings.appearance.description')}
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AdminShell>
    );
}
