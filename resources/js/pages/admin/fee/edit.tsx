import FeeChargeFormPage, { FeeChargeFormData, FeeStudentOption } from './form';

interface EditFeeChargePageProps {
    charge: FeeChargeFormData;
    students: FeeStudentOption[];
}

export default function EditFeeChargePage({ charge, students }: EditFeeChargePageProps) {
    return <FeeChargeFormPage mode="edit" charge={charge} students={students} />;
}
