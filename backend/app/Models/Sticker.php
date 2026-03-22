<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sticker extends Model
{
    /** @use HasFactory<\Database\Factories\StickerFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'display_id',
        'uuid',
        'text',
        'folded',
        'x',
        'y',
        'w',
        'h',
        'bc',
        'font',
        'fs',
        'tc',
        'z',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'display_id' => 'integer',
            'folded' => 'boolean',
            'x' => 'integer',
            'y' => 'integer',
            'w' => 'integer',
            'h' => 'integer',
            'fs' => 'integer',
            'z' => 'integer',
        ];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Следующий display_id внутри уже открытой транзакции (см. lockForUpdate в контроллере).
     */
    public static function nextDisplayIdForUser(int $userId): int
    {
        // Уникальный индекс (user_id, display_id) на всей таблице; после очистки доски строки остаются с deleted_at — max без trashed дал бы 1 и конфликт при INSERT.
        $max = (int) static::withTrashed()->forUser($userId)->lockForUpdate()->max('display_id');

        return $max + 1;
    }
}
