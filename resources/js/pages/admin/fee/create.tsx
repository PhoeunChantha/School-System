import FeeChargeFormPage, { FeeStudentOption } from './form';

interface CreateFeeChargePageProps {
    students: FeeStudentOption[];
}

export default function CreateFeeChargePage({ students }: CreateFeeChargePageProps) {
    return <FeeChargeFormPage mode="create" students={students} />;
}



