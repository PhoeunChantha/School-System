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
        Schema::create('school_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('room')->nullable();
            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();
            $table->json('days')->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->string('academic_year')->nullable()->index();
            $table->string('status')->default('active')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['level_id', 'status']);
            $table->index(['teacher_id', 'status']);
            $table->index(['academic_year', 'status']);
            $table->unique(['name', 'room']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_classes');
    }
};
