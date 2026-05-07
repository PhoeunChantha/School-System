import HomeworkFormPage, { HomeworkClassOption, HomeworkFormData } from './form';

interface EditHomeworkPageProps {
    homework: HomeworkFormData;
    classes: HomeworkClassOption[];
}

export default function EditHomeworkPage({ homework, classes }: EditHomeworkPageProps) {
    return <HomeworkFormPage mode="edit" homework={homework} classes={classes} />;
}
