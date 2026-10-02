(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  };

  // All factual content is copied verbatim from the original project's config.js.
  function detail(label, value, { copy = false, numeric = false, href, wide = false } = {}) {
    const node = element('div', `detail${wide ? ' wide' : ''}`);
    const row = element('div', 'detail-value');
    const strong = element('strong', numeric ? 'numeric' : '', href ? '' : value);
    if (href) {
      const link = element('a', '', value);
      link.href = href;
      strong.append(link);
    }
    row.append(strong);
    if (copy) {
      const button = element('button', 'copy-button');
      button.type = 'button';
      button.dataset.copy = value;
      button.dataset.label = label;
      button.setAttribute('aria-label', `Копировать ${label}`);
      button.title = `Копировать ${label}`;
      button.append(icon('copy'));
      row.append(button);
    }
    node.append(element('span', 'detail-label', label), row);
    return node;
  }

  function renderSeller() {
    const s = config.seller;
    $('#seller-content').append(
      detail('ИНН', s.inn, { copy: true, numeric: true }),
      detail('ОГРНИП', s.ogrnip, { copy: true, numeric: true }),
      detail('Юридический адрес', s.legalAddress),
      detail('Почтовый адрес', s.postalAddress),
      detail('Дата регистрации', s.registrationDate),
      detail('ОКВЭД по карте партнёра', s.okved),
      detail('Телефон', s.phone, { copy: true, href: `tel:${s.phoneLink}` }),
      detail('Электронная почта', s.email, { copy: true, href: `mailto:${s.email}` })
    );
    const b = s.bank;
    const combined = `Расчётный счёт: ${b.account}\nБанк: ${b.name}\nБИК: ${b.bik}\nКорреспондентский счёт: ${b.correspondentAccount}`;
    $('#bank-content').append(
      detail('Расчётный счёт', b.account, { copy: true }),
      detail('Банк', b.name),
      detail('БИК', b.bik, { copy: true }),
      detail('Корреспондентский счёт', b.correspondentAccount, { copy: true })
    );
    const all = detail('Все банковские реквизиты', 'Скопировать одним нажатием', { copy: true, wide: true });
    all.querySelector('button').dataset.copy = combined;
    $('#bank-content').append(all);
  }

  function updateSchedule() {
    const s = config.schedule;
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone: s.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const minutes = Number(parts.find(p => p.type === 'hour').value) * 60 + Number(parts.find(p => p.type === 'minute').value);
    const toMinutes = value => value.split(':').reduce((hours, part) => hours * 60 + Number(part), 0);
    const open = minutes >= toMinutes(s.open) && minutes < toMinutes(s.close);
    document.body.dataset.open = String(open);
    $$('[data-status]').forEach(node => { node.textContent = open ? 'Сейчас открыто' : 'Сейчас закрыто'; });
    $('#next-opening').textContent = open ? '' : `Следующее открытие: ${minutes < toMinutes(s.open) ? 'сегодня' : 'завтра'} в ${s.open}`;
  }

  function renderPhones() {
    const render = (items, target) => items.forEach(item => {
      const link = element('a', 'phone-link');
      link.href = `tel:${item.tel || item.number}`;
      link.setAttribute('aria-label', `Позвонить: ${item.name}, ${item.number}`);
      const mark = element('span', 'phone-icon');
      mark.append(icon('phone'));
      link.append(mark, element('span', 'phone-name', item.name), element('strong', 'phone-number', item.number));
      $(target).append(link);
    });
    render(config.emergencyPhones, '#emergency-list');
    render(config.authorityPhones, '#authority-list');
  }

  // Local page images avoid remote PDF libraries, file:// restrictions and mobile PDF embeds.
  // The unmodified source PDF remains available via both original-file actions.
  const documents = config.documents.map(doc => ({
    ...doc,
    pageImages: doc.type === 'pdf'
      ? Array.from({ length: doc.pages }, (_, i) => `assets/documents/egrip-page-${i + 1}.png`)
      : [doc.path]
  }));
  function renderDocuments() {
    documents.forEach(doc => {
      const button = element('button', 'document-card');
      button.type = 'button';
      button.setAttribute('aria-label', `Открыть ${doc.title}`);
      button.dataset.document = doc.id;
      const preview = element('span', 'document-thumbnail');
      const img = new Image();
      img.src = doc.thumbnail;
      img.alt = doc.type === 'pdf' ? 'Первая страница ЕГРИП' : 'Свидетельство ИНН';
      img.loading = 'lazy';
      img.decoding = 'async';
      preview.append(img);
      const text = element('span', 'document-text');
      const action = element('span', 'document-open', 'Открыть документ');
      action.append(icon('arrow'));
      text.append(
        element('span', 'document-meta', doc.type === 'pdf' ? '3 страницы · PDF' : '1 страница · JPG'),
        element('span', 'document-title', doc.id === 'inn' ? 'ИНН' : 'ЕГРИП'),
        element('span', 'document-description', doc.title), action
      );
      button.append(preview, text);
      button.addEventListener('click', () => openDocument(doc));
      $('#document-list').append(button);
    });
  }

  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400);
  }
  async function copyText(button) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Use local fallback');
      await navigator.clipboard.writeText(button.dataset.copy);
    } catch {
      const area = element('textarea');
      area.value = button.dataset.copy;
      area.setAttribute('aria-label', 'Значение для копирования');
      area.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
      document.body.append(area);
      area.focus();
      area.select();
      area.setSelectionRange(0, area.value.length);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Report failure honestly below. */ }
      area.remove();
      button.focus({ preventScroll: true });
      if (!copied) { toast('Не удалось скопировать. Выделите значение вручную.'); return; }
    }
    const labels = { 'ИНН': 'ИНН скопирован', 'ОГРНИП': 'ОГРНИП скопирован', 'Электронная почта': 'Email скопирован', 'Все банковские реквизиты': 'Банковские реквизиты скопированы' };
    toast(labels[button.dataset.label] || `${button.dataset.label} скопирован`);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyText(button);
  });

  const modal = $('#document-modal');
  const stage = $('#modal-view');
  const frame = $('#page-frame');
  const pageImage = $('#document-page');
  const viewer = { doc: null, page: 0, zoom: 1, baseWidth: 0, baseHeight: 0, lastFocus: null, originalOverflow: '' };
  let loadVersion = 0;
  function updateControls() {
    $('#page-count').textContent = `${viewer.page + 1} / ${viewer.doc.pageImages.length}`;
    $('#page-prev').disabled = viewer.page === 0;
    $('#page-next').disabled = viewer.page === viewer.doc.pageImages.length - 1;
    $('#zoom-out').disabled = viewer.zoom <= 1;
    $('#zoom-in').disabled = viewer.zoom >= 4;
    $('#zoom-reset').textContent = `${Math.round(viewer.zoom * 100)}%`;
  }
  function fitPage(resetScroll = false) {
    if (!modal.open || !pageImage.naturalWidth) return;
    const width = Math.max(1, stage.clientWidth - 32);
    const height = Math.max(1, stage.clientHeight - 32);
    const ratio = Math.min(width / pageImage.naturalWidth, height / pageImage.naturalHeight);
    viewer.baseWidth = pageImage.naturalWidth * ratio;
    viewer.baseHeight = pageImage.naturalHeight * ratio;
    frame.style.width = `${viewer.baseWidth * viewer.zoom}px`;
    frame.style.height = `${viewer.baseHeight * viewer.zoom}px`;
    if (resetScroll) stage.scrollTo(0, 0);
  }
  function setZoom(value, anchor) {
    const before = viewer.zoom;
    const next = Math.max(1, Math.min(4, value));
    const rect = frame.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const x = anchor?.x ?? bounds.left + stage.clientWidth / 2;
    const y = anchor?.y ?? bounds.top + stage.clientHeight / 2;
    const relativeX = (x - rect.left) / before;
    const relativeY = (y - rect.top) / before;
    viewer.zoom = next;
    fitPage();
    const after = frame.getBoundingClientRect();
    stage.scrollLeft += after.left + relativeX * next - x;
    stage.scrollTop += after.top + relativeY * next - y;
    if (next === 1) stage.scrollTo(0, 0);
    updateControls();
  }
  function showPage(index) {
    if (index < 0 || index >= viewer.doc.pageImages.length) return;
    viewer.page = index;
    viewer.zoom = 1;
    const version = ++loadVersion;
    stage.classList.add('is-loading');
    stage.setAttribute('aria-busy', 'true');
    $('#viewer-error').hidden = true;
    frame.hidden = false;
    pageImage.onload = () => {
      if (version !== loadVersion) return;
      stage.classList.remove('is-loading');
      stage.setAttribute('aria-busy', 'false');
      fitPage(true);
    };
    pageImage.onerror = () => {
      if (version !== loadVersion) return;
      stage.classList.remove('is-loading');
      stage.setAttribute('aria-busy', 'false');
      frame.hidden = true;
      $('#viewer-error').hidden = false;
    };
    pageImage.alt = `${viewer.doc.title}, страница ${index + 1} из ${viewer.doc.pageImages.length}`;
    pageImage.src = viewer.doc.pageImages[index];
    updateControls();
  }
  function openDocument(doc) {
    viewer.lastFocus = document.activeElement;
    viewer.originalOverflow = document.body.style.overflow;
    viewer.doc = doc;
    $('#modal-title').textContent = doc.id === 'inn' ? 'Свидетельство ИНН' : doc.title;
    ['#modal-download', '#modal-new', '#error-original'].forEach(id => { $(id).href = doc.path; });
    modal.showModal();
    document.body.style.overflow = 'hidden';
    showPage(0);
    $('#modal-close').focus();
  }
  async function closeDocument() {
    if (document.fullscreenElement === document.documentElement) {
      try { await document.exitFullscreen(); } catch { /* Closing the dialog remains available. */ }
    }
    if (modal.open) modal.close();
  }
  modal.addEventListener('close', () => {
    loadVersion++;
    document.body.style.overflow = viewer.originalOverflow;
    pointers.clear();
    viewer.lastFocus?.focus({ preventScroll: true });
  });
  modal.addEventListener('cancel', event => { event.preventDefault(); closeDocument(); });
  $('#modal-close').addEventListener('click', closeDocument);
  $('#page-prev').addEventListener('click', () => showPage(viewer.page - 1));
  $('#page-next').addEventListener('click', () => showPage(viewer.page + 1));
  $('#zoom-in').addEventListener('click', () => setZoom(viewer.zoom + .5));
  $('#zoom-out').addEventListener('click', () => setZoom(viewer.zoom - .5));
  $('#zoom-reset').addEventListener('click', () => setZoom(1));
  // The dialog always fills the viewport; Fullscreen API is an optional browser enhancement.
  if (!document.documentElement.requestFullscreen || !document.fullscreenEnabled) $('#modal-fullscreen').hidden = true;
  $('#modal-fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { toast('Просмотр уже занимает весь доступный экран'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const full = document.fullscreenElement === document.documentElement;
    $('#modal-fullscreen').setAttribute('aria-label', full ? 'Выйти из полного экрана' : 'Полный экран');
    $('#modal-fullscreen').setAttribute('aria-pressed', String(full));
    requestAnimationFrame(() => fitPage());
  });
  modal.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const items = [...modal.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')].filter(n => n.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const actions = {
      ArrowLeft: () => viewer.zoom === 1 ? showPage(viewer.page - 1) : stage.scrollBy(-100, 0),
      ArrowRight: () => viewer.zoom === 1 ? showPage(viewer.page + 1) : stage.scrollBy(100, 0),
      ArrowUp: () => stage.scrollBy(0, -100), ArrowDown: () => stage.scrollBy(0, 100),
      '+': () => setZoom(viewer.zoom + .5), '=': () => setZoom(viewer.zoom + .5),
      '-': () => setZoom(viewer.zoom - .5), '0': () => setZoom(1)
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  });

  // Pointer Events support one-finger paging/panning and anchored two-finger pinch zoom.
  const pointers = new Map();
  let gesture = null;
  const distance = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('a') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) gesture = { x: event.clientX, y: event.clientY, scrollX: stage.scrollLeft, scrollY: stage.scrollTop, swipe: viewer.zoom === 1, pinch: false };
    if (pointers.size === 2) gesture = { pinch: true, distance: distance(), zoom: viewer.zoom, swipe: false };
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && gesture.pinch) {
      const [a, b] = [...pointers.values()];
      setZoom(gesture.zoom * distance() / Math.max(gesture.distance, 1), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    } else if (pointers.size === 1 && !gesture.pinch && !gesture.swipe) {
      stage.scrollLeft = gesture.scrollX - (event.clientX - gesture.x);
      stage.scrollTop = gesture.scrollY - (event.clientY - gesture.y);
    }
  });
  function finishPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    if (event.type === 'pointerup' && pointers.size === 1 && gesture?.swipe && !gesture.pinch) {
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) showPage(viewer.page + (dx < 0 ? 1 : -1));
    }
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const [point] = pointers.values();
      gesture = { x: point.x, y: point.y, scrollX: stage.scrollLeft, scrollY: stage.scrollTop, swipe: false, pinch: false };
    } else if (!pointers.size) gesture = null;
  }
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('dblclick', event => setZoom(viewer.zoom === 1 ? 2 : 1, { x: event.clientX, y: event.clientY }));
  stage.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(viewer.zoom + (event.deltaY < 0 ? .2 : -.2), { x: event.clientX, y: event.clientY });
  }, { passive: false });
  new ResizeObserver(() => fitPage()).observe(stage);

  renderSeller();
  renderPhones();
  renderDocuments();
  updateSchedule();
  setInterval(updateSchedule, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSchedule(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        $$('.mobile-nav a').forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    ['seller', 'documents', 'schedule', 'phones'].forEach(id => observer.observe($(`#${id}`)));
  }
})();
