<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'stickers_board_epoch')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('stickers_board_epoch')->default(0)->after('password');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'stickers_board_epoch')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('stickers_board_epoch');
        });
    }
};
