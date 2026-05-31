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
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('template_image_path')->nullable()->after('status');
            $table->string('logo_image_path')->nullable()->after('template_image_path');
            $table->json('layout')->nullable()->after('logo_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['template_image_path', 'logo_image_path', 'layout']);
        });
    }
};
