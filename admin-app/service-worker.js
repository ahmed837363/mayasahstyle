'use strict';

const CACHE_NAME = 'mayasah-admin-v3';
const OFFLINE_URL = 'app.html';
const CACHE_ASSETS = [
    'index.html',
    'app.html',
    'manifest.json',
    'config.js',
    'css/app.css',
    'css/products.css',
    'js/app.js',
    'js/products.js',
    'js/appwrite-client.js',
    'js/auth.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request)
                .then((networkResponse) => {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
                    return networkResponse;
                })
                .catch(() => caches.match(OFFLINE_URL));
        })
    );
});
