<?php

namespace Database\Factories;

use App\Models\Sticker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sticker>
 */
class StickerFactory extends Factory
{
    protected $model = Sticker::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'display_id' => 1,
            'uuid' => (string) Str::uuid(),
            'text' => fake()->optional()->sentence(),
            'folded' => false,
            'x' => fake()->numberBetween(0, 800),
            'y' => fake()->numberBetween(0, 600),
            'w' => 200,
            'h' => 120,
            'bc' => '#FFF9B4',
            'font' => 'Andika, sans-serif',
            'fs' => 14,
            'tc' => '#2B2B2B',
            'z' => 0,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Sticker $model) {
            $uid = $model->user_id;
            if ($uid === null) {
                return;
            }
            $max = (int) Sticker::withTrashed()->where('user_id', $uid)->max('display_id');

            $model->display_id = $max > 0 ? $max + 1 : 1;
        });
    }
}
