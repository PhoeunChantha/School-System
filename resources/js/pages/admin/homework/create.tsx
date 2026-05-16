import HomeworkFormPage, { HomeworkClassOption } from './form';

interface CreateHomeworkPageProps {
    classes: HomeworkClassOption[];
}

export default function CreateHomeworkPage({ classes }: CreateHomeworkPageProps) {
    return <HomeworkFormPage mode="create" classes={classes} />;
}



