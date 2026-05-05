export interface Grade {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

export interface Student {
    id: number;
    nameKh: string;
    nameEn: string;
    level: string;
    cls: string;
    attendance: number;
    fees: 'Paid' | 'Unpaid' | 'Partial';
    amt: number;
    grade: Grade;
    village: string;
    province: string;
}

export interface Teacher {
    id: number;
    nameKh: string;
    nameEn: string;
    subject: string;
    classes: number;
    students: number;
    phone: string;
    status: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    teacher: string;
    time: string;
    room: string;
    count: number;
    days: string;
}

export interface Payment {
    id: number;
    nameKh: string;
    nameEn: string;
    amount: number;
    method: string;
    date: string;
    status: string;
    month: string;
}

export interface Homework {
    id: number;
    titleKh: string;
    titleEn: string;
    cls: string;
    due: string;
    done: number;
    total: number;
}

export const STUDENTS: Student[] = [
    { id: 1, nameKh: 'សុខ ដារា',    nameEn: 'Sokh Dara',     level: 'Intermediate 2', cls: 'Intermediate 2', attendance: 92, fees: 'Paid',    amt: 25, grade: { speaking: 82, listening: 75, reading: 88, writing: 70 }, village: 'Kampong Trabek', province: 'Prey Veng' },
    { id: 2, nameKh: 'ចាន់ ស្រីណា', nameEn: 'Chan Sreyna',   level: 'Beginner 1',     cls: 'Beginner 1',     attendance: 78, fees: 'Unpaid',  amt: 25, grade: { speaking: 65, listening: 70, reading: 60, writing: 55 }, village: 'Baray',          province: 'Kampong Thom' },
    { id: 3, nameKh: 'លី សុភី',     nameEn: 'Ly Sophy',      level: 'Advanced 1',     cls: 'Advanced 1',     attendance: 97, fees: 'Paid',    amt: 30, grade: { speaking: 90, listening: 92, reading: 88, writing: 85 }, village: 'Stung Trang',    province: 'Kampong Cham' },
    { id: 4, nameKh: 'ហេង វណ្ណៈ',   nameEn: 'Heng Vanna',    level: 'Intermediate 1', cls: 'Intermediate 1', attendance: 65, fees: 'Partial', amt: 25, grade: { speaking: 55, listening: 60, reading: 50, writing: 45 }, village: 'Ponhea Kraek',   province: 'Kampong Cham' },
    { id: 5, nameKh: 'ឃីង មករា',    nameEn: 'Khing Makara',  level: 'Beginner 2',     cls: 'Beginner 2',     attendance: 88, fees: 'Paid',    amt: 20, grade: { speaking: 72, listening: 68, reading: 74, writing: 65 }, village: 'Prey Veng',      province: 'Prey Veng' },
    { id: 6, nameKh: 'ទូច ចន្ទ',    nameEn: 'Touch Chantha', level: 'Intermediate 2', cls: 'Intermediate 2', attendance: 45, fees: 'Unpaid',  amt: 25, grade: { speaking: 40, listening: 45, reading: 38, writing: 42 }, village: 'Memot',          province: 'Kampong Cham' },
    { id: 7, nameKh: 'ម៉ែន ពិសី',   nameEn: 'Men Pisey',     level: 'Beginner 1',     cls: 'Beginner 1',     attendance: 83, fees: 'Paid',    amt: 25, grade: { speaking: 70, listening: 65, reading: 72, writing: 68 }, village: 'Kampong Cham',   province: 'Kampong Cham' },
    { id: 8, nameKh: 'រ័ត្ន បញ្ញា',  nameEn: 'Roth Panha',    level: 'Advanced 1',     cls: 'Advanced 1',     attendance: 91, fees: 'Paid',    amt: 30, grade: { speaking: 85, listening: 88, reading: 83, writing: 80 }, village: 'Siem Reap',      province: 'Siem Reap' },
];

export const TEACHERS: Teacher[] = [
    { id: 1, nameKh: 'គ្រូ វុទ្ធី', nameEn: 'Mr. Vuthy', subject: 'English Grammar', classes: 3, students: 55, phone: '012-345-678', status: 'active' },
    { id: 2, nameKh: 'គ្រូ រ៉ាណី', nameEn: 'Ms. Rani',   subject: 'Conversation',    classes: 4, students: 72, phone: '017-234-567', status: 'active' },
    { id: 3, nameKh: 'គ្រូ ពៅ',    nameEn: 'Mr. Pov',    subject: 'Writing Skills',  classes: 2, students: 30, phone: '096-123-456', status: 'active' },
];

export const CLASSES: SchoolClass[] = [
    { id: 1, name: 'Beginner 1',     teacher: 'Mr. Vuthy', time: '07:30–09:00', room: 'A1', count: 18, days: 'Mon Wed Fri' },
    { id: 2, name: 'Beginner 2',     teacher: 'Ms. Rani',  time: '09:15–10:45', room: 'A2', count: 20, days: 'Mon Wed Fri' },
    { id: 3, name: 'Intermediate 1', teacher: 'Mr. Pov',   time: '14:00–15:30', room: 'B1', count: 22, days: 'Tue Thu Sat' },
    { id: 4, name: 'Intermediate 2', teacher: 'Ms. Rani',  time: '15:45–17:15', room: 'B2', count: 19, days: 'Tue Thu Sat' },
    { id: 5, name: 'Advanced 1',     teacher: 'Mr. Vuthy', time: '07:30–09:00', room: 'C1', count: 15, days: 'Mon Wed Fri' },
];

export const PAYMENTS: Payment[] = [
    { id: 1, nameKh: 'សុខ ដារា',  nameEn: 'Sokh Dara',    amount: 25,   method: 'ABA',    date: '2026-05-03', status: 'verified', month: 'May 2026' },
    { id: 2, nameKh: 'លី សុភី',   nameEn: 'Ly Sophy',     amount: 30,   method: 'ACLEDA', date: '2026-05-03', status: 'verified', month: 'May 2026' },
    { id: 3, nameKh: 'ឃីង មករា',  nameEn: 'Khing Makara', amount: 20,   method: 'Wing',   date: '2026-05-02', status: 'pending',  month: 'May 2026' },
    { id: 4, nameKh: 'ហេង វណ្ណៈ', nameEn: 'Heng Vanna',   amount: 12.5, method: 'Cash',   date: '2026-04-28', status: 'partial',  month: 'May 2026' },
    { id: 5, nameKh: 'ម៉ែន ពិសី',  nameEn: 'Men Pisey',    amount: 25,   method: 'ABA',    date: '2026-05-01', status: 'verified', month: 'May 2026' },
];

export const HOMEWORK: Homework[] = [
    { id: 1, titleKh: 'សរសេរអំពីគ្រួសារ',      titleEn: 'Write about your family',   cls: 'Beginner 1',     due: '2026-05-06', done: 12, total: 18 },
    { id: 2, titleKh: 'Present Perfect លំហាត់', titleEn: 'Present Perfect exercises', cls: 'Intermediate 2', due: '2026-05-08', done: 8,  total: 22 },
    { id: 3, titleKh: 'អានអត្ថបទ និងឆ្លើយ',    titleEn: 'Read & answer questions',   cls: 'Advanced 1',     due: '2026-05-11', done: 14, total: 15 },
];

export const avg = (s: Student): number =>
    Math.round(Object.values(s.grade).reduce((a, b) => a + b, 0) / 4);
