'use strict'

const { rm } = require('node:fs/promises')
const { src, dest, watch: gulpWatch, series, parallel } = require('gulp')
const concat = require('gulp-concat')
const autoprefixer = require('gulp-autoprefixer').default // пакет ESM-only
const cleanCss = require('gulp-clean-css')
const terser = require('gulp-terser')
const replace = require('gulp-replace')
const browserSync = require('browser-sync').create()

const DIST = 'dist'

// Порядок подключения важен: reset → fonts → layout → style → home → stories → animation → adaptive
const CSS_ORDER = [
  'stylesheets/reset.css',
  'stylesheets/fonts.css',
  'stylesheets/layout.css',
  'stylesheets/style.css',
  'stylesheets/home.css',
  'stylesheets/stories.css',
  'stylesheets/animation.css',
  'stylesheets/adaptive.css',
]

const PATHS = {
  html: ['index.html', 'pages/**/*.html'],
  css: CSS_ORDER,
  js: ['javascripts/**/*.js', '!javascripts/allStyles.js'],
  images: 'images/**/*',
  fonts: 'fonts/**/*',
}

function clean() {
  return rm(DIST, { recursive: true, force: true })
}

function html() {
  return src(PATHS.html, { base: '.' })
    .pipe(
      replace(
        /<script src="([^"]*?)javascripts\/allStyles\.js"><\/script>/g,
        '<link rel="stylesheet" href="$1stylesheets/main.min.css">',
      ),
    )
    .pipe(replace(/javascripts\/index\.js/g, 'javascripts/index.min.js'))
    .pipe(dest(DIST))
    .pipe(browserSync.stream())
}

function styles() {
  return src(PATHS.css, { allowEmpty: true })
    .pipe(concat('main.min.css'))
    .pipe(autoprefixer())
    .pipe(cleanCss({ level: 2 }))
    .pipe(dest(`${DIST}/stylesheets`))
    .pipe(browserSync.stream())
}

function scripts() {
  return src(PATHS.js)
    .pipe(concat('index.min.js'))
    .pipe(terser())
    .pipe(dest(`${DIST}/javascripts`))
    .pipe(browserSync.stream())
}

function images() {
  return src(PATHS.images, { encoding: false, allowEmpty: true }).pipe(
    dest(`${DIST}/images`),
  )
}

function fonts() {
  return src(PATHS.fonts, { encoding: false, allowEmpty: true }).pipe(
    dest(`${DIST}/fonts`),
  )
}

const build = series(clean, parallel(html, styles, scripts, images, fonts))

function watchFiles() {
  gulpWatch(PATHS.html, html)
  gulpWatch('stylesheets/**/*.css', styles)
  gulpWatch('javascripts/**/*.js', scripts)
  gulpWatch(PATHS.images, images)
  gulpWatch(PATHS.fonts, fonts)
}

function serve() {
  browserSync.init({
    server: { baseDir: DIST },
    port: 3000,
    notify: false,
    open: false,
  })
  watchFiles()
}

exports.clean = clean
exports.html = html
exports.styles = styles
exports.scripts = scripts
exports.images = images
exports.fonts = fonts
exports.build = build
exports.watch = series(build, watchFiles)
exports.start = series(build, serve)
exports.default = exports.start
