# Frania School Management System

A comprehensive School Management System built for Frania English School to streamline academic, administrative, financial, and communication processes.

The platform provides dedicated portals for administrators, teachers, students, and parents, allowing the school to manage daily operations from a single centralized system.

---

## About The Project

Frania School Management System is designed to digitize school operations and improve communication between the school, teachers, students, and parents.

The system helps manage:

- Student enrollment and records
- Teacher management
- Class and level management
- Attendance tracking
- Academic grading
- Homework and lesson planning
- School fees and payments
- Exams and certificates
- Notifications and communication
- Parent access and monitoring

## Main Features

- Admin dashboard for school overview and operations.
- Student, teacher, class, level, attendance, grade, homework, lesson plan, exam, certificate, fee, expense, and report management.
- Role and permission based access control for admin, teacher, and student users.
- Student Portal as a PWA with install support, school branding, web push subscriptions, and realtime alerts.
- Parent portal access by parent phone number through SMS access links.
- Laravel Reverb realtime notifications for in-app alerts.
- Web Push support for browser and OS notifications when supported by the device/browser.
- Configurable school settings, logos, favicon, notification options, login lockout options, mail, SMS gateway, and appearance.
- Import/export support for several admin modules.
- Grade Period management for monthly, term, and final grading periods.

## Technology Stack

- Backend: Laravel 13, PHP 8.4
- Auth: Laravel Fortify
- Frontend: React 19, Inertia.js 2, TypeScript
- Styling: Tailwind CSS 4, Radix UI, Lucide icons
- Build: Vite
- Realtime: Laravel Reverb, Laravel Echo
- Push: `minishlink/web-push`
- Permissions: Spatie Laravel Permission
- Testing: PHPUnit 12
- Formatting: Laravel Pint, Prettier, ESLint

## Portals

### Admin

Admin routes are under `/admin/*`.

Admins manage:

- Students and linked user accounts
- Teachers
- Classes and levels
- Attendance
- Grade records and grade periods
- Homework and homework submissions
- Lesson plans
- Fees and payments
- Expenses
- Exams and exam results
- Certificates
- Notifications
- Reports and honor roll
- System settings
- Users, roles, and permissions

### Teacher

Teacher access is permission based and supports teaching workflows such as:

- Attendance
- Teacher grade entry
- Lesson plans
- Homework and submissions
- Exams and results

### Student Portal

Student routes are under `/student/*`.

The Student Portal is designed as the PWA experience. It includes:

- Dashboard
- Attendance
- Grades
- Homework submission
- Exams
- Certificates
- Notifications
- Profile

### Parent Portal

Parent access is designed around a private SMS access link. A parent enters the phone number saved in the student profile, and the system sends an expiring access link if the phone number matches a student record.

## Realtime And Notifications

The app uses Laravel Reverb for realtime in-app alerts. For closed-app notifications, the Student PWA uses Web Push subscriptions where the browser and operating system support it.

Important notification related environment/configuration areas:

- Reverb app credentials
- Web Push VAPID keys
- Queue worker
- Browser notification permissions
- Student push subscriptions
- Admin notification sound setting for in-app alerts

## SMS Gateway

Parent portal access can use PlasGate SMS credentials from system settings. The gateway requires valid API credentials and provider-side allowance for the production domain or server IP.

## License

This project is proprietary software developed for Frania English School.

© 2026 Frania English School. All rights reserved.