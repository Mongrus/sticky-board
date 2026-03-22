<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stickers', function (Blueprint $table) {
            $table->unsignedInteger('display_id')->nullable()->after('user_id');
        });

        $userIds = DB::table('stickers')->distinct()->pluck('user_id');
        foreach ($userIds as $userId) {
            $rowIds = DB::table('stickers')->where('user_id', $userId)->orderBy('id')->pluck('id');
            $n = 1;
            foreach ($rowIds as $rowId) {
                DB::table('stickers')->where('id', $rowId)->update(['display_id' => $n++]);
            }
        }

        Schema::table('stickers', function (Blueprint $table) {
            $table->unsignedInteger('display_id')->nullable(false)->change();
            $table->unique(['user_id', 'display_id']);
        });
    }

    public function down(): void
    {
        Schema::table('stickers', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'display_id']);
            $table->dropColumn('display_id');
        });
    }
};
