// Zenlike JavaScript Functions

function setupSiteMenuToggle() {
  const toggle = document.getElementById('toggle_sitemenu');
  const menuContent = document.getElementById('zenlike__menucontent');
  const search = document.getElementById('search');
  const pageTools = document.getElementById('dokuwiki__pagetools');
  const desktopMenu = document.getElementById('desktop-tools-content');
  const desktopPageToolsContent = document.getElementById(
    'desktop-pagetools-content',
  );
  const desktopSiteTools = document.querySelector('#desktop-sitetools ul');
  if (!toggle || !menuContent || !search || !desktopMenu) return;

  if (desktopSiteTools) {
    const userActions = document.querySelectorAll('#usertools > ul > li');
    if (desktopSiteTools.children.length) {
      userActions[0]?.classList.add('user-tools-start');
    }
    userActions.forEach((item) => desktopSiteTools.append(item));

    const userTools = document.getElementById('usertools');
    if (userTools && !userTools.querySelector('li')) {
      userTools.closest('li.menusplit')?.remove();
    }
  }

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
  const pageToolsHome = pageTools?.parentElement;
  const pageToolsNext = pageTools?.nextSibling;
  function updatePageToolsLocation() {
    if (!pageTools || !pageToolsHome || !desktopPageToolsContent) return;

    if (mobileViewport.matches) {
      pageToolsHome.insertBefore(
        pageTools,
        pageToolsNext?.parentElement === pageToolsHome ? pageToolsNext : null,
      );
      pageTools.hidden = true;
      return;
    }

    desktopPageToolsContent.append(pageTools);
    pageTools.hidden = false;
  }

  function updateMenuVisibility() {
    if (mobileViewport.matches) {
      menuContent.insertBefore(search, menuContent.firstChild);
    } else {
      searchHome.appendChild(search);
    }

    toggle.hidden = false;
    menuContent.hidden = mobileViewport.matches;
    desktopMenu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute(
      'aria-controls',
      mobileViewport.matches ? menuContent.id : desktopMenu.id,
    );
    toggle.setAttribute(
      'aria-label',
      mobileViewport.matches
        ? toggle.dataset.mobileLabel
        : toggle.dataset.desktopLabel,
    );
    updatePageToolsLocation();
  }

  function closeMenu(restoreFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    if (mobileViewport.matches) menuContent.hidden = true;
    else desktopMenu.hidden = true;
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if (mobileViewport.matches) menuContent.hidden = expanded;
    else desktopMenu.hidden = expanded;
  });

  menuContent.addEventListener('click', function (event) {
    if (mobileViewport.matches && event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (
      event.key !== 'Escape' ||
      toggle.getAttribute('aria-expanded') !== 'true'
    )
      return;
    closeMenu(true);
  });

  document.addEventListener('click', function (event) {
    if (
      mobileViewport.matches ||
      desktopMenu.hidden ||
      toggle.contains(event.target)
    )
      return;
    if (!desktopMenu.contains(event.target) || event.target.closest('a')) {
      closeMenu();
    }
  });

  mobileViewport.addEventListener('change', updateMenuVisibility);

  updateMenuVisibility();
  return closeMenu;
}

function setupBackToTopVisibility() {
  const content = document.querySelector('#dokuwiki__content .page');
  const backToTop = document.getElementById('zenlike__back-to-top');
  if (!content || !backToTop) return;

  function updateVisibility() {
    backToTop.hidden =
      content.offsetHeight <= document.defaultView.innerHeight * 2;
  }

  document.defaultView.addEventListener('resize', updateVisibility);
  document.defaultView.addEventListener('load', updateVisibility, {
    once: true,
  });
  if (document.defaultView.ResizeObserver) {
    new document.defaultView.ResizeObserver(updateVisibility).observe(content);
  }
  updateVisibility();
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

function setupThemePreference(closeSiteMenu) {
  const storageKey = 'zenlike-theme';
  const modes = ['system', 'light', 'dark'];
  const toolsSelect = document.querySelector('.mobile-tools select');
  const mobileTools = document.querySelector('.mobile-tools-list');
  const mobileTheme = document.getElementById('mobile-theme');
  const desktopTheme = document.getElementById('desktop-theme');
  if (!desktopTheme && !mobileTheme) return;

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
  if (modes.includes(savedPreference)) {
    preference = savedPreference;
  }

  function updateTheme() {
    const isDark =
      preference === 'dark' ||
      (preference === 'system' && systemPreference.matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (mobileTheme) mobileTheme.value = preference;
    if (desktopTheme) desktopTheme.value = preference;
  }

  if (toolsSelect && mobileTools && mobileTheme) {
    const pageTools = document.getElementById('dokuwiki__pagetools');
    const availableActions = new Set(
      [...toolsSelect.options].map((option) => option.value),
    );
    mobileTools.querySelectorAll('[data-mobile-action]').forEach((button) => {
      if (!availableActions.has(button.dataset.mobileAction)) {
        button.parentElement.remove();
        return;
      }
      button.addEventListener('click', function () {
        toolsSelect.value = button.dataset.mobileAction;
        if (mobileViewport.matches) closeSiteMenu?.(true);
        toolsSelect.dispatchEvent(
          new document.defaultView.Event('change', { bubbles: true }),
        );
      });
    });

    const discussionLink = pageTools?.querySelector('li.discussion a');
    const pageToolsList = mobileTools.querySelector(
      '[data-mobile-group="page"] ul',
    );
    if (discussionLink && pageToolsList) {
      const item = document.createElement('li');
      item.className = 'discussion';
      item.append(discussionLink.cloneNode(true));
      pageToolsList.append(item);
    }

    const userPage = document.querySelector('#desktop-sitetools li.userpage');
    const userToolsList = mobileTools.querySelector(
      '[data-mobile-group="user"] ul',
    );
    if (userPage && userToolsList) {
      userToolsList.append(userPage.cloneNode(true));
    }

    mobileTools.querySelectorAll('.mobile-tools-group').forEach((group) => {
      group.hidden = !group.querySelector('li');
    });
    toolsSelect.closest('form').hidden = true;
    mobileTools.hidden = false;
  }

  [mobileTheme, desktopTheme].filter(Boolean).forEach((themeSelect) => {
    themeSelect.addEventListener('change', function () {
      preference = themeSelect.value;
      storePreference(preference);
      updateTheme();
    });
  });

  const updateSystemTheme = function () {
    if (preference === 'system') updateTheme();
  };
  systemPreference.addEventListener('change', updateSystemTheme);

  updateTheme();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    const closeSiteMenu = setupSiteMenuToggle();
    setupBackToTopVisibility();
    setupSidebarToggle();
    setupResponsiveDiff();
    setupThemePreference(closeSiteMenu);
  });
} else {
  const closeSiteMenu = setupSiteMenuToggle();
  setupBackToTopVisibility();
  setupSidebarToggle();
  setupResponsiveDiff();
  setupThemePreference(closeSiteMenu);
}
