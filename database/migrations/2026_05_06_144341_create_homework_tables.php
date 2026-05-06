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
        Schema::create('homework_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->string('title_kh');
            $table->string('title_en')->nullable();
            $table->text('instructions')->nullable();
            $table->unsignedSmallInteger('points')->default(100);
            $table->date('due_on')->index();
            $table->string('academic_year')->nullable()->index();
            $table->string('status')->default('assigned')->index();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['school_class_id', 'due_on']);
        });

        Schema::create('homework_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('homework_assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedSmallInteger('score')->nullable();
            $table->string('status')->default('pending')->index();
            $table->text('feedback')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['homework_assignment_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homework_submissions');
        Schema::dropIfExists('homework_assignments');
    }
};
