<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ $seoTitle ?? config('app.name', 'Laravel') }}</title>
        <meta name="description" content="{{ $seoDescription ?? ($schoolName ?? config('app.name')).' - School Management System' }}">
        @if(!empty($seoKeywords))
        <meta name="keywords" content="{{ $seoKeywords }}">
        @endif
        <meta name="robots" content="{{ $seoRobots ?? 'index,follow' }}">
        @if(!empty($seoCanonicalUrl))
        <link rel="canonical" href="{{ $seoCanonicalUrl }}">
        @endif

        {{-- Open Graph meta tags for link sharing --}}
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ $seoCanonicalUrl ?: url()->current() }}">
        <meta property="og:title" content="{{ $seoTitle ?? $schoolName ?? config('app.name') }}">
        <meta property="og:description" content="{{ $seoDescription ?? ($schoolName ?? config('app.name')).' - School Management System' }}">
        @if(!empty($seoImage))
        <meta property="og:image" content="{{ $seoImage }}">
        @elseif(!empty($schoolLogo))
        <meta property="og:image" content="{{ $schoolLogo }}">
        @elseif(!empty($schoolFavicon))
        <meta property="og:image" content="{{ $schoolFavicon }}">
        @endif
        <meta property="og:site_name" content="{{ $schoolName ?? config('app.name') }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle ?? $schoolName ?? config('app.name') }}">
        <meta name="twitter:description" content="{{ $seoDescription ?? ($schoolName ?? config('app.name')).' - School Management System' }}">
        @if(!empty($seoImage))
        <meta name="twitter:image" content="{{ $seoImage }}">
        @elseif(!empty($schoolLogo))
        <meta name="twitter:image" content="{{ $schoolLogo }}">
        @endif

        <link rel="icon" href="{{ $schoolFavicon ?? '/favicon.ico' }}" sizes="any">
        <link rel="apple-touch-icon" href="{{ $schoolLogo ?? '/apple-touch-icon.png' }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
