<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AdminUserCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->seed(PermissionSeeder::class);
    }

    public function test_admin_can_view_users_page(): void
    {
        $admin = $this->adminUser();
        $role = Role::query()->create(['name' => 'teacher', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'name' => 'Sok Admin',
            'email' => 'sok@example.com',
            'avatar' => 'uploads/users/sok.jpg',
        ]);
        $user->assignRole($role);

        $this->actingAs($admin)
            ->get(route('admin.users'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/index')
                ->has('users', 2)
                ->where('users.0.name', 'Sok Admin')
                ->where('users.0.avatar', asset('uploads/users/sok.jpg'))
                ->where('users.0.roleNames.0', 'teacher')
                ->has('roles', 2));
    }

    public function test_admin_can_create_user_with_avatar_and_roles(): void
    {
        $admin = $this->adminUser();
        $role = Role::query()->create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Teacher User',
                'email' => 'teacher@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'avatar' => UploadedFile::fake()->image('avatar.jpg'),
                'email_verified' => '1',
                'role_ids' => [$role->id],
            ])
            ->assertRedirect();

        $user = User::query()->where('email', 'teacher@example.com')->firstOrFail();

        $this->assertTrue($user->hasRole('teacher'));
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->avatar);
        $this->assertStringStartsWith('uploads/users/', $user->avatar);
        $this->assertFileExists(public_path($user->avatar));

        unlink(public_path($user->avatar));
    }

    public function test_admin_can_update_user_avatar_and_roles(): void
    {
        $admin = $this->adminUser();
        $oldRole = Role::query()->create(['name' => 'student', 'guard_name' => 'web']);
        $newRole = Role::query()->create(['name' => 'teacher', 'guard_name' => 'web']);
        $oldAvatarPath = 'uploads/users/old-avatar.jpg';
        $oldAvatarFullPath = public_path($oldAvatarPath);

        if (! is_dir(dirname($oldAvatarFullPath))) {
            mkdir(dirname($oldAvatarFullPath), 0755, true);
        }

        file_put_contents($oldAvatarFullPath, 'old avatar');

        $user = User::factory()->create([
            'email' => 'old@example.com',
            'avatar' => $oldAvatarPath,
        ]);
        $user->assignRole($oldRole);

        $this->actingAs($admin)
            ->post(route('admin.users.update', $user), [
                '_method' => 'put',
                'name' => 'Updated User',
                'email' => 'updated@example.com',
                'password' => '',
                'password_confirmation' => '',
                'avatar' => UploadedFile::fake()->image('new-avatar.jpg'),
                'email_verified' => '0',
                'role_ids' => [$newRole->id],
            ])
            ->assertRedirect();

        $user->refresh();

        $this->assertSame('Updated User', $user->name);
        $this->assertSame('updated@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertFalse($user->hasRole('student'));
        $this->assertTrue($user->hasRole('teacher'));
        $this->assertNotSame($oldAvatarPath, $user->avatar);
        $this->assertFileDoesNotExist($oldAvatarFullPath);
        $this->assertNotNull($user->avatar);
        $this->assertFileExists(public_path($user->avatar));

        unlink(public_path($user->avatar));
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $admin))
            ->assertRedirect();

        $this->assertModelExists($admin);
    }

    private function adminUser(): User
    {
        $role = Role::query()->firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $role->syncPermissions(['users.view', 'users.create', 'users.update', 'users.delete']);

        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }
}
