// Zenlike JavaScript Functions

function setupSiteMenuToggle() {
  const toggle = document.getElementById('toggle_sitemenu');
  const menuContent = document.getElementById('zenlike__menucontent');
  const search = document.getElementById('search');
  if (!toggle || !menuContent || !search) return;

  const searchInput = search.querySelector('input.edit');
  const searchButton = search.querySelector(
    'button[type="submit"], input[type="submit"]',
  );
  if (searchInput && searchButton) {
    const searchLabel =
      searchButton.tagName === 'INPUT'
        ? searchButton.value
        : searchButton.textContent.trim();
    searchInput.placeholder = `${searchLabel} ...`;
  }

  const searchHome = search.parentElement;
  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');

  function updateMenuVisibility() {
    if (mobileViewport.matches) {
      menuContent.insertBefore(search, menuContent.firstChild);
    } else {
      searchHome.appendChild(search);
    }

    toggle.hidden = !mobileViewport.matches;
    menuContent.hidden = mobileViewport.matches;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menuContent.hidden = true;
  }

  toggle.addEventListener('click', function () {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menuContent.hidden = expanded;
  });

  menuContent.addEventListener('click', function (event) {
    if (mobileViewport.matches && event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !mobileViewport.matches || menuContent.hidden)
      return;
    closeMenu();
    toggle.focus();
  });

  if (mobileViewport.addEventListener) {
    mobileViewport.addEventListener('change', updateMenuVisibility);
  } else {
    mobileViewport.addListener(updateMenuVisibility);
  }

  updateMenuVisibility();
}

function setupSidebarToggle() {
  const toggle = document.getElementById('toggle_sidebar');
  const sidebar = document.getElementById('dokuwiki__aside');
  if (!toggle || !sidebar) return;

  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');

  function setExpanded(expanded) {
    toggle.setAttribute('aria-expanded', String(expanded));
    sidebar.hidden = !expanded;
  }

  function updateSidebarVisibility() {
    const isMobile = mobileViewport.matches;
    toggle.hidden = !isMobile;
    setExpanded(!isMobile);
  }

  toggle.addEventListener('click', function () {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !mobileViewport.matches || sidebar.hidden) {
      return;
    }

    setExpanded(false);
    toggle.focus();
  });

  if (mobileViewport.addEventListener) {
    mobileViewport.addEventListener('change', updateSidebarVisibility);
  } else {
    mobileViewport.addListener(updateSidebarVisibility);
  }

  updateSidebarVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setupSiteMenuToggle();
    setupSidebarToggle();
  });
} else {
  setupSiteMenuToggle();
  setupSidebarToggle();
}

document.addEventListener('click', function (event) {
  const toggle = event.target.closest('#toggle_usertools');
  if (!toggle) return;

  const userTools = document.getElementById('usertools');
  if (!userTools) return;

  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  userTools.hidden = expanded;
});
