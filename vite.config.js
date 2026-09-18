import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => {
  return {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          lessons: resolve(import.meta.dirname, 'lessons/index.html'),
          books: resolve(import.meta.dirname, 'books/index.html'),
          games: resolve(import.meta.dirname, 'games/index.html'),
          admin: resolve(import.meta.dirname, 'admin/index.html'),
          mainEn: resolve(import.meta.dirname, 'en/index.html'),
          lessonsEn: resolve(import.meta.dirname, 'lessons/en/index.html'),
          booksEn: resolve(import.meta.dirname, 'books/en/index.html'),
          gamesEn: resolve(import.meta.dirname, 'games/en/index.html'),
          adminEn: resolve(import.meta.dirname, 'admin/en/index.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
