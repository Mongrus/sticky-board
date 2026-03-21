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
    }

    public function test_user_can_list_empty_stickers(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/stickers')
            ->assertOk()
            ->assertJsonPath('stickers', []);
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
}
