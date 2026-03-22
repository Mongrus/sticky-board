<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StickerController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'service' => 'stycky-board-api',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/stickers/removed', [StickerController::class, 'removedSince']);
    Route::post('/stickers/clear-board', [StickerController::class, 'clearBoard']);
    Route::get('/stickers', [StickerController::class, 'index']);
    Route::post('/stickers', [StickerController::class, 'store']);
    Route::patch('/stickers/{uuid}', [StickerController::class, 'update'])->whereUuid('uuid');
    Route::delete('/stickers/{uuid}', [StickerController::class, 'destroy'])->whereUuid('uuid');
});
