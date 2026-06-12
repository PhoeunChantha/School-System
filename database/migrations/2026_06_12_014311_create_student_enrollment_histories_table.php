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
        Schema::create('student_enrollment_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 30)->index();
            $table->foreignId('from_level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->foreignId('to_level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->foreignId('from_school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->foreignId('to_school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->nullable();
            $table->date('effective_on');
            $table->text('note')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'effective_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollment_histories');
    }
};
