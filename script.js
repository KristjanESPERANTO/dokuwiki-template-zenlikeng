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

  mobileViewport.addEventListener('change', updateMenuVisibility);

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

  mobileViewport.addEventListener('change', updateSidebarVisibility);

  updateSidebarVisibility();
}

function setupResponsiveDiff() {
  const form = document.querySelector('.diffoptions form');
  const select = form?.querySelector('select[name="difftype"]');
  if (!form || !select) return;

  const manualChoiceKey = 'zenlike-diff-manual-choice';
  const desktopTypeKey = 'zenlike-diff-desktop-type';
  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');
  let automaticSubmission = false;

  function hasManualChoice() {
    if (
      new document.defaultView.URL(
        document.defaultView.location.href,
      ).searchParams.has('difftype')
    ) {
      return true;
    }

    try {
      return (
        document.defaultView.sessionStorage.getItem(manualChoiceKey) === 'true'
      );
    } catch {
      return false;
    }
  }

  function rememberManualChoice() {
    if (automaticSubmission) return;

    try {
      document.defaultView.sessionStorage.setItem(manualChoiceKey, 'true');
      document.defaultView.sessionStorage.removeItem(desktopTypeKey);
    } catch {
      // Keep the selected view when session storage is unavailable.
    }
  }

  form.addEventListener('submit', rememberManualChoice);
  select.addEventListener('change', rememberManualChoice);

  function submitDiffType(type) {
    select.value = type;
    automaticSubmission = true;
    try {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.submit();
      }
    } finally {
      automaticSubmission = false;
    }
  }

  function updateDiffType() {
    if (hasManualChoice()) return;

    if (mobileViewport.matches) {
      if (select.value !== 'sidebyside') return;

      try {
        document.defaultView.sessionStorage.setItem(
          desktopTypeKey,
          select.value,
        );
      } catch {
        return;
      }

      submitDiffType('inline');
      return;
    }

    let desktopType;
    try {
      desktopType = document.defaultView.sessionStorage.getItem(desktopTypeKey);
    } catch {
      return;
    }

    if (!desktopType) return;
    document.defaultView.sessionStorage.removeItem(desktopTypeKey);
    if (select.value !== desktopType) submitDiffType(desktopType);
  }

  mobileViewport.addEventListener('change', updateDiffType);

  updateDiffType();
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
  systemPreference.addEventListener('change', updateSystemTheme);

  updateTheme();
  updateToggleLocation();
  mobileViewport.addEventListener('change', updateToggleLocation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setupSiteMenuToggle();
    setupSidebarToggle();
    setupResponsiveDiff();
    setupThemePreference();
  });
} else {
  setupSiteMenuToggle();
  setupSidebarToggle();
  setupResponsiveDiff();
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
