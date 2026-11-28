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

function setupTemplateConfig() {
  const fieldset = document.querySelector(
    '#config__manager fieldset[id$="____tpl_settings_name"]',
  );
  if (!fieldset || fieldset.dataset.grouped === 'true') return;

  const appearanceKeys = new Set([
    'showHeaderPicture',
    'headerPicture',
    'pageBackground',
    'pageBackgroundImage',
    'pageBackgroundSize',
  ]);
  const body = fieldset.querySelector('table tbody');
  const appearanceRows = [];
  for (const row of body?.rows ?? []) {
    const name = row.querySelector('input, select, textarea')?.name ?? '';
    if (appearanceKeys.has(name.split('____').pop().replace(']', ''))) {
      appearanceRows.push(row);
    }
  }
  if (!appearanceRows.length) return;

  const appearanceFieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = document.body.dataset.appearanceLabel;
  appearanceFieldset.append(legend);
  const wrapper = document.createElement('div');
  wrapper.className = 'table';
  const table = document.createElement('table');
  table.className = 'inline';
  const appearanceBody = document.createElement('tbody');
  table.append(appearanceBody);
  wrapper.append(table);
  appearanceFieldset.append(wrapper);
  appearanceBody.append(...appearanceRows);
  fieldset.before(appearanceFieldset);
  fieldset.querySelector('legend').textContent =
    document.body.dataset.navigationLabel;
  fieldset.dataset.grouped = 'true';
}

