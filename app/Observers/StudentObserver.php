<?php

namespace App\Observers;

use App\Models\Student;
use App\Services\Backends\StudentEnrollmentHistoryService;

class StudentObserver
{
    public function __construct(
        private readonly StudentEnrollmentHistoryService $historyService,
    ) {}

    /**
     * Handle the Student "created" event.
     */
    public function created(Student $student): void
    {
        $this->historyService->recordCreated($student);
    }

    /**
     * Handle the Student "updated" event.
     */
    public function updated(Student $student): void
    {
        $this->historyService->recordUpdated($student);
    }

    /**
     * Handle the Student "deleted" event.
     */
    public function deleted(Student $student): void
    {
        $this->historyService->recordDeleted($student);
    }
}
