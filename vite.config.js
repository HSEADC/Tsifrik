import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/tsifrik01/',
    build: {
        outDir: 'dist',
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                history: fileURLToPath(new URL('./pages/history.html', import.meta.url)),
                zaglushka: fileURLToPath(new URL('./pages/zaglushka.html', import.meta.url)),
            },
        },
    },
})
