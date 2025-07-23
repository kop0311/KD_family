import { defineConfig } from 'bun';

export default defineConfig({
  entrypoints: ['src/main.tsx'],
  outdir: './dist',
  target: 'browser',
  splitting: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
  plugins: [],
});