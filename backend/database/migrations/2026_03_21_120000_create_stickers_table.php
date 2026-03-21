<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stickers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->text('text')->nullable();
            $table->boolean('folded')->default(false);
            $table->integer('x')->default(0);
            $table->integer('y')->default(0);
            $table->unsignedInteger('w')->default(200);
            $table->unsignedInteger('h')->default(120);
            $table->string('bc', 64)->default('#FFF9B4');
            $table->string('font', 255)->default('Andika, sans-serif');
            $table->unsignedSmallInteger('fs')->default(14);
            $table->string('tc', 32)->default('#2B2B2B');
            $table->unsignedInteger('z')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stickers');
    }
};
