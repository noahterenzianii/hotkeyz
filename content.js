const CONFIG = {
  shortcut: { code: "KeyS", altKey: true },

  selectorTiers: [
    [
      '[role="searchbox"]',
      'input[type="search"]',
      'input[name="q" i]',
      'input[name*="search" i]',
      'input[name*="query" i]',
      'input[id*="search" i]',
      'input[aria-label*="search" i]',
      'input[aria-label*="cerca" i]',
      'input[placeholder*="search" i]',
      'input[placeholder*="cerca" i]',
      'input[placeholder*="ask" i]',
      'input[placeholder*="chiedi" i]',
    ],
    [
      "textarea",
      '[contenteditable]:not([contenteditable="false"])',
      '[role="textbox"]',
      'input[type="text"]',
      "input:not([type])",
    ],
  ],
};

const TIER_SELECTORS = CONFIG.selectorTiers.map((tier) => tier.join(", "));

function matchesShortcut(event, s) {
  return (
    event.code === s.code &&
    event.altKey === !!s.altKey &&
    event.ctrlKey === !!s.ctrlKey &&
    event.shiftKey === !!s.shiftKey &&
    event.metaKey === !!s.metaKey
  );
}

function collectRoots(root = document, roots = [document]) {
  for (const el of root.querySelectorAll("*")) {
    if (el.shadowRoot) {
      roots.push(el.shadowRoot);
      collectRoots(el.shadowRoot, roots);
    }
  }
  return roots;
}

function isUsable(el) {
  if (el.disabled || el.readOnly) return false;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function isInViewport(el) {
  const r = el.getBoundingClientRect();
  return (
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth
  );
}

function findTarget() {
  const roots = collectRoots();

  for (const selector of TIER_SELECTORS) {
    let fallback = null;
    for (const root of roots) {
      for (const el of root.querySelectorAll(selector)) {
        if (!isUsable(el)) continue;
        if (isInViewport(el)) return el;
        fallback ??= el;
      }
    }
    if (fallback) return fallback;
  }

  return null;
}

function focusField(el) {
  el.focus();
  if (typeof el.select === "function") {
    el.select();
  } else if (el.isContentEditable) {
    getSelection().selectAllChildren(el);
  }
}

document.addEventListener(
  "keydown",
  (event) => {
    if (event.repeat || event.isComposing) return;
    if (!matchesShortcut(event, CONFIG.shortcut)) return;

    const target = findTarget();
    if (!target) {
      console.log("Hotkeyz: No visible text field found.");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    focusField(target);
  },
  true,
);
