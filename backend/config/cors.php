<?php

$frontend = env('FRONTEND_URL');

return [

    /*
    |--------------------------------------------------------------------------
    | Paths that should get CORS headers (HandleCors middleware).
    |--------------------------------------------------------------------------
    */
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed origins for the Vue SPA (Vite dev + production URL).
    | Wildcard "*" cannot be used when supports_credentials is true.
    |--------------------------------------------------------------------------
    */
    'allowed_origins' => array_values(array_unique(array_filter([
        $frontend,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Set true when using Sanctum SPA auth (cookies across origins).
    |--------------------------------------------------------------------------
    */
    'supports_credentials' => (bool) env('CORS_SUPPORTS_CREDENTIALS', true),

];
