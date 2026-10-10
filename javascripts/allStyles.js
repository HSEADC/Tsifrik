// Подключает все CSS-файлы проекта. Путь считается от расположения этого скрипта,
// поэтому файл работает и из index.html, и из pages/*.html
(function () {
  const styles = ['reset', 'fonts', 'layout', 'style', 'home', 'stories', 'animation', 'adaptive'];
  const base = new URL('../stylesheets/', document.currentScript.src);

  styles.forEach((name) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(name + '.css', base).href;
    document.head.appendChild(link);
  });
})();
