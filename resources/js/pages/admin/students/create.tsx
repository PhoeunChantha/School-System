import StudentFormPage, { ClassOption, LevelOption } from '@/pages/admin/students/form';

interface CreateStudentPageProps {
    levels: LevelOption[];
    classes: ClassOption[];
}

export default function CreateStudentPage({ levels, classes }: CreateStudentPageProps) {
    return <StudentFormPage mode="create" levels={levels} classes={classes} />;
}



