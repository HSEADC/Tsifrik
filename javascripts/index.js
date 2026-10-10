document.addEventListener('DOMContentLoaded', () => {
  // Подсветка активного пункта меню.
  // Страницы вроде статьи относятся к разделу, но не совпадают с ним по имени файла,
  // поэтому сначала смотрим на data-section у <body>.
  const current =
    document.body.dataset.section || location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav__link').forEach((link) => {
    if (link.getAttribute('href').split('/').pop() === current) {
      link.classList.add('nav__link--active');
    }
  });
});

// Отправка форм подписки в Formspree без перезагрузки страницы.
// Статус выводится в ближайший .js-form-status после формы.
document.querySelectorAll('.js-subscribe-form').forEach((form) => {
  const status = form.parentElement.querySelector('.js-form-status');
  const button = form.querySelector('[type="submit"]');
  const successHtml = status && status.innerHTML.trim()
    ? status.innerHTML
    : 'Готово! Скоро напишем тебе';

  const showStatus = (html) => {
    if (!status) return;
    status.innerHTML = html;
    status.hidden = false;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(response.status);

      form.reset();
      showStatus(successHtml);
    } catch (error) {
      showStatus('Не получилось отправить. Попробуй ещё раз');
    } finally {
      button.disabled = false;
    }
  });
});

// Веер историй: бесконечная лента по дуге.
// Курсор у края задаёт скорость (у правого края лента едет влево, у левого — вправо),
// в середине лента стоит. Когда курсор уходит, ближайшая карточка доезжает до центра.
(() => {
  const fan = document.querySelector('.st-fan');
  if (!fan) return;

  const canAnimate = window.matchMedia(
    '(hover: hover) and (min-width: 861px) and (prefers-reduced-motion: no-preference)'
  );
  const MAX_SPEED = 2.5; // карточек в секунду у самого края
  const DEAD_ZONE = 0.2; // доля ширины в центре, где лента стоит

  const originals = [...fan.querySelectorAll('.st-fan__item')];
  const center = (originals.length - 1) / 2;

  // Копии нужны, чтобы по краям экрана всегда были карточки и «перескок» был не виден
  const clones = originals.map((item) => {
    const clone = item.cloneNode(true);
    clone.dataset.clone = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', '-1'));
    return clone;
  });
  const items = [...originals, ...clones];
  const total = items.length;

  let offset = 0;
  let speed = 0;
  let targetSpeed = 0;
  let hovering = false;
  let frame = null;
  let lastTime = 0;

  // Сводим позицию к диапазону [-total/2, total/2), чтобы карточки шли по кругу
  const wrap = (t) => ((((t + total / 2) % total) + total) % total) - total / 2;

  const render = () => {
    items.forEach((item, i) => {
      const t = wrap(i - center + offset);
      item.style.setProperty('--t', t.toFixed(4));
      item.style.zIndex = String(100 - Math.round(Math.abs(t) * 10));
    });
  };

  const tick = (time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    speed += (targetSpeed - speed) * Math.min(1, dt * 6);
    offset = wrap(offset + speed * dt);

    // Без курсора — плавно доводим до ближайшей карточки
    if (!hovering && Math.abs(speed) < 0.05) {
      speed = 0;
      const snap = Math.round(offset) - offset;
      offset += Math.abs(snap) < 0.001 ? snap : snap * Math.min(1, dt * 6);
    }

    render();

    const settled = !hovering && speed === 0 && offset === Math.round(offset);
    frame = settled ? null : requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  };

  fan.addEventListener('mousemove', (event) => {
    if (!canAnimate.matches) return;
    const rect = fan.getBoundingClientRect();
    const pos = ((event.clientX - rect.left) / rect.width) * 2 - 1; // -1…1
    const strength = Math.max(0, Math.abs(pos) - DEAD_ZONE) / (1 - DEAD_ZONE);
    hovering = true;
    targetSpeed = -Math.sign(pos) * strength * MAX_SPEED;
    start();
  });

  fan.addEventListener('mouseleave', () => {
    hovering = false;
    targetSpeed = 0;
    start();
  });

  const setup = () => {
    cancelAnimationFrame(frame);
    frame = null;
    offset = speed = targetSpeed = 0;

    if (canAnimate.matches) {
      clones.forEach((clone) => fan.appendChild(clone));
      render();
    } else {
      // На мобильной ленте — только оригиналы и позиции из CSS
      clones.forEach((clone) => clone.remove());
      originals.forEach((item) => {
        item.style.removeProperty('--t');
        item.style.removeProperty('z-index');
      });
    }
  };

  canAnimate.addEventListener('change', setup);
  setup();
})();
