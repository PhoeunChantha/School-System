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
        Schema::create('fee_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->nullable()->constrained()->nullOnDelete();
            $table->date('billing_month');
            $table->string('academic_year')->nullable()->index();
            $table->date('due_on')->nullable();
            $table->decimal('amount', 8, 2);
            $table->decimal('discount_amount', 8, 2)->default(0);
            $table->decimal('paid_amount', 8, 2)->default(0);
            $table->string('status')->default('unpaid')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'billing_month']);
            $table->index(['billing_month', 'status']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_charge_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 8, 2);
            $table->string('method');
            $table->string('status')->default('pending')->index();
            $table->date('paid_on');
            $table->date('billing_month');
            $table->string('reference')->nullable();
            $table->string('screenshot_path')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'paid_on']);
            $table->index(['billing_month', 'status']);
            $table->index(['method', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('fee_charges');
    }
};
