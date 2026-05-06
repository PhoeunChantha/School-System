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
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('subject')->nullable();
            $table->string('academic_year')->nullable()->index();
            $table->date('exam_date')->nullable()->index();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->json('content')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('status')->default('draft')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_class_id', 'exam_date']);
        });

        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('max_score', 5, 2)->default(100);
            $table->string('status')->default('pending')->index();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['exam_id', 'student_id']);
            $table->index(['student_id', 'score']);
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->string('title');
            $table->string('academic_year')->nullable()->index();
            $table->date('issued_on');
            $table->string('certificate_number')->unique();
            $table->string('status')->default('issued')->index();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'issued_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('exam_results');
        Schema::dropIfExists('exams');
    }
};
