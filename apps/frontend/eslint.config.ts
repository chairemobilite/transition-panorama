import pluginRouter from '@tanstack/eslint-plugin-router';
import { createBaseConfig } from 'dev-config/eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default defineConfig([
    globalIgnores(['dist']),
    createBaseConfig(new URL('.', import.meta.url).pathname),
    {
        files: ['**/*.{js,ts,tsx}'],
        extends: [
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: { globals: globals.browser },
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['./*', '../*'],
                            message:
                                'Use an @/ import instead of a relative one.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['src/**/*.tsx'],
        extends: [betterTailwindcss.configs.recommended],
        settings: {
            'better-tailwindcss': { entryPoint: 'src/index.css' },
        },
        rules: {
            'better-tailwindcss/enforce-consistent-line-wrapping': [
                'warn',
                // Like Prettier's tabWidth, and leaving it the final say
                { indent: 4, strictness: 'loose' },
            ],
        },
    },
    {
        // shadcn/ui components export their style variants (e.g. buttonVariants) next to the component.
        files: ['src/components/ui/**/*.tsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    {
        files: ['src/app/routes/**/*.tsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    {
        // TanStack Router picks these names (e.g. __root.tsx, routeTree.gen.ts).
        files: ['src/app/routes/**', 'src/app/routeTree.gen.ts'],
        rules: {
            'check-file/filename-naming-convention': 'off',
            'check-file/folder-naming-convention': 'off',
        },
    },
    ...pluginRouter.configs['flat/recommended'],
]);
