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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->nullable()->unique();
            $table->string('name_kh');
            $table->string('name_en');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('province')->nullable()->index();
            $table->string('district')->nullable();
            $table->string('commune')->nullable();
            $table->string('village')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('telegram_username')->nullable();
            $table->decimal('monthly_fee', 8, 2)->default(0);
            $table->decimal('scholarship_amount', 8, 2)->default(0);
            $table->string('fee_status')->default('unpaid')->index();
            $table->string('status')->default('active')->index();
            $table->date('enrolled_on')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_class_id', 'status']);
            $table->index(['level_id', 'status']);
            $table->index(['name_en', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
