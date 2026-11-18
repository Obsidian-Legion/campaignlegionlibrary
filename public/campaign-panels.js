(() => {
  'use strict';
  const menu = document.querySelector('.campaign-menu');
  if (!menu) return;
  const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.campaign-panel'));
  const essayPages = Array.from(document.querySelectorAll('.essay-page'));
  const essayNavigation = document.querySelector('.essay-pagination');
  const essayLinks = Array.from(essayNavigation?.querySelectorAll('a') || []);
  const aliases = { 'importance-title': 'local-access', 'requests-title': 'local-access' };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  for (const surface of document.querySelectorAll('.gold-button, .explanation-page .petition-link')) {
    surface.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches || document.body.classList.contains('motion-paused')) return;
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty('--gold-x', `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(1)}%`);
      surface.style.setProperty('--gold-y', `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(1)}%`);
    });
    surface.addEventListener('pointerleave', () => {
      surface.style.removeProperty('--gold-x');
      surface.style.removeProperty('--gold-y');
    });
  }

  function selectPanel(focus = false) {
    const requested = location.hash.slice(1);
    const id = requested === 'campaign' ? document.body.dataset.campaignPanel : aliases[requested] || requested;
    const active = panels.find(panel => panel.id === id || panel.querySelector(`[id="${CSS.escape(id)}"]`)) || panels[0];
    for (const panel of panels) panel.hidden = panel !== active;
    const essayPage = essayPages.find(part => part.id === id || part.querySelector(`[id="${CSS.escape(id)}"]`)) || essayPages[0];
    for (const part of essayPages) part.hidden = part !== essayPage;
    for (const link of essayLinks) {
      if (link.hash === `#${essayPage.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    for (const link of links) {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const selected = links.find(link => link.hash === `#${active.id}`);
    document.title = active.id === 'overview' ? 'Keep Gronlid Library Open — The Campaign' : `${selected.textContent} — Gronlid Library Campaign`;
    document.body.dataset.campaignPanel = active.id;
    if (focus) {
      const focusRegion = active.id === 'children-literacy' && id !== active.id ? essayPage : active;
      const heading = document.getElementById(focusRegion.getAttribute('aria-labelledby'));
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('campaignpanelchange', { detail: { id: active.id } }));
  }

  function navigate(event) {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    selectPanel(true);
  }
  menu.addEventListener('click', navigate);
  essayNavigation?.addEventListener('click', navigate);
  if (essayNavigation) essayNavigation.hidden = false;
  addEventListener('popstate', () => selectPanel(true));
  addEventListener('hashchange', () => selectPanel(true));
  document.body.classList.add('has-campaign-panels');
  selectPanel();
})();
