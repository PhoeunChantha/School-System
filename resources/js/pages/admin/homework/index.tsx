import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { CLASSES, HOMEWORK, type Homework } from '@/pages/admin/data';
import AdminShell from '@/pages/admin/shell';
import { Badge, KH, PBar } from '@/pages/admin/ui';
import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

type DrawerMode = 'add' | 'edit';

type HomeworkFormData = {
    titleKh: string;
    titleEn: string;
    cls: string;
    due: string;
    points: number;
    instructions: string;
};

const emptyForm = (): HomeworkFormData => ({
    titleKh: '',
    titleEn: '',
    cls: CLASSES[0]?.name ?? '',
    due: '',
    points: 100,
    instructions: '',
});

const formFromHomework = (homework: Homework): HomeworkFormData => ({
    titleKh: homework.titleKh,
    titleEn: homework.titleEn,
    cls: homework.cls,
    due: homework.due,
    points: 100,
    instructions: '',
});

const drawerGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};

const drawerLabelStyle: CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
};

const drawerFieldStyle: CSSProperties = {
    width: '100%',
    minHeight: 42,
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1e293b',
};

export default function HomeworkPage() {
    const [homework, setHomework] = useState<Homework[]>(HOMEWORK);
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(
        null,
    );
    const [form, setForm] = useState<HomeworkFormData>(() => emptyForm());
    const [submissionTarget, setSubmissionTarget] = useState<Homework | null>(
        null,
    );

    const totalAssigned = homework.length;
    const totalSubmissions = useMemo(
        () => homework.reduce((sum, item) => sum + item.done, 0),
        [homework],
    );

    const openAssignDrawer = () => {
        setEditingHomework(null);
        setForm(emptyForm());
        setDrawerMode('add');
    };

    const openEditDrawer = (item: Homework) => {
        setEditingHomework(item);
        setForm(formFromHomework(item));
        setDrawerMode('edit');
    };

    const closeDrawer = () => {
        setDrawerMode(null);
        setEditingHomework(null);
    };

    const saveHomework = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.titleKh.trim() || !form.cls || !form.due) {
            toast.error('Please complete the required homework fields.');
            return;
        }

        if (drawerMode === 'edit' && editingHomework) {
            setHomework((items) =>
                items.map((item) =>
                    item.id === editingHomework.id
                        ? {
                              ...item,
                              titleKh: form.titleKh.trim(),
                              titleEn: form.titleEn.trim(),
                              cls: form.cls,
                              due: form.due,
                          }
                        : item,
                ),
            );
            toast.success('Homework updated.', {
                description: form.titleEn || form.titleKh,
            });
            closeDrawer();
            return;
        }

        const selectedClass = CLASSES.find(
            (schoolClass) => schoolClass.name === form.cls,
        );
        setHomework((items) => [
            {
                id: Math.max(0, ...items.map((item) => item.id)) + 1,
                titleKh: form.titleKh.trim(),
                titleEn: form.titleEn.trim(),
                cls: form.cls,
                due: form.due,
                done: 0,
                total: selectedClass?.count ?? 0,
            },
            ...items,
        ]);
        toast.success('Homework assigned.', {
            description: form.titleEn || form.titleKh,
        });
        closeDrawer();
    };

    return (
        <AdminShell>
            <div
                className="fade-in"
                style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 18,
                                color: '#1e293b',
                            }}
                        >
                            Homework List
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: '#94a3b8',
                                marginTop: 2,
                            }}
                        >
                            {totalAssigned} assigned · {totalSubmissions}{' '}
                            submissions received
                        </div>
                    </div>

                    <button
                        onClick={openAssignDrawer}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            padding: '9px 18px',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        + Assign New
                    </button>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {homework.map((item) => {
                        const completion =
                            item.total > 0 ? item.done / item.total : 0;

                        return (
                            <div
                                key={item.id}
                                className="card"
                                style={{ padding: 20 }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 10,
                                        marginBottom: 12,
                                    }}
                                >
                                    <div>
                                        <KH
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 16,
                                                display: 'block',
                                                marginBottom: 2,
                                            }}
                                        >
                                            {item.titleKh}
                                        </KH>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: '#64748b',
                                            }}
                                        >
                                            {item.titleEn ||
                                                'Untitled homework'}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: '#94a3b8',
                                                marginTop: 4,
                                            }}
                                        >
                                            {item.cls} · Due {item.due}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 800,
                                                color: '#1e293b',
                                            }}
                                        >
                                            {item.done}/{item.total}
                                        </span>
                                        <Badge
                                            type={
                                                item.done === item.total
                                                    ? 'green'
                                                    : 'blue'
                                            }
                                        >
                                            submitted
                                        </Badge>
                                    </div>
                                </div>

                                <PBar
                                    value={item.done}
                                    max={item.total}
                                    color={completion >= 0.8 ? 'green' : 'blue'}
                                    height={8}
                                />

                                <div
                                    style={{
                                        marginTop: 12,
                                        display: 'flex',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            setSubmissionTarget(item)
                                        }
                                        style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            padding: '6px 14px',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#64748b',
                                        }}
                                    >
                                        View Submissions
                                    </button>
                                    <button
                                        onClick={() => openEditDrawer(item)}
                                        style={{
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: 8,
                                            padding: '6px 14px',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#2563eb',
                                        }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Sheet
                open={drawerMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDrawer();
                    }
                }}
            >
                <SheetContent
                    side="right"
                    className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[460px]"
                >
                    {drawerMode && (
                        <>
                            <SheetHeader className="border-b border-slate-200 px-6 py-5 text-left">
                                <div className="flex items-center gap-3 pr-8">
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 10,
                                            background:
                                                drawerMode === 'add'
                                                    ? '#eff6ff'
                                                    : '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 20,
                                        }}
                                    >
                                        {drawerMode === 'add' ? '📝' : '✏️'}
                                    </div>
                                    <div>
                                        <SheetTitle>
                                            {drawerMode === 'add'
                                                ? 'Assign Homework'
                                                : 'Edit Homework'}
                                        </SheetTitle>
                                        <SheetDescription>
                                            {drawerMode === 'add'
                                                ? 'Create a new class assignment'
                                                : editingHomework?.titleEn}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <form
                                onSubmit={saveHomework}
                                style={{
                                    padding: 24,
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 16,
                                }}
                            >
                                <div
                                    style={{
                                        ...drawerGroupStyle,
                                        gridColumn: '1/-1',
                                    }}
                                >
                                    <label style={drawerLabelStyle}>
                                        Title (Khmer) *
                                    </label>
                                    <input
                                        style={drawerFieldStyle}
                                        value={form.titleKh}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                titleKh: event.target.value,
                                            }))
                                        }
                                        placeholder="ឧ. សរសេរអំពីគ្រួសារ"
                                    />
                                </div>

                                <div
                                    style={{
                                        ...drawerGroupStyle,
                                        gridColumn: '1/-1',
                                    }}
                                >
                                    <label style={drawerLabelStyle}>
                                        Title (English)
                                    </label>
                                    <input
                                        style={drawerFieldStyle}
                                        value={form.titleEn}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                titleEn: event.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Write about family"
                                    />
                                </div>

                                <div style={drawerGroupStyle}>
                                    <label style={drawerLabelStyle}>
                                        Class *
                                    </label>
                                    <select
                                        style={drawerFieldStyle}
                                        value={form.cls}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                cls: event.target.value,
                                            }))
                                        }
                                    >
                                        {CLASSES.map((schoolClass) => (
                                            <option key={schoolClass.id}>
                                                {schoolClass.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={drawerGroupStyle}>
                                    <label style={drawerLabelStyle}>
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        style={drawerFieldStyle}
                                        value={form.due}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                due: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div style={drawerGroupStyle}>
                                    <label style={drawerLabelStyle}>
                                        Points
                                    </label>
                                    <input
                                        type="number"
                                        style={drawerFieldStyle}
                                        min={1}
                                        value={form.points}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                points: Number(
                                                    event.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                </div>

                                <div
                                    style={{
                                        ...drawerGroupStyle,
                                        gridColumn: '1/-1',
                                    }}
                                >
                                    <label style={drawerLabelStyle}>
                                        Instructions
                                    </label>
                                    <textarea
                                        style={{
                                            ...drawerFieldStyle,
                                            minHeight: 118,
                                            resize: 'vertical',
                                        }}
                                        rows={5}
                                        value={form.instructions}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                instructions:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="Additional instructions..."
                                    />
                                </div>

                                <div
                                    style={{
                                        gridColumn: '1/-1',
                                        display: 'flex',
                                        gap: 10,
                                        paddingTop: 8,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={closeDrawer}
                                        style={{
                                            flex: 1,
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            border: 'none',
                                            borderRadius: 10,
                                            padding: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            flex: 2,
                                            background: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 10,
                                            padding: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontFamily:
                                                "'Noto Sans Khmer',sans-serif",
                                        }}
                                    >
                                        {drawerMode === 'add'
                                            ? 'Assign Homework'
                                            : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {submissionTarget && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 210,
                        background: 'rgba(15,23,42,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setSubmissionTarget(null);
                        }
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 18,
                            padding: 24,
                            maxWidth: 440,
                            width: '100%',
                            boxShadow: '0 24px 60px rgba(15,23,42,0.2)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <KH
                                    style={{
                                        display: 'block',
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: '#1e293b',
                                    }}
                                >
                                    {submissionTarget.titleKh}
                                </KH>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginTop: 4,
                                    }}
                                >
                                    {submissionTarget.cls} · Due{' '}
                                    {submissionTarget.due}
                                </div>
                            </div>
                            <button
                                onClick={() => setSubmissionTarget(null)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginTop: 20 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#334155',
                                    marginBottom: 8,
                                }}
                            >
                                <span>Submitted</span>
                                <span>
                                    {submissionTarget.done}/
                                    {submissionTarget.total}
                                </span>
                            </div>
                            <PBar
                                value={submissionTarget.done}
                                max={submissionTarget.total}
                                color={
                                    submissionTarget.done /
                                        submissionTarget.total >=
                                    0.8
                                        ? 'green'
                                        : 'blue'
                                }
                                height={10}
                            />
                        </div>

                        <div
                            style={{
                                marginTop: 18,
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: 14,
                                color: '#64748b',
                                fontSize: 13,
                                lineHeight: 1.5,
                            }}
                        >
                            {submissionTarget.total - submissionTarget.done}{' '}
                            students are still pending. Use the class roster to
                            follow up with missing submissions.
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
