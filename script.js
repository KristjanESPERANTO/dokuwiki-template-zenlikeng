// Zenlike JavaScript Functions

function setupCodeCopyButtons() {
  document
    .querySelectorAll('.dokuwiki pre.code, .dokuwiki pre.file')
    .forEach((code) => {
      let copyButton;
      let copyLabel;
      const updateButton = () => {
        const button = code.querySelector('.code-copy-btn');
        if (!button) return;
        if (button !== copyButton) {
          copyButton = button;
          copyLabel = button.textContent.trim();
          button.setAttribute('aria-live', 'polite');
          if (!code.querySelector(':scope > .code-copy-content')) {
            const content = document.createElement('span');
            content.className = 'code-copy-content';
            [...code.childNodes].forEach((node) => {
              if (node !== button) content.append(node);
            });
            code.prepend(content);
          }
        }
        const label = button.textContent.trim();
        button.title = label;
        button.dataset.iconAction = label === copyLabel ? 'copy' : 'feedback';
      };
      new document.defaultView.MutationObserver(updateButton).observe(code, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      updateButton();
    });
}

function setupSectionEditButtons() {
  document.querySelectorAll('.dokuwiki .secedit button').forEach((button) => {
    const label = button.textContent.trim();
    const section = button.title.trim();
    if (section && section !== label) button.title = `${label}: ${section}`;
  });
}

function setupSiteMenu() {
  const header = document.getElementById('zenlikeheader');
  const toggle = document.getElementById('toggle_sitemenu');
  const tools = document.getElementById('zenlike__tools');
  if (!header || !toggle || !tools) return;

  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open, restoreFocus = false) {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  header.addEventListener('click', function (event) {
    if (event.target.closest('#zenlike__menucontent a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) setOpen(false, true);
  });

  // On desktop the tools open as a dropdown that closes on outside clicks.
  document.addEventListener('click', function (event) {
    if (!isOpen() || mobileViewport.matches) return;
    if (!toggle.contains(event.target) && !tools.contains(event.target)) {
      setOpen(false);
    }
  });

  mobileViewport.addEventListener('change', function () {
    setOpen(false);
  });
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
  if (!toggle) return;

  const mobileViewport = document.defaultView.matchMedia('(max-width: 42em)');
  const isExpanded = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', function () {
    toggle.setAttribute('aria-expanded', String(!isExpanded()));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !mobileViewport.matches || !isExpanded()) {
      return;
    }

    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
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
  const group = document.getElementById('zenlike-theme');
  if (!group) return;

  const storageKey = 'zenlike-theme';
  const radios = [...group.querySelectorAll('input[type="radio"]')];
  const modes = radios.map((radio) => radio.value);
  const systemPreference = document.defaultView.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  const root = document.documentElement;
  let preference = 'system';

  try {
    const savedPreference =
      document.defaultView.localStorage.getItem(storageKey);
    if (modes.includes(savedPreference)) preference = savedPreference;
  } catch {
    // Fall back to the system preference when storage is unavailable.
  }

  function updateTheme() {
    const isDark =
      preference === 'dark' ||
      (preference === 'system' && systemPreference.matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    radios.forEach((radio) => {
      radio.checked = radio.value === preference;
    });
  }

  group.addEventListener('change', function (event) {
    if (!radios.includes(event.target) || !event.target.checked) return;
    preference = event.target.value;
    try {
      document.defaultView.localStorage.setItem(storageKey, preference);
    } catch {
      // Apply the choice for this page even when it cannot be stored.
    }
    updateTheme();
  });

  systemPreference.addEventListener('change', function () {
    if (preference === 'system') updateTheme();
  });

  updateTheme();
}

function init() {
  setupCodeCopyButtons();
  setupSectionEditButtons();
  setupSiteMenu();
  setupBackToTopVisibility();
  setupSidebarToggle();
  setupResponsiveDiff();
  setupThemePreference();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
