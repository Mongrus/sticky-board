<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sticker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StickerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'since' => ['sometimes', 'nullable', 'date'],
        ]);

        $query = Sticker::query()
            ->forUser($request->user()->id)
            ->orderBy('id');

        if (! empty($validated['since'])) {
            $since = Carbon::parse($validated['since']);
            $query->where('updated_at', '>', $since);
        }

        $stickers = $query->get()->map(fn (Sticker $s) => $this->toApiArray($s));

        return response()->json([
            'stickers' => $stickers,
        ]);
    }

    public function removedSince(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'since' => ['required', 'date'],
        ]);

        $since = Carbon::parse($validated['since']);

        $removed = Sticker::onlyTrashed()
            ->forUser($request->user()->id)
            ->where('deleted_at', '>=', $since)
            ->orderBy('id')
            ->get(['uuid', 'deleted_at'])
            ->map(fn (Sticker $s) => [
                'uuid' => $s->uuid,
                'deleted_at' => $s->deleted_at?->toIso8601String(),
            ]);

        return response()->json([
            'removed' => $removed,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateStickerPayload($request, creating: true);

        $uuid = $validated['uuid'] ?? (string) Str::uuid();

        $trashed = Sticker::onlyTrashed()
            ->forUser($request->user()->id)
            ->where('uuid', $uuid)
            ->first();

        if ($trashed !== null) {
            $trashed->restore();
            $trashed->fill([
                'text' => $validated['text'] ?? '',
                'folded' => $validated['folded'] ?? false,
                'x' => $validated['x'] ?? 100,
                'y' => $validated['y'] ?? 100,
                'w' => $validated['w'] ?? 200,
                'h' => $validated['h'] ?? 120,
                'bc' => $validated['bc'] ?? '#FFF9B4',
                'font' => $validated['font'] ?? 'Andika, sans-serif',
                'fs' => $validated['fs'] ?? 14,
                'tc' => $validated['tc'] ?? '#2B2B2B',
                'z' => $validated['z'] ?? 0,
            ]);
            $trashed->save();
            $trashed->refresh();

            return response()->json([
                'sticker' => $this->toApiArray($trashed),
            ], 201);
        }

        $sticker = Sticker::create([
            'user_id' => $request->user()->id,
            'uuid' => $uuid,
            'text' => $validated['text'] ?? '',
            'folded' => $validated['folded'] ?? false,
            'x' => $validated['x'] ?? 100,
            'y' => $validated['y'] ?? 100,
            'w' => $validated['w'] ?? 200,
            'h' => $validated['h'] ?? 120,
            'bc' => $validated['bc'] ?? '#FFF9B4',
            'font' => $validated['font'] ?? 'Andika, sans-serif',
            'fs' => $validated['fs'] ?? 14,
            'tc' => $validated['tc'] ?? '#2B2B2B',
            'z' => $validated['z'] ?? 0,
        ]);

        $sticker->refresh();

        return response()->json([
            'sticker' => $this->toApiArray($sticker),
        ], 201);
    }

    public function update(Request $request, string $uuid): JsonResponse
    {
        $sticker = $this->findOwnedOrAbort($request, $uuid);

        $validated = $this->validateStickerPayload($request, creating: false);

        $sticker->fill($validated);
        $sticker->save();
        $sticker->refresh();

        return response()->json([
            'sticker' => $this->toApiArray($sticker),
        ]);
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $sticker = $this->findOwnedOrAbort($request, $uuid);
        $sticker->delete();

        return response()->json(null, 204);
    }

    private function findOwnedOrAbort(Request $request, string $uuid): Sticker
    {
        $sticker = Sticker::query()
            ->forUser($request->user()->id)
            ->where('uuid', $uuid)
            ->first();

        if ($sticker === null) {
            abort(404);
        }

        return $sticker;
    }

    private function validateStickerPayload(Request $request, bool $creating): array
    {
        $uuidRule = $creating
            ? [
                'sometimes',
                'nullable',
                'uuid',
                Rule::unique('stickers', 'uuid')->where(function ($query) use ($request) {
                    $query->where('user_id', $request->user()->id)
                        ->whereNull('deleted_at');
                }),
            ]
            : ['prohibited'];

        $rules = [
            'uuid' => $uuidRule,
            'text' => ['sometimes', 'nullable', 'string', 'max:65535'],
            'folded' => ['sometimes', 'boolean'],
            'x' => ['sometimes', 'integer', 'between:-100000,100000'],
            'y' => ['sometimes', 'integer', 'between:-100000,100000'],
            'w' => ['sometimes', 'integer', 'min:50', 'max:4000'],
            'h' => ['sometimes', 'integer', 'min:50', 'max:4000'],
            'bc' => ['sometimes', 'string', 'max:64'],
            'font' => ['sometimes', 'string', 'max:255'],
            'fs' => ['sometimes', 'integer', 'min:6', 'max:96'],
            'tc' => ['sometimes', 'string', 'max:32'],
            'z' => ['sometimes', 'integer', 'min:0', 'max:2147483647'],
        ];

        return $request->validate($rules);
    }

    private function toApiArray(Sticker $sticker): array
    {
        return [
            'uuid' => $sticker->uuid,
            'updated_at' => $sticker->updated_at?->toIso8601String(),
            'text' => $sticker->text ?? '',
            'folded' => $sticker->folded,
            'x' => $sticker->x,
            'y' => $sticker->y,
            'w' => $sticker->w,
            'h' => $sticker->h,
            'bc' => $sticker->bc,
            'font' => $sticker->font,
            'fs' => $sticker->fs,
            'tc' => $sticker->tc,
            'z' => $sticker->z,
        ];
    }
}
