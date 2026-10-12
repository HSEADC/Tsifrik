import { defineConfig } from 'vite'

export default defineConfig({
  input: [
    'index.html',
    'pages/about.html',
    'pages/article.html',
    'pages/cyberbullying.html',
    'pages/games.html',
    'pages/stories.html',
    'pages/tests.html',
    'Кибербуллинг.dc.html',
  ],
  build: {
    outDir: 'dist',
  },
})
