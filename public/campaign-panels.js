(() => {
  'use strict';
  const menu = document.querySelector('.campaign-menu');
  if (!menu) return;
  const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.campaign-panel'));
  const aliases = { 'importance-title': 'local-access', 'requests-title': 'local-access' };

  function selectPanel(focus = false) {
    const requested = location.hash.slice(1);
    const id = requested === 'campaign' ? document.body.dataset.campaignPanel : aliases[requested] || requested;
    const active = panels.find(panel => panel.id === id || panel.querySelector(`[id="${CSS.escape(id)}"]`)) || panels[0];
    for (const panel of panels) panel.hidden = panel !== active;
    for (const link of links) {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    const selected = links.find(link => link.hash === `#${active.id}`);
    document.title = active.id === 'overview' ? 'Keep Gronlid Library Open — The Campaign' : `${selected.textContent} — Gronlid Library Campaign`;
    document.body.dataset.campaignPanel = active.id;
    if (focus) {
      const heading = document.getElementById(active.getAttribute('aria-labelledby'));
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('campaignpanelchange', { detail: { id: active.id } }));
  }

  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !menu.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    selectPanel(true);
  });
  addEventListener('popstate', () => selectPanel(true));
  addEventListener('hashchange', () => selectPanel(true));
  document.body.classList.add('has-campaign-panels');
  selectPanel();
})();
