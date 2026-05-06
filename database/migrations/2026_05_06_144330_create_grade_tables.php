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
        Schema::create('grade_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('monthly');
            $table->string('academic_year')->nullable()->index();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_current')->default(false)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['name', 'type', 'academic_year']);
        });

        Schema::create('grade_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('speaking')->default(0);
            $table->unsignedTinyInteger('listening')->default(0);
            $table->unsignedTinyInteger('reading')->default(0);
            $table->unsignedTinyInteger('writing')->default(0);
            $table->decimal('average', 5, 2)->default(0);
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['grade_period_id', 'student_id']);
            $table->index(['school_class_id', 'average']);
            $table->index(['student_id', 'average']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_records');
        Schema::dropIfExists('grade_periods');
    }
};
