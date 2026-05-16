import StudentFormPage, { ClassOption, LevelOption, StudentFormData } from '@/pages/admin/students/form';

interface EditStudentPageProps {
    student: StudentFormData;
    levels: LevelOption[];
    classes: ClassOption[];
}

export default function EditStudentPage({ student, levels, classes }: EditStudentPageProps) {
    return <StudentFormPage mode="edit" student={student} levels={levels} classes={classes} />;
}



