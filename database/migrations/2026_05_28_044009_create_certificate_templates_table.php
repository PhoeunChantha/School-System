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
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('template_image_path');
            $table->string('logo_image_path')->nullable();
            $table->json('layout')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->foreignId('template_id')->nullable()->after('level_id')->constrained('certificate_templates')->nullOnDelete();
            $table->dropColumn(['template_image_path', 'logo_image_path', 'layout']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('template_id');
            $table->string('template_image_path')->nullable()->after('status');
            $table->string('logo_image_path')->nullable()->after('template_image_path');
            $table->json('layout')->nullable()->after('logo_image_path');
        });

        Schema::dropIfExists('certificate_templates');
    }
};
