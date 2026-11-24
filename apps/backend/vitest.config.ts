import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            // Every file, even those no test imports, which would otherwise be
            // missing from the report instead of shown as uncovered
            include: ['src/**/*.ts'],
            exclude: [
                'src/transition/generated/**',
                'src/**/*.test.ts',
                'src/**/*.test-utils.ts',
            ],
        },
    },
});
