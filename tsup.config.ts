import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2018',
  outExtension({format}) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
