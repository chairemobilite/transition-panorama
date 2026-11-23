import js from '@eslint/js';
import markdown from '@eslint/markdown';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import checkFile from 'eslint-plugin-check-file';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export const createBaseConfig = (packageDir: string) => {
    return defineConfig([
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
            extends: [
                js.configs.recommended,
                tseslint.configs.strictTypeChecked,
                tseslint.configs.stylisticTypeChecked,
            ],
            languageOptions: {
                parserOptions: {
                    projectService: true,
                    tsconfigRootDir: packageDir,
                },
            },
            plugins: { 'import-x': importX, 'check-file': checkFile },
            settings: {
                'import-x/resolver-next': [createTypeScriptImportResolver()],
            },
            rules: {
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    { argsIgnorePattern: '^_' },
                ],
                '@typescript-eslint/restrict-template-expressions': [
                    'error',
                    {
                        allowAny: false,
                        allowBoolean: false,
                        allowNever: false,
                        allowNullish: false,
                        allowNumber: true,
                        allowRegExp: false,
                    },
                ],
                'import-x/order': [
                    'error',
                    {
                        groups: [
                            'builtin',
                            'external',
                            'internal',
                            'parent',
                            'sibling',
                            'index',
                            'object',
                        ],
                        'newlines-between': 'always',
                        alphabetize: { order: 'asc', caseInsensitive: true },
                    },
                ],
                'check-file/filename-naming-convention': [
                    'error',
                    { '**/*.{js,mjs,cjs,ts,mts,cts,tsx}': 'KEBAB_CASE' },
                    { ignoreMiddleExtensions: true },
                ],
                'check-file/folder-naming-convention': [
                    'error',
                    { '**/': 'KEBAB_CASE' },
                ],
            },
        },
        {
            files: ['**/*.md'],
            plugins: { markdown },
            language: 'markdown/commonmark',
            extends: ['markdown/recommended'],
        },
    ]);
};
