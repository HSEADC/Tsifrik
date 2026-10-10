# Tcifrik media

Статический многостраничный сайт со сборкой на Gulp 5.

## Установка

```bash
yarn install
```

## Команды

| Команда | Что делает |
| --- | --- |
| `yarn start` | Собирает проект в `dist/`, поднимает dev-сервер на http://localhost:3000 и следит за файлами (live reload) |
| `yarn watch` | Собирает проект в `dist/` и пересобирает при изменении файлов, без сервера |
| `yarn build` | Разовая production-сборка в `dist/` |
| `yarn clean` | Удаляет `dist/` |

## Структура

```
index.html        главная страница
pages/            остальные страницы
stylesheets/      исходные CSS (порядок подключения задан в gulpfile.js)
  home.css        вёрстка главной страницы по макету, все классы с префиксом lp-
javascripts/      исходные JS
images/           картинки, копируются в dist как есть
fonts/            woff2: Unbounded (заголовки), Onest (текст), JetBrains Mono (подписи)
```

## Что делает сборка

- CSS из `stylesheets/` склеиваются в порядке `reset → fonts → layout → style → home → animation → adaptive`,
  прогоняются через autoprefixer и минифицируются в `dist/stylesheets/main.min.css`;
- JS из `javascripts/` (кроме `allStyles.js`) склеиваются и минифицируются в `dist/javascripts/index.min.js`;
- в HTML подключение `javascripts/allStyles.js` заменяется на `<link>` с собранным CSS,
  а `index.js` — на `index.min.js`. Относительные пути (`../`) сохраняются, поэтому
  страницы из `pages/` работают без изменений;
- `allStyles.js` остаётся в исходниках: он нужен, чтобы страницы открывались и без сборки.

Новый CSS-файл нужно добавить в двух местах: в массив `CSS_ORDER` в `gulpfile.js`
(для сборки) и в массив `styles` в `javascripts/allStyles.js` (чтобы страницы
открывались и без сборки).
