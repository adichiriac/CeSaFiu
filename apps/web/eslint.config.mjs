import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import noHardcodedJsxText from './src/eslint-rules/no-hardcoded-jsx-text.js';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'messages/**',
      'next-env.d.ts'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['*.mjs', '*.config.ts', 'src/instrumentation*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    settings: {
      next: {
        rootDir: ['apps/web/']
      }
    },
    plugins: {
      '@next/next': nextPlugin,
      cesafiu: {
        rules: {
          'no-hardcoded-jsx-text': noHardcodedJsxText
        }
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
      'cesafiu/no-hardcoded-jsx-text': 'error'
    }
  }
);
