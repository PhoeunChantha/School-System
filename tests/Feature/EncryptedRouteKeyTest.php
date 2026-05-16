<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EncryptedRouteKeyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_edit_urls_use_encrypted_route_keys(): void
    {
        $this->withoutVite();

        $student = Student::factory()->create();
        $url = route('admin.students.edit', $student);

        $this->assertStringNotContainsString('/'.$student->id.'/edit', $url);

        $this->actingAs(User::factory()->create())
            ->get($url)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/students/edit')
                ->where('student.id', $student->id)
                ->has('student.routeKey'));
    }
}