function setupStylingTable() {
  const table = document.querySelector('#plugin__styling form.styling > table');
  if (!table || table.dataset.organized === 'true') return;

  const body = table.tBodies[0];
  const entries = new Map();
  for (const row of body.rows) {
    const input = row.querySelector('input[name^="tpl["]');
    const match = input?.name.match(/^tpl\[(.+)\]$/);
    if (!match) continue;
    entries.set(match[1], { input, label: row.querySelector('label'), row });
  }

  const layoutKeys = [
    '__site_width__',
    '__sidebar_width__',
    '__content_font_size__',
    '__navigation_font_size__',
    '__submenu_font_size__',
  ];
  const groups = [
    [
      ['__header_background__', '__dark_header_background__'],
      ['__header_text__', '__dark_header_text__'],
    ],
    [
      ['__outer_background__', '__dark_outer_background__'],
      ['__background__', '__dark_page__'],
      ['__text__', '__dark_text__'],
      ['__background_alt__', '__dark_surface__'],
      ['__text_alt__', '__dark_text_alt__'],
      ['__background_neu__', '__dark_background_neu__'],
      ['__text_neu__', '__dark_text_neu__'],
      ['__border__', '__dark_border__'],
    ],
    [
      ['__link__', '__dark_link__'],
      ['__existing__', '__dark_existing__'],
      ['__missing__', '__dark_missing__'],
    ],
    [['__highlight__', '__dark_highlight__']],
  ];

  const createCell = (tag, text, className = '') => {
    const cell = document.createElement(tag);
    if (text) cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  };

  const pairedLabel = (light, dark) => {
    const lightSeparator = light.indexOf(':');
    const darkSeparator = dark.indexOf(':');
    if (lightSeparator < 0 || darkSeparator < 0) return [light, '', ''];
    return [
      light.slice(lightSeparator + 1).trim(),
      light.slice(0, lightSeparator).trim(),
      dark.slice(0, darkSeparator).trim(),
    ];
  };

  const lightOnly = new Set();
  const remaining = new Set(entries.keys());
  const firstLayoutLabel = entries.get(layoutKeys[0])?.label.textContent.trim();
  const layoutCaption = firstLayoutLabel?.includes(':')
    ? firstLayoutLabel.slice(0, firstLayoutLabel.indexOf(':')).trim()
    : '';
  const layoutBody = document.createElement('tbody');
  const layoutTable = document.createElement('table');
  layoutTable.className = 'zenlike-styling-layout';
  layoutTable.dataset.organized = 'true';
  layoutTable.append(layoutBody);

  for (const key of layoutKeys) {
    const entry = entries.get(key);
    if (!entry) continue;
    const title = entry.label.textContent.trim();
    entry.label.textContent = title.includes(':')
      ? title.slice(title.indexOf(':') + 1).trim()
      : title;
    const row = document.createElement('tr');
    row.className = 'zenlike-styling-setting';
    const heading = createCell('th');
    heading.scope = 'row';
    heading.append(entry.label);
    const value = createCell('td');
    value.append(entry.input);
    row.append(heading, value);
    layoutBody.append(row);
    remaining.delete(key);
  }

  if (layoutBody.childElementCount) {
    const layoutHead = document.createElement('thead');
    const layoutGroup = document.createElement('tr');
    layoutGroup.className = 'zenlike-styling-group';
    const layoutHeading = createCell('th', layoutCaption);
    layoutHeading.colSpan = 2;
    layoutGroup.append(layoutHeading);
    layoutHead.append(layoutGroup);
    layoutTable.prepend(layoutHead);
    table.before(layoutTable);
  }

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.append(createCell('th', ''));
  head.append(headRow);
  table.prepend(head);

  const organizedRows = [];
  let modeHeadings;
  for (const group of groups) {
    const present = group.filter((keys) =>
      keys.some((key) => entries.has(key)),
    );
    if (!present.length) continue;

    const first = entries.get(present[0][0]);
    const firstDark = present[0][1] ? entries.get(present[0][1]) : undefined;
    const firstLabel = firstDark
      ? pairedLabel(first.label.textContent, firstDark.label.textContent)[0]
      : first.label.textContent;
    const groupTitle = firstLabel.includes(':')
      ? firstLabel.slice(0, firstLabel.indexOf(':')).trim()
      : firstLabel.trim();
    const groupRow = document.createElement('tr');
    groupRow.className = 'zenlike-styling-group';
    groupRow.append(createCell('th', groupTitle));
    groupRow.firstElementChild.colSpan = 3;
    organizedRows.push(groupRow);

    for (const keys of present) {
      const light = entries.get(keys[0]);
      const dark = keys[1] ? entries.get(keys[1]) : undefined;
      if (!light) continue;

      const row = document.createElement('tr');
      row.className = 'zenlike-styling-setting';
      const label = light.label;
      const heading = createCell('th');
      heading.scope = 'row';
      heading.append(label);
      row.append(heading);

      if (dark) {
        const [shared, lightMode, darkMode] = pairedLabel(
          light.label.textContent,
          dark.label.textContent,
        );
        label.textContent = shared.startsWith(`${groupTitle}:`)
          ? shared.slice(groupTitle.length + 1).trim()
          : shared;
        modeHeadings ??= [lightMode, darkMode];
        const lightCell = createCell('td');
        lightCell.append(light.input);
        const darkCell = createCell('td');
        dark.label.classList.add('a11y');
        darkCell.append(dark.label, dark.input);
        row.append(lightCell, darkCell);
        remaining.delete(keys[0]);
        remaining.delete(keys[1]);
      } else if (lightOnly.has(keys[0])) {
        const [shared, lightMode] = pairedLabel(
          light.label.textContent,
          light.label.textContent,
        );
        label.textContent = shared;
        modeHeadings ??= [lightMode, ''];
        const lightCell = createCell('td');
        lightCell.append(light.input);
        row.append(lightCell, createCell('td'));
        remaining.delete(keys[0]);
      } else {
        const prefix = `${groupTitle}:`;
        if (label.textContent.trim().startsWith(prefix)) {
          label.textContent = label.textContent
            .trim()
            .slice(prefix.length)
            .trim();
        }
        const value = createCell('td');
        value.colSpan = 2;
        value.append(light.input);
        row.append(value);
        remaining.delete(keys[0]);
      }
      organizedRows.push(row);
    }
  }

  for (const key of remaining) {
    const entry = entries.get(key);
    if (!entry) continue;
    const row = document.createElement('tr');
    row.className = 'zenlike-styling-setting';
    const heading = createCell('th');
    heading.scope = 'row';
    heading.append(entry.label);
    const value = createCell('td');
    value.colSpan = 2;
    value.append(entry.input);
    row.append(heading, value);
    organizedRows.push(row);
  }

  if (modeHeadings) {
    headRow.append(
      createCell('th', modeHeadings[0], 'zenlike-styling-mode'),
      createCell('th', modeHeadings[1], 'zenlike-styling-mode'),
    );
  }
  body.replaceChildren(...organizedRows);
  table.dataset.organized = 'true';
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

function setupNavigationDropdowns() {
  const menu = document.getElementById('custommenu');
  if (!menu) return;

  let nextId = 0;
  const controls = [];
  const close = (control) => {
    control.button.setAttribute('aria-expanded', 'false');
    control.list.hidden = true;
    controls
      .filter((child) => control.list.contains(child.button))
      .forEach(close);
  };

  menu.querySelectorAll('li').forEach((item) => {
    const list = [...item.children].find((child) =>
      ['UL', 'OL'].includes(child.tagName),
    );
    const label = [...item.children].find((child) =>
      child.classList.contains('li'),
    );
    if (!list || !label || !list.querySelector('li')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zenlike-submenu-button';
    const interactive = label.querySelectorAll(
      'a, button, input, select, textarea',
    );
    if (interactive.length === 1 && interactive[0].tagName === 'A') {
      const link = interactive[0];
      const copy = label.cloneNode(true);
      const copiedLink = copy.querySelector('a');
      copiedLink.replaceWith(...copiedLink.childNodes);
      copy
        .querySelectorAll('[id]')
        .forEach((element) => element.removeAttribute('id'));
      button.classList.add('zenlike-submenu-label');
      if (link.hasAttribute('aria-label')) {
        button.setAttribute('aria-label', link.getAttribute('aria-label'));
      }
      button.append(...copy.childNodes);

      const linkItem = document.createElement('li');
      const linkLabel = document.createElement('div');
      linkLabel.className = 'li';
      const current = link.closest('.curid, .current');
      linkLabel.append(current && label.contains(current) ? current : link);
      linkItem.append(linkLabel);
      list.prepend(linkItem);
      item.classList.add('zenlike-linked-submenu');
      label.replaceChildren();
    } else if (interactive.length) {
      const name =
        interactive[0].getAttribute('aria-label') ||
        label.textContent.trim() ||
        interactive[0].querySelector('img')?.alt ||
        interactive[0].title ||
        menu.closest('nav')?.getAttribute('aria-label') ||
        'Menu';
      button.setAttribute('aria-label', name);
      button.title = name;
    } else {
      button.classList.add('zenlike-submenu-label');
      button.append(...label.childNodes);
    }
    const arrow = document.createElement('span');
    arrow.className = 'zenlike-submenu-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(arrow);
    label.append(button);
    label.classList.add('zenlike-submenu-heading');
    item.classList.add('zenlike-has-submenu');
    list.classList.add('zenlike-submenu');
    do {
      nextId += 1;
    } while (document.getElementById(`zenlike-submenu-${nextId}`));
    list.id = `zenlike-submenu-${nextId}`;
    button.setAttribute('aria-controls', list.id);
    button.setAttribute('aria-expanded', 'false');
    list.hidden = true;
    const control = { button, list, item };
    controls.push(control);

    button.addEventListener('click', () => {
      const opening = list.hidden;
      controls
        .filter(
          (other) =>
            other !== control &&
            other.item.parentElement === item.parentElement,
        )
        .forEach(close);
      if (!opening) {
        close(control);
        return;
      }
      list.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      list.style.transform = '';
      if (
        !item.parentElement.closest('li') &&
        document.defaultView.matchMedia('(min-width: 42.01em)').matches
      ) {
        const bounds = list.getBoundingClientRect();
        const width = document.documentElement.clientWidth;
        if (width && bounds.right > width - 8) {
          list.style.transform = `translateX(${width - bounds.right - 8}px)`;
        } else if (bounds.left < 8) {
          list.style.transform = `translateX(${8 - bounds.left}px)`;
        }
      }
    });
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = controls.findLast(
      (control) => !control.list.hidden && control.item.contains(event.target),
    );
    if (!open) return;
    close(open);
    open.button.focus();
    event.preventDefault();
    event.stopPropagation();
  });
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) controls.forEach(close);
  });
  menu.addEventListener('focusout', (event) => {
    if (!menu.contains(event.relatedTarget)) controls.forEach(close);
  });
  document.defaultView.addEventListener('resize', () =>
    controls.forEach(close),
  );
}

function setupBackToTopVisibility() {
  const content = document.querySelector('#dokuwiki__content .page');
  const backToTop = document.getElementById('zenlike__back-to-top');
  if (!content || !backToTop) return;

  function updateVisibility() {
    backToTop.hidden =
      content.offsetHeight <= document.defaultView.innerHeight * 1.5;
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
  const popup = document.querySelector('#plugin__styling.ispopup');
  if (!group && !popup) return;

  const storageKey = 'zenlike-theme';
  const radios = group
    ? [...group.querySelectorAll('input[type="radio"]')]
    : [];
  const modes = ['system', 'light', 'dark'];
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

  group?.addEventListener('change', function (event) {
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

  if (popup) {
    document.defaultView.addEventListener('storage', function (event) {
      if (event.key !== storageKey) return;
      preference = modes.includes(event.newValue) ? event.newValue : 'system';
      updateTheme();
    });
  }

  updateTheme();
}

function init() {
  setupCodeCopyButtons();
  setupSectionEditButtons();
  setupTemplateConfig();
  setupStylingTable();
  setupSiteMenu();
  setupNavigationDropdowns();
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
