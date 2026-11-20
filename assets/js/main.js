// Orbis — поведение страницы.

// Ссылка на анкету в Яндекс Формах. Вставьте сюда ссылку для встраивания
// (Яндекс Формы → Поделиться → «Встроить на сайт» → адрес из src iframe),
// например: 'https://forms.yandex.ru/u/XXXXXXXXXXXX/?iframe=1'.
// Пока строка пустая, в блоке анкеты показывается кнопка Telegram.
const FORM_URL = 'https://forms.yandex.ru/u/6affb2c1902902df415915f3/?iframe=1';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Навигация: подложка после начала прокрутки
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Сфера: спутник на орбите останавливается, если пользователь просит меньше движения
  const orb = document.querySelector('.orb');
  const syncOrb = () => { if (!orb || !orb.pauseAnimations) return; reduce.matches ? orb.pauseAnimations() : orb.unpauseAnimations(); };
  syncOrb();
  reduce.addEventListener?.('change', syncOrb);

  // Вкладки с управлением с клавиатуры
  function tabs(root, onSelect) {
    const list = [...root.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      // На телефоне вкладки раскрываются аккордеоном: держим нажатый пункт на месте экрана
      const before = tab.getBoundingClientRect().top;
      list.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      const shift = tab.getBoundingClientRect().top - before;
      if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
      if (focus) tab.focus({ preventScroll: true });
      onSelect && onSelect(list.indexOf(tab));
    };
    list.forEach((t, i) => {
      t.addEventListener('click', () => select(t, false));
      t.addEventListener('keydown', (e) => {
        const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (e.key in map) { e.preventDefault(); select(list[(i + map[e.key] + list.length) % list.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(list[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(list[list.length - 1], true); }
      });
    });
    return { list, select };
  }

  // Демо «Как работает»: шаги сменяются сами, пока блок на экране
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const DUR = 4200;
    let timer = null, inView = false, held = false, userPaused = reduce.matches, index = 0;
    const t = tabs(demo, (i) => { index = i; placeLight(); syncMobile(); restart(); });
    // Свет на орбите шагов: кривая x(t) = (1-t)²·26 + 2(1-t)t·(-18) + t²·26 в поле 28×100
    const orbit = demo.querySelector('.demo__orbit');
    const light = demo.querySelector('.demo__light');
    function placeLight() {
      if (!orbit || !light || !orbit.offsetHeight) return;
      const box = orbit.getBoundingClientRect();
      const st = t.list[index].getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (st.top + st.height / 2 - box.top) / box.height));
      const x = (1 - f) * (1 - f) * 26 + 2 * (1 - f) * f * -18 + f * f * 26;
      light.style.transform = `translate(${x}px, ${f * box.height}px)`;
      t.list.forEach((s, i) => s.classList.toggle('is-done', i < index));
    }
    // Мобильная версия: линия прогресса, подпись шага и кнопка «Дальше»
    const steps = demo.querySelector('.demo__steps');
    const cap = demo.querySelector('[data-demo-cap]');
    const next = demo.querySelector('[data-demo-next]');
    const phone = window.matchMedia('(max-width: 640px)');
    function syncMobile() {
      const n = t.list.length;
      steps.style.setProperty('--p', String(index / (n - 1)));
      t.list.forEach((s, i) => s.classList.toggle('is-done', i < index));
      if (cap) {
        const d = t.list[index].querySelector('.demo__d');
        cap.innerHTML = '';
        const b = document.createElement('b');
        b.textContent = `Шаг ${index + 1} из ${n}`;
        cap.append(b, d ? d.textContent : '');
      }
      if (next) {
        const last = index === n - 1;
        next.textContent = last ? 'Посмотреть сначала' : `Дальше: ${t.list[index + 1].querySelector('.demo__k').textContent}`;
        next.classList.toggle('is-again', last);
      }
    }
    // На телефоне после нажатия пользователем шаги больше не листаются сами
    const stopOnPhone = () => {
      if (!phone.matches || userPaused) return;
      userPaused = true;
      toggle.setAttribute('aria-label', 'Продолжить показ');
    };
    t.list.forEach((s) => s.addEventListener('click', stopOnPhone, { capture: true }));
    if (next) next.addEventListener('click', () => {
      stopOnPhone();
      t.select(t.list[(index + 1) % t.list.length], false);
      const top = steps.getBoundingClientRect().top;
      if (top < 84) window.scrollBy({ top: top - 92, behavior: 'smooth' });
    });
    window.addEventListener('resize', placeLight);
    requestAnimationFrame(placeLight);
    syncMobile();
    const toggle = demo.querySelector('[data-demo-toggle]');
    demo.style.setProperty('--dur', DUR + 'ms');

    const playing = () => inView && !held && !userPaused;
    function restart() {
      clearTimeout(timer);
      const on = playing();
      demo.classList.toggle('is-playing', on);
      // перезапуск полоски прогресса
      const cur = t.list[index];
      cur.style.setProperty('--x', '');
      void cur.offsetWidth;
      if (on) timer = setTimeout(() => t.select(t.list[(index + 1) % t.list.length], false), DUR);
    }
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.setAttribute('aria-label', userPaused ? 'Продолжить показ' : 'Остановить показ');
      restart();
    });
    toggle.setAttribute('aria-label', userPaused ? 'Продолжить показ' : 'Остановить показ');
    demo.addEventListener('pointerenter', () => { held = true; restart(); });
    demo.addEventListener('pointerleave', () => { held = false; restart(); });
    demo.addEventListener('focusin', () => { held = true; restart(); });
    demo.addEventListener('focusout', (e) => { if (!demo.contains(e.relatedTarget)) { held = false; restart(); } });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: 0.35 }).observe(demo);
  }

  // Возможности
  const mods = document.querySelector('[data-mods]');
  if (mods) tabs(mods);

  // Анкета
  const box = document.querySelector('[data-form]');
  if (box && FORM_URL) {
    const frame = document.createElement('iframe');
    frame.src = FORM_URL;
    frame.title = 'Анкета Orbis';
    frame.loading = 'lazy';
    frame.setAttribute('allow', 'clipboard-write');
    const empty = box.querySelector('[data-form-empty]');
    empty.replaceWith(frame);
    const legal = box.querySelector('[data-form-legal]');
    if (legal) legal.hidden = false;
    // Яндекс Формы сообщают свою высоту — подгоняем окно, чтобы не было второй прокрутки
    window.addEventListener('message', (e) => {
      if (e.origin !== 'https://forms.yandex.ru' || e.source !== frame.contentWindow) return;
      let d = e.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
      const h = d && Number(d['iframe-height']);
      if (h > 200 && h < 10000) frame.style.height = h + 'px';
    });
  }
})();
