<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('period')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('marked_at')->nullable();
            $table->timestamps();

            $table->unique(['school_class_id', 'attendance_date', 'period'], 'att_sessions_class_date_period_unique');
            $table->index(['attendance_date', 'school_class_id'], 'att_sessions_date_class_index');
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('present');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['attendance_session_id', 'student_id'], 'att_records_session_student_unique');
            $table->index(['student_id', 'status'], 'att_records_student_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');
    }
};
