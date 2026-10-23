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

function setupThemePreference() {
  const toggle = document.getElementById('toggle_theme');
  if (!toggle) return;

  const storageKey = 'zenlike-theme';
  const modes = ['system', 'light', 'dark'];
  const themeHome = toggle.parentElement;
  const menuContent = document.getElementById('zenlike__menucontent');
  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');
  const systemPreference = document.defaultView.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  const root = document.documentElement;
  let preference = 'system';

  function readStoredPreference() {
    try {
      return document.defaultView.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function storePreference(value) {
    try {
      document.defaultView.localStorage.setItem(storageKey, value);
      return true;
    } catch {
      return false;
    }
  }

  const savedPreference = readStoredPreference();
  if (['system', 'light', 'dark'].includes(savedPreference)) {
    preference = savedPreference;
  }

  function updateTheme() {
    const isDark =
      preference === 'dark' ||
      (preference === 'system' && systemPreference.matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    const currentIndex = modes.indexOf(preference);
    const nextPreference = modes[(currentIndex + 1) % modes.length];
    const currentLabel = toggle.dataset[`theme${capitalize(preference)}Label`];
    const nextLabel = toggle.dataset[`theme${capitalize(nextPreference)}Label`];
    const accessibleLabel = `${toggle.dataset.appearanceLabel}: ${currentLabel}. ${toggle.dataset.nextLabel}: ${nextLabel}`;
    toggle.setAttribute('aria-label', accessibleLabel);
    toggle.title = accessibleLabel;
    toggle.querySelector('.appearance-icon').textContent = {
      system: '◐',
      light: '☀',
      dark: '☾',
    }[preference];
  }

  function capitalize(value) {
    return value[0].toUpperCase() + value.slice(1);
  }

  function updateToggleLocation() {
    if (mobileViewport.matches && menuContent) {
      menuContent.appendChild(toggle);
      toggle.classList.add('theme-toggle--menu');
    } else {
      themeHome.appendChild(toggle);
      toggle.classList.remove('theme-toggle--menu');
    }
  }

  toggle.addEventListener('click', function () {
    preference = modes[(modes.indexOf(preference) + 1) % modes.length];
    storePreference(preference);
    updateTheme();
  });

  const updateSystemTheme = function () {
    if (preference === 'system') updateTheme();
  };
  if (systemPreference.addEventListener) {
    systemPreference.addEventListener('change', updateSystemTheme);
  } else {
    systemPreference.addListener(updateSystemTheme);
  }

  updateTheme();
  updateToggleLocation();
  if (mobileViewport.addEventListener) {
    mobileViewport.addEventListener('change', updateToggleLocation);
  } else {
    mobileViewport.addListener(updateToggleLocation);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setupSiteMenuToggle();
    setupSidebarToggle();
    setupThemePreference();
  });
} else {
  setupSiteMenuToggle();
  setupSidebarToggle();
  setupThemePreference();
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
