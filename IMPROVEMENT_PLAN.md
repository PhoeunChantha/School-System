# Frania English School — System Improvement Plan

> Status legend: `[ ]` Not started · `[~]` In progress · `[x]` Done

---

## Priority 1 — High Impact (Do First)

### 1. Telegram / SMS Notifications ✅
**Why:** Parents in Cambodia use Telegram daily. Email is ignored.
- [x] Set up Telegram Bot API credentials in `.env` (`TELEGRAM_BOT_TOKEN`)
- [x] Create `TelegramService` for sending messages (`app/Services/TelegramService.php`)
- [x] Trigger on: fee due reminder (`telegram:fee-reminders`), low attendance alert (`telegram:attendance-alerts`)
- [x] Add `parent_telegram_id` field to students — recorded per student in the form
- [x] Queue notifications via `SendTelegramMessage` job (3 retries, 30s backoff)
- [x] Scheduler: fee reminders every Monday 8 AM · attendance alerts every Friday 3 PM
- [ ] Trigger on grade posted (hook into GradeRecordService)
- [ ] One-click "Send Telegram" from student detail page

### 2. Bulk Attendance Entry
**Why:** Teachers waste time marking students one-by-one per session.
- [ ] Add bulk attendance UI: open class → tick all present students at once
- [ ] Mobile-friendly grid layout (teachers use phones)
- [ ] Auto-fill "absent" for unchecked students
- [ ] Optional: late / excused status per student in same screen

### 3. Teacher Login (Role-Based Access)
**Why:** Admin is a bottleneck. Teachers need their own access without seeing financial data.
- [ ] Create `teacher` role with limited permissions
- [ ] Teacher dashboard: their classes, today's lesson plan, attendance queue
- [ ] Teacher can: view own classes, mark attendance, enter grades, manage own lesson plans
- [ ] Teacher cannot: see fees, other teachers' data, system settings
- [ ] Link Teacher model to User account (add `user_id` to teachers table)

---

## Priority 2 — Medium Impact (Do Next)

### 4. Parent / Guardian Portal
**Why:** Parents want to check fees, grades, and attendance without calling the school.
- [ ] Separate auth for parents (or shareable read-only link per student)
- [ ] Parent sees: child's fee status, attendance %, recent grades, homework
- [ ] Optionally link via Telegram Bot (tap to check status)
- [ ] No editing access — view only

### 5. Student Progress Alerts (At-Risk Dashboard)
**Why:** Catch struggling students before they drop out.
- [ ] Auto-flag students: attendance < 70%, unpaid fees > 30 days, score < 40% twice in a row
- [ ] Dedicated "At-Risk" tab on dashboard with actionable list
- [ ] One-click send Telegram message to parent from alert
- [ ] Weekly summary email/notification to admin

### 6. Academic Calendar
**Why:** Admin and teachers need to see the full schedule at a glance.
- [ ] Monthly/weekly calendar view
- [ ] Show: class schedules, exam dates, lesson plans, fee due dates, holidays
- [ ] Add school holidays / events
- [ ] Teachers see only their own classes; admin sees all

### 7. Financial Reports
**Why:** Accountant needs monthly summaries without manual calculation.
- [ ] Monthly revenue report: collected vs. outstanding
- [ ] Breakdown by class and level
- [ ] Export to Excel (use `maatwebsite/excel`)
- [ ] Chart: revenue trend, collection rate by class

---

## Priority 3 — Nice to Have (Do Later)

### 8. PDF Report Card Generation
**Why:** Parents need a printable report at end of each grade period.
- [ ] Install `barryvdh/laravel-dompdf`
- [ ] Report card template: student photo, name, grades per subject, attendance %, teacher comment
- [ ] Trigger: generate when grade period is marked complete
- [ ] Download button on student detail page
- [ ] Option: bulk download all report cards as ZIP

### 9. Certificate Auto-Generation
**Why:** Staff manually make certificates — this wastes hours.
- [ ] When student passes a grade period → auto-generate certificate PDF
- [ ] Template: school logo, student name (KH + EN), level, date, director signature
- [ ] Store PDF path in `certificates` table
- [ ] Download from student detail → Certificates tab

### 10. Exam Analytics
**Why:** Teachers need to know if their class understood the lesson.
- [ ] After exam: show score distribution chart (A/B/C/D breakdown)
- [ ] Class average, highest score, lowest score
- [ ] Compare class vs. school average
- [ ] Flag if class average is below 50% (lesson may need to be re-taught)

### 11. Teacher Gradebook View
**Why:** Teachers should enter grades without going through admin menus.
- [ ] Teacher-facing gradebook: list all students in their class
- [ ] Enter score inline per student per grade period
- [ ] Save all scores in one submit
- [ ] Show who is missing a score (quick glance)

### 12. Mobile Responsive Improvements
**Why:** Staff use phones; dense tables break on small screens.
- [ ] Grades table → card view on mobile
- [ ] Exam results → card view on mobile
- [ ] Fee management → card view on mobile
- [ ] Test all pages at 375px width (iPhone SE)

---

## Technical Debt & Infrastructure

- [ ] Add rate limiting to auth routes
- [ ] Add API response caching for dashboard stats (Redis or file cache, 5-min TTL)
- [ ] Add database indexes audit (check slow queries)
- [ ] Add error monitoring (Sentry or Laravel Telescope)
- [ ] Set up automated database backups (daily, keep 7 days)
- [ ] Write basic feature tests for: student CRUD, fee payment, attendance marking

---

## Notes

- Start with **Priority 1** items — they directly remove daily pain for teachers and admin.
- Telegram integration unlocks both notifications AND the parent portal cheaply.
- Teacher login is the biggest architectural change — plan it carefully before starting.
- All PDF features require `dompdf` package + Khmer font support (use NotoSerifKhmer).
