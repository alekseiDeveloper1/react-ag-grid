// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';

export default tseslint.config(
    // 1. Базовые рекомендованные правила ESLint
    tseslint.configs.recommended,

    // 2. Рекомендованные правила TypeScript-ESLint (строгие)
    ...tseslint.configs.strict, // Использует strict режим

    // 3. Рекомендованные правила для React (Flat Config версия)
    pluginReact.configs.flat.recommended,

    // 4. Дополнительная конфигурация для JSX (для React 17+ new JSX transform)
    pluginReact.configs.flat['jsx-runtime'],

    // 5. Общие настройки для проекта
    {
        // Указываем файлы, которые должны обрабатываться этим конфигом
        files: ['**/*.{js,jsx,ts,tsx}'],

        // Настройки языка (окружение и парсеры)
        languageOptions: {
            globals: {
                ...globals.browser, // Добавляем глобальные переменные браузера (window, document и т.д.)
                ...globals.node, // Добавляем глобальные переменные Node.js (для сборщиков/тестов)
            },
            // Парсер уже встроен в конфиги tseslint выше, но настройки react/jsx-runtime требуют:
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        // Настройки плагина React (автоматически определяет версию React)
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // 6. Игнорирование файлов и папок (как .gitignore)
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            '.next/',
            '*.config.js', // Игнорировать сам файл конфигурации ESLint при линтинге
        ],
    },
);
