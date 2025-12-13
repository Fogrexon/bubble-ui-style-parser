import { defineConfig } from 'vite';
import * as path from 'node:path';
import dtsPlugin from 'vite-plugin-dts';

const libraryName = 'BubbleUIStyleEngine';
// const libraryNameLower = libraryName.toLowerCase();
// const libraryNameSnake = libraryName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export default defineConfig({
  plugins: [
    dtsPlugin({
      // insertTypesEntry: true,
      outDir: 'build/types', // Output directory for declaration files
      exclude: ['**/*.test.ts'], // Exclude test files
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    // setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'], // テスト対象ファイルのパターン
    coverage: {
      // カバレッジ設定
      provider: 'v8', // 'v8' または 'istanbul'
      reporter: ['text', 'json', 'html'], // レポート形式
      reportsDirectory: './coverage', // レポート出力先
      include: ['src/**'],
    },
  },
  build: {
    outDir: 'build',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // ライブラリのエントリーファイル
      name: libraryName, // UMDビルド時のグローバル変数名
      formats: ['es', 'umd', 'commonjs'], // ビルドするフォーマット
      fileName: (format) => `${format}/index.js`,
    },
    sourcemap: true,
  },
  rollupOptions: {},
  sourcemap: true,
  minify: 'esbuild',
});
