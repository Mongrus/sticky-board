<?php

namespace Tests\Feature\Api;

use App\Models\Sticker;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StickerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ]);
    }

    public function test_guest_cannot_access_stickers(): void
    {
        $this->getJson('/api/stickers')->assertUnauthorized();
        $this->postJson('/api/stickers', [])->assertUnauthorized();
        $this->patchJson('/api/stickers/'.Str::uuid()->toString(), [])->assertUnauthorized();
        $this->deleteJson('/api/stickers/'.Str::uuid()->toString())->assertUnauthorized();
        $this->getJson('/api/stickers/removed?since='.now()->toIso8601String())->assertUnauthorized();
        $this->postJson('/api/stickers/clear-board')->assertUnauthorized();
    }

    public function test_user_can_list_empty_stickers(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/stickers')
            ->assertOk()
            ->assertJsonPath('stickers', [])
            ->assertJsonPath('board_epoch', 0);
    }

    public function test_user_can_create_sticker_with_client_uuid(): void
    {
        $user = User::factory()->create();
        $uuid = (string) Str::uuid();

        $response = $this->actingAs($user)->postJson('/api/stickers', [
            'uuid' => $uuid,
            'text' => 'Hello',
            'x' => 50,
            'y' => 60,
        ]);

        $response->assertCreated()
            ->assertJsonPath('sticker.uuid', $uuid)
            ->assertJsonPath('sticker.text', 'Hello')
            ->assertJsonPath('sticker.x', 50)
            ->assertJsonPath('sticker.y', 60);

        $this->assertDatabaseHas('stickers', [
            'user_id' => $user->id,
            'uuid' => $uuid,
            'text' => 'Hello',
        ]);
    }

    public function test_user_can_create_sticker_without_uuid_server_generates(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/stickers', [
            'text' => 'Note',
        ]);

        $response->assertCreated();
        $uuid = $response->json('sticker.uuid');
        $this->assertIsString($uuid);
        $this->assertTrue(Str::isUuid($uuid));
        $this->assertDatabaseHas('stickers', [
            'user_id' => $user->id,
            'uuid' => $uuid,
        ]);
    }

    public function test_user_cannot_create_duplicate_uuid(): void
    {
        $user = User::factory()->create();
        $uuid = (string) Str::uuid();
        Sticker::factory()->for($user)->create(['uuid' => $uuid]);

        $this->actingAs($user)
            ->postJson('/api/stickers', ['uuid' => $uuid, 'text' => 'dup'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['uuid']);
    }

    public function test_user_can_patch_own_sticker(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create(['text' => 'old', 'x' => 1]);

        $response = $this->actingAs($user)->patchJson('/api/stickers/'.$sticker->uuid, [
            'text' => 'new',
            'x' => 99,
        ]);

        $response->assertOk()
            ->assertJsonPath('sticker.text', 'new')
            ->assertJsonPath('sticker.x', 99);

        $this->assertSame('new', $sticker->fresh()->text);
    }

    public function test_user_can_patch_sticker_fs_in_allowed_range(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create(['fs' => 14]);

        $this->actingAs($user)
            ->patchJson('/api/stickers/'.$sticker->uuid, ['fs' => 120])
            ->assertOk()
            ->assertJsonPath('sticker.fs', 120);

        $this->assertSame(120, $sticker->fresh()->fs);
    }

    public function test_patch_sticker_fs_out_of_range_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create();

        $this->actingAs($user)
            ->patchJson('/api/stickers/'.$sticker->uuid, ['fs' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fs']);

        $this->actingAs($user)
            ->patchJson('/api/stickers/'.$sticker->uuid, ['fs' => 121])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fs']);
    }

    public function test_user_can_delete_own_sticker(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create();

        $this->actingAs($user)
            ->deleteJson('/api/stickers/'.$sticker->uuid)
            ->assertNoContent();

        $this->assertSoftDeleted($sticker);
    }

    public function test_deleted_sticker_not_in_index(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create();

        $this->actingAs($user)->deleteJson('/api/stickers/'.$sticker->uuid)->assertNoContent();

        $this->actingAs($user)
            ->getJson('/api/stickers')
            ->assertOk()
            ->assertJsonPath('stickers', []);
    }

    public function test_create_after_soft_deleting_all_stickers_gets_next_display_id_no_500(): void
    {
        $user = User::factory()->create();
        Sticker::factory()->for($user)->create(['text' => 'a']);
        Sticker::factory()->for($user)->create(['text' => 'b']);

        Sticker::forUser($user->id)->each(fn (Sticker $sticker) => $sticker->delete());

        $response = $this->actingAs($user)->postJson('/api/stickers', [
            'text' => 'after clear',
        ]);

        $response->assertCreated()
            ->assertJsonPath('sticker.text', 'after clear')
            ->assertJsonPath('sticker.display_id', 3);

        $this->assertDatabaseHas('stickers', [
            'user_id' => $user->id,
            'display_id' => 3,
            'text' => 'after clear',
            'deleted_at' => null,
        ]);
    }

    public function test_removed_since_returns_soft_deleted_uuids(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create();
        $since = now()->subSecond()->toIso8601String();

        $this->actingAs($user)->deleteJson('/api/stickers/'.$sticker->uuid)->assertNoContent();

        $this->actingAs($user)
            ->getJson('/api/stickers/removed?since='.urlencode($since))
            ->assertOk()
            ->assertJsonCount(1, 'removed')
            ->assertJsonPath('removed.0.uuid', $sticker->uuid);
    }

    public function test_post_with_uuid_restores_soft_deleted_sticker(): void
    {
        $user = User::factory()->create();
        $uuid = (string) Str::uuid();
        $sticker = Sticker::factory()->for($user)->create(['uuid' => $uuid, 'text' => 'old']);
        $sticker->delete();

        $this->actingAs($user)
            ->postJson('/api/stickers', [
                'uuid' => $uuid,
                'text' => 'restored',
            ])
            ->assertCreated()
            ->assertJsonPath('sticker.text', 'restored');

        $this->assertDatabaseHas('stickers', [
            'uuid' => $uuid,
            'deleted_at' => null,
        ]);
    }

    public function test_user_gets_404_for_other_users_sticker_on_patch(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $sticker = Sticker::factory()->for($owner)->create();

        $this->actingAs($other)
            ->patchJson('/api/stickers/'.$sticker->uuid, ['text' => 'hack'])
            ->assertNotFound();
    }

    public function test_user_gets_404_for_other_users_sticker_on_delete(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $sticker = Sticker::factory()->for($owner)->create();

        $this->actingAs($other)
            ->deleteJson('/api/stickers/'.$sticker->uuid)
            ->assertNotFound();

        $this->assertDatabaseHas('stickers', ['id' => $sticker->id]);
    }

    public function test_since_filters_by_updated_at(): void
    {
        $user = User::factory()->create();
        $sticker = Sticker::factory()->for($user)->create(['text' => 'a']);

        $marker = $sticker->fresh()->updated_at->toIso8601String();

        $this->travel(2)->seconds();
        $sticker->update(['text' => 'b']);

        $this->actingAs($user)
            ->getJson('/api/stickers?since='.urlencode($marker))
            ->assertOk()
            ->assertJsonCount(1, 'stickers')
            ->assertJsonPath('stickers.0.uuid', $sticker->uuid);
    }

    public function test_clear_board_hard_deletes_all_stickers_and_resets_display_id(): void
    {
        $user = User::factory()->create();
        Sticker::factory()->for($user)->create();
        Sticker::factory()->for($user)->create();
        $soft = Sticker::factory()->for($user)->create();
        $soft->delete();

        $this->actingAs($user)
            ->postJson('/api/stickers/clear-board')
            ->assertOk()
            ->assertJson(['ok' => true, 'board_epoch' => 1]);

        $this->assertSame(1, $user->fresh()->stickers_board_epoch);
        $this->assertSame(0, Sticker::withTrashed()->where('user_id', $user->id)->count());

        $this->actingAs($user)
            ->postJson('/api/stickers', ['text' => 'fresh'])
            ->assertCreated()
            ->assertJsonPath('sticker.display_id', 1)
            ->assertJsonPath('sticker.text', 'fresh');
    }

    public function test_clear_board_does_not_affect_other_users(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sticker::factory()->for($owner)->create();
        Sticker::factory()->for($other)->create();

        $this->actingAs($owner)->postJson('/api/stickers/clear-board')->assertOk();

        $this->assertSame(0, Sticker::where('user_id', $owner->id)->count());
        $this->assertSame(1, Sticker::where('user_id', $other->id)->count());
        $this->assertSame(0, $other->fresh()->stickers_board_epoch);
    }
}
