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
        Schema::create('sms_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('parent_access_token_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone', 32)->index();
            $table->string('provider', 40)->default('plasgate')->index();
            $table->string('sender')->nullable();
            $table->text('message');
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedSmallInteger('attempt_count')->default(1);
            $table->unsignedSmallInteger('provider_status')->nullable();
            $table->text('provider_response')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('last_attempted_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['phone', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_communications');
    }
};
