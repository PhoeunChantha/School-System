<?php

namespace App\Services\Backends;

use App\Models\ActivityLog;
use App\Models\AppInstallationLink;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AppInstallationService
{
    /** @return array<string, mixed> */
    public function indexData(Request $request): array
    {
        $links = AppInstallationLink::query()
            ->with(['student:id,school_class_id,code,name_en,name_kh', 'student.schoolClass:id,name', 'creator:id,name'])
            ->latest()
            ->get();

        return [
            'links' => $links->map(fn (AppInstallationLink $link): array => $this->payload($link, $request)),
            'students' => Student::query()->active()->orderBy('name_en')->get(['id', 'school_class_id', 'code', 'name_en', 'name_kh'])->map(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name_en ?: $student->name_kh,
                'code' => $student->code,
                'classId' => $student->school_class_id,
            ]),
            'classes' => SchoolClass::query()->active()->withCount(['students' => fn ($query) => $query->active()])->orderBy('name')->get(['id', 'name'])->map(fn (SchoolClass $class): array => [
                'id' => $class->id,
                'name' => $class->name,
                'studentCount' => $class->students_count,
            ]),
            'summary' => [
                'generated' => $links->count(),
                'opened' => $links->whereNotNull('opened_at')->count(),
                'confirmed' => $links->whereNotNull('confirmed_at')->count(),
                'expired' => $links->filter(fn (AppInstallationLink $link): bool => $link->status() === 'expired')->count(),
            ],
        ];
    }

    /**
     * @param  array{mode:string,audience:string,student_id?:int|null,class_id?:int|null,expires_days:int}  $data
     * @return Collection<int, AppInstallationLink>
     */
    public function generate(array $data, User $user, Request $request): Collection
    {
        $students = $data['mode'] === 'class'
            ? Student::query()->active()->where('school_class_id', $data['class_id'])->get()
            : Student::query()->whereKey($data['student_id'])->get();
        $audiences = $data['audience'] === 'both' ? ['student', 'parent'] : [$data['audience']];

        return DB::transaction(function () use ($students, $audiences, $data, $user, $request): Collection {
            $links = new Collection;

            foreach ($students as $student) {
                foreach ($audiences as $audience) {
                    $links->push($this->createLink($student, $audience, $data['expires_days'], $user));
                }
            }

            $this->activity($user, $request, 'app_installation_links_generated', 'Generated app installation links.', [
                'count' => $links->count(),
                'mode' => $data['mode'],
                'audience' => $data['audience'],
            ]);

            return $links;
        });
    }

    public function regenerate(AppInstallationLink $link, User $user, Request $request): AppInstallationLink
    {
        return DB::transaction(function () use ($link, $user, $request): AppInstallationLink {
            $link->update(['revoked_at' => $link->revoked_at ?? now()]);
            $replacement = $this->createLink($link->student, $link->audience, 30, $user, $link);

            $this->activity($user, $request, 'app_installation_link_regenerated', 'Regenerated an app installation link.', [
                'old_link_id' => $link->id,
                'new_link_id' => $replacement->id,
            ], $replacement);

            return $replacement;
        });
    }

    public function revoke(AppInstallationLink $link, User $user, Request $request): void
    {
        DB::transaction(function () use ($link, $user, $request): void {
            $link->update(['revoked_at' => $link->revoked_at ?? now()]);
            $this->activity($user, $request, 'app_installation_link_revoked', 'Revoked an app installation link.', [
                'link_id' => $link->id,
            ], $link);
        });
    }

    public function destroy(AppInstallationLink $link, User $user, Request $request): void
    {
        DB::transaction(function () use ($link, $user, $request): void {
            $linkId = $link->id;
            $this->activity($user, $request, 'app_installation_link_deleted', 'Deleted an app installation link.', [
                'link_id' => $linkId,
            ]);
            $link->delete();
        });
    }

    private function createLink(Student $student, string $audience, int $expiresDays, User $user, ?AppInstallationLink $previous = null): AppInstallationLink
    {
        $token = Str::random(64);

        return AppInstallationLink::create([
            'student_id' => $student->id,
            'created_by' => $user->id,
            'regenerated_from_id' => $previous?->id,
            'audience' => $audience,
            'token' => $token,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays($expiresDays),
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(AppInstallationLink $link, Request $request): array
    {
        return [
            'routeKey' => $link->routeKey(),
            'recipient' => $link->student?->name_en ?: $link->student?->name_kh,
            'studentCode' => $link->student?->code,
            'className' => $link->student?->schoolClass?->name,
            'audience' => $link->audience,
            'status' => $link->status(),
            'shareUrl' => $request->root().route('app-install.show', ['token' => $link->token], false),
            'generatedAt' => $link->created_at?->toIso8601String(),
            'expiresAt' => $link->expires_at->toIso8601String(),
            'lastOpenedAt' => $link->last_opened_at?->toIso8601String(),
            'platform' => $link->platform,
            'browser' => $link->browser,
            'createdBy' => $link->creator?->name,
        ];
    }

    /** @param array<string, mixed> $properties */
    private function activity(User $user, Request $request, string $event, string $description, array $properties, ?AppInstallationLink $subject = null): void
    {
        ActivityLog::create([
            'user_id' => $user->id,
            'event' => $event,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->id,
            'description' => $description,
            'properties' => $properties,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
