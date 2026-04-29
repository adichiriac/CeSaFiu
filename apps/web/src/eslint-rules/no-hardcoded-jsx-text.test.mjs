import {ESLint} from 'eslint';
import {describe, expect, it} from 'vitest';
import noHardcodedJsxText from './no-hardcoded-jsx-text.js';

function createLinter() {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.jsx'],
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true
            }
          }
        },
        plugins: {
          cesafiu: {
            rules: {
              'no-hardcoded-jsx-text': noHardcodedJsxText
            }
          }
        },
        rules: {
          'cesafiu/no-hardcoded-jsx-text': 'error'
        }
      }
    ]
  });
}

describe('no-hardcoded-jsx-text', () => {
  it('allows text rendered through t()', async () => {
    const [result] = await createLinter().lintText(
      "export function View({t}) { return <h1>{t('home.title')}</h1>; }",
      {filePath: 'View.jsx'}
    );

    expect(result.messages).toEqual([]);
  });

  it('reports literal JSX text', async () => {
    const [result] = await createLinter().lintText(
      'export function View() { return <h1>Hello student</h1>; }',
      {filePath: 'View.jsx'}
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.ruleId).toBe('cesafiu/no-hardcoded-jsx-text');
  });

  it('reports user-facing literal attributes', async () => {
    const [result] = await createLinter().lintText(
      'export function View() { return <button aria-label="Open settings" />; }',
      {filePath: 'View.jsx'}
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.ruleId).toBe('cesafiu/no-hardcoded-jsx-text');
  });
});
