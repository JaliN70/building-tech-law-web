(function () {
  'use strict';

  const app = document.getElementById('app');
  const backBtn = document.getElementById('backBtn');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');
  const headerMojLink = document.getElementById('headerMojLink');
  const lawDateEl = document.getElementById('lawDate');
  const toast = document.getElementById('toast');

  document.getElementById('sysDate').textContent = APP.updated;
  document.getElementById('sysAuthor').textContent = APP.author;

  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isPackagedApp() {
    return location.protocol === 'file:';
  }

  function externalLinkAttrs() {
    return isPackagedApp() ? '' : ' target="_blank" rel="noopener"';
  }

  function openExternal(url) {
    if (window.Android && typeof Android.openExternal === 'function') {
      Android.openExternal(url);
      return;
    }
    window.open(url, '_blank') || (window.location.href = url);
  }

  function bindExternalLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href^="http"]').forEach((link) => {
      link.removeAttribute('target');
      if (!isPackagedApp()) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openExternal(link.href);
      });
    });
  }

  function getLaw(lawId) {
    return LAWS.find((law) => law.id === lawId);
  }

  function totalArticles(law) {
    return law.categories.reduce((n, cat) => n + (cat.articles ? cat.articles.length : 0), 0);
  }

  function categoryCount(law, cat) {
    if (cat.files) return `${(law.attachments || []).length} 份 PDF`;
    return `${cat.articles.length} 項法條`;
  }

  function articleDisplayTitle(art) {
    return `第 ${art} 條`;
  }

  function renderRootHome() {
    backBtn.hidden = true;
    pageTitle.textContent = APP.shortName;
    pageSub.textContent = '設計施工編 · 構造編 · 設備編';
    headerMojLink.href = 'https://law.moj.gov.tw/';
    lawDateEl.textContent = LAWS.map((law) => `${law.shortName} ${law.amended}`).join(' · ');

    const totalArts = LAWS.reduce((n, law) => n + totalArticles(law), 0);
    const totalCats = LAWS.reduce((n, law) => n + law.categories.filter((c) => !c.files).length, 0);

    const cards = LAWS.map((law, i) => `
      <li class="fade-up" style="animation-delay:${i * 0.04}s">
        <button type="button" class="cat-card book-card" data-law="${law.id}" aria-label="${escapeHtml(law.name)}">
          <span class="cat-icon" aria-hidden="true">${law.bookIcon}</span>
          <h2 class="cat-title">${escapeHtml(law.shortName)}</h2>
          <p class="cat-sub">${escapeHtml(law.amended)}</p>
          <span class="cat-count">${law.categories.filter((c) => !c.files).length} 類 · ${totalArticles(law)} 條</span>
        </button>
      </li>
    `).join('');

    app.innerHTML = `
      <section class="hero fade-up">
        <span class="hero-eyebrow">Building Technical Rules</span>
        <h2 class="hero-title">${escapeHtml(APP.name)}</h2>
        <p class="hero-desc">三編合併 · 共 ${totalCats} 類 · ${totalArts} 條，依編章節分類連結全國法規資料庫</p>
      </section>
      <p class="section-label">選擇編別</p>
      <ul class="cat-grid">${cards}</ul>
    `;

    app.querySelectorAll('[data-law]').forEach((btn) => {
      btn.addEventListener('click', () => navigateToLaw(btn.dataset.law));
    });
    bindExternalLinks(app);
  }

  function renderLawHome(lawId) {
    const law = getLaw(lawId);
    if (!law) {
      navigate('#/');
      return;
    }

    backBtn.hidden = false;
    pageTitle.textContent = law.shortName;
    pageSub.textContent = law.name;
    headerMojLink.href = law.fullUrl;
    lawDateEl.textContent = law.amended;

    const totalArts = totalArticles(law);
    const fileCats = law.categories.filter((c) => c.files).length;

    const cards = law.categories.map((cat, i) => `
      <li class="fade-up" style="animation-delay:${i * 0.03}s">
        <button type="button" class="cat-card" data-cat="${cat.id}" aria-label="${escapeHtml(cat.title)}">
          <span class="cat-icon" aria-hidden="true">${cat.icon}</span>
          <h2 class="cat-title">${escapeHtml(cat.title)}</h2>
          <p class="cat-sub">${escapeHtml(cat.subtitle)}</p>
          <span class="cat-count">${categoryCount(law, cat)}</span>
        </button>
      </li>
    `).join('');

    app.innerHTML = `
      <section class="hero fade-up">
        <span class="hero-eyebrow">${escapeHtml(law.heroEyebrow || 'Building Tech Code')}</span>
        <h2 class="hero-title">${escapeHtml(law.name)}</h2>
        <p class="hero-desc">共 ${law.categories.length - fileCats} 類 · ${totalArts} 條，依編章節分類連結全國法規資料庫</p>
        <a class="hero-cta" href="${law.fullUrl}"${externalLinkAttrs()}>
          完整法規
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </section>
      <p class="section-label">編章節分類</p>
      <ul class="cat-grid">${cards}</ul>
    `;

    app.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => navigateToCategory(lawId, btn.dataset.cat));
    });
    bindExternalLinks(app);
  }

  function renderAttachments(law, cat) {
    const attachments = law.attachments || [];
    const itemsHtml = attachments.map(
      (item, i) => `
      <li class="fade-up" style="animation-delay:${i * 0.025}s">
        <a class="art-btn" href="${escapeHtml(item.url)}"${externalLinkAttrs()}
           data-label="${escapeHtml(item.label)}">
          <span class="art-num">PDF</span>
          <span class="art-label">${escapeHtml(item.label)}</span>
          <svg class="art-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </li>
    `
    ).join('');

    app.innerHTML = `
      <header class="cat-header fade-up">
        <div class="cat-header-icon" aria-hidden="true">${cat.icon}</div>
        <h2 class="cat-header-title">${escapeHtml(cat.title)}</h2>
        <p class="cat-header-sub">${escapeHtml(cat.subtitle)}</p>
        <p class="cat-header-desc">${escapeHtml(cat.desc)}</p>
      </header>
      <p class="section-label">官方 PDF · 全國法規資料庫</p>
      <ul class="art-list">${itemsHtml}</ul>
    `;

    app.querySelectorAll('.art-btn').forEach((link) => {
      link.addEventListener('click', () => showToast(`開啟 ${link.dataset.label}`));
    });
    bindExternalLinks(app);
  }

  function renderCategory(lawId, catId) {
    const law = getLaw(lawId);
    if (!law) {
      navigate('#/');
      return;
    }

    const cat = law.categories.find((c) => c.id === catId);
    if (!cat) {
      navigateToLaw(lawId);
      return;
    }

    backBtn.hidden = false;
    pageTitle.textContent = cat.title;
    pageSub.textContent = `${law.shortName} · ${cat.subtitle}`;
    headerMojLink.href = law.fullUrl;
    lawDateEl.textContent = law.amended;

    if (cat.files) {
      renderAttachments(law, cat);
      return;
    }

    const articlesHtml = cat.articles
      .map(
        (item, i) => `
        <li class="fade-up" style="animation-delay:${i * 0.025}s">
          <a class="art-btn" href="${mojArticleUrl(law.pcode, item.art)}"${externalLinkAttrs()}
             data-art="${escapeHtml(item.art)}">
            <span class="art-num">${escapeHtml(item.art)}</span>
            <span class="art-label">
              ${escapeHtml(item.label)}
              ${item.note ? `<span class="art-note art-note--link">${escapeHtml(item.note)}</span>` : ''}
            </span>
            <svg class="art-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </li>
      `
      )
      .join('');

    app.innerHTML = `
      <header class="cat-header fade-up">
        <div class="cat-header-icon" aria-hidden="true">${cat.icon}</div>
        <h2 class="cat-header-title">${escapeHtml(cat.title)}</h2>
        <p class="cat-header-sub">${escapeHtml(cat.subtitle)}</p>
        <p class="cat-header-desc">${escapeHtml(cat.desc)}</p>
      </header>
      <p class="section-label">法條連結 · 全國法規資料庫</p>
      <ul class="art-list">${articlesHtml}</ul>
    `;

    app.querySelectorAll('.art-btn').forEach((link) => {
      link.addEventListener('click', () => {
        showToast(`開啟 ${articleDisplayTitle(link.dataset.art)}`);
      });
    });
    bindExternalLinks(app);
  }

  function parseHashParts() {
    const hash = location.hash.replace(/^#\/?/, '') || '';
    return hash.split('/').filter(Boolean).map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
  }

  function navigate(hash) {
    if (location.hash !== hash) {
      location.hash = hash;
    } else {
      route();
    }
  }

  function navigateToLaw(lawId) {
    navigate(`#/${encodeURIComponent(lawId)}`);
  }

  function navigateToCategory(lawId, catId) {
    navigate(`#/${encodeURIComponent(lawId)}/${encodeURIComponent(catId)}`);
  }

  function route() {
    const parts = parseHashParts();

    if (parts.length === 0) {
      renderRootHome();
      return;
    }

    if (parts.length === 1) {
      renderLawHome(parts[0]);
      return;
    }

    renderCategory(parts[0], parts.slice(1).join('/'));
  }

  backBtn.addEventListener('click', () => {
    const parts = parseHashParts();
    if (parts.length >= 2) navigateToLaw(parts[0]);
    else navigate('#/');
  });

  window.addEventListener('hashchange', route);
  bindExternalLinks(document);
  route();
})();
