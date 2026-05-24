/**
 * TabQR — popup.js
 * Pure vanilla JS. No build step, no frameworks.
 * Works in Chrome, Edge, Firefox (Manifest V3).
 */

// ── Browser API compatibility ────────────────────────────────
// Chrome exposes `chrome`, Firefox exposes `browser` (Promise-based).
// We normalise to a single `api` object.
const api = (typeof browser !== 'undefined') ? browser : chrome;

// ── DOM references ───────────────────────────────────────────
const $ = id => document.getElementById(id);
const qrContainer = $('qrContainer');
const qrError     = $('qrError');
const qrErrorMsg  = $('qrErrorMsg');
const pageTitle   = $('pageTitle');
const pageUrl     = $('pageUrl');
const favicon     = $('favicon');
const copyBtn     = $('copyBtn');
const copyLabel   = $('copyLabel');
const whatsappBtn = $('whatsappBtn');
const downloadBtn = $('downloadBtn');
const shareBtn    = $('shareBtn');
const themeBtn    = $('themeBtn');
const actionsDiv  = $('actions');

// ── State ────────────────────────────────────────────────────
let currentUrl   = '';
let currentTitle = '';
let qrCanvas     = null;   // holds the rendered <canvas> for download

// ── Theme (persisted in localStorage) ───────────────────────
function initTheme() {
  const saved = localStorage.getItem('tabqr-theme');
  // Also respect OS preference on first run
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('tabqr-theme', isDark ? 'dark' : 'light');
  // Re-render QR so colour adapts
  if (currentUrl) renderQR(currentUrl);
});

// ── Helpers ──────────────────────────────────────────────────

/** Truncate a URL for display — keeps scheme + host + ~30 chars of path */
function displayUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    const short = path.length > 32 ? path.slice(0, 30) + '…' : path;
    return u.hostname + short;
  } catch {
    return url.length > 48 ? url.slice(0, 46) + '…' : url;
  }
}

/** True if URL is a restricted browser-internal page */
function isRestrictedUrl(url) {
  if (!url) return true;
  const restricted = ['chrome://', 'chrome-extension://', 'about:', 'edge://', 'moz-extension://', 'file://'];
  return restricted.some(p => url.startsWith(p));
}

/** Show the error panel instead of QR */
function showError(msg) {
  qrContainer.classList.remove('loading');
  qrContainer.hidden = true;
  qrError.style.display = 'flex';
  qrErrorMsg.textContent = msg;
  qrError.hidden = false;
  // Disable action buttons that need a URL
  downloadBtn.disabled = true;
  whatsappBtn.disabled = true;
  shareBtn.hidden = true;
  copyBtn.disabled = true;
}

// ── QR Rendering ─────────────────────────────────────────────

/**
 * Renders a QR code into #qrContainer using the bundled qrcode.js library.
 * We detect dark mode and flip the QR colours accordingly so it's
 * always scannable against the card background.
 */
function renderQR(url) {
  qrContainer.innerHTML = '';

  qrError.hidden = true;
  qrError.style.display = 'none';

  qrContainer.hidden = false;
  qrContainer.style.display = 'flex';

  try {

    // Create temporary div for qrcode.js
    const temp = document.createElement('div');

    new QRCode(temp, {
      text: url,
      width: 320,
      height: 320,
      colorDark: '#111111',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    const originalCanvas = temp.querySelector('canvas');

    if (!originalCanvas) {
      throw new Error('QR canvas not created');
    }

    // Create final canvas
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;

    const ctx = canvas.getContext('2d');

    // Draw QR
    ctx.drawImage(originalCanvas, 0, 0);

    // Add favicon/logo if available
    if (favicon.src) {

      const logo = new Image();

      logo.crossOrigin = 'anonymous';

      logo.onload = () => {

        const size = 52;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        // White rounded background
        ctx.fillStyle = '#ffffff';

        roundRect(ctx, x - 8, y - 8, size + 16, size + 16, 14);
        ctx.fill();

        // Draw favicon
        ctx.drawImage(logo, x, y, size, size);

        qrContainer.innerHTML = '';
        qrContainer.appendChild(canvas);

        qrCanvas = canvas;
      };

      logo.onerror = () => {
        qrContainer.innerHTML = '';
        qrContainer.appendChild(canvas);
        qrCanvas = canvas;
      };

      logo.src = favicon.src;

    } else {
      qrContainer.appendChild(canvas);
      qrCanvas = canvas;
    }

  } catch (err) {
    console.error(err);
    showError('Unable to generate QR code.');
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);

  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
}

// ── Tab detection ─────────────────────────────────────────────

async function loadTab() {
  try {
    // Query the active tab in the current window
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab  = tabs && tabs[0];

    if (!tab) {
      showError('No active tab found.');
      return;
    }

    const url   = tab.url   || '';
    const title = tab.title || '';

    // Handle restricted pages
    if (isRestrictedUrl(url)) {
      pageTitle.textContent = title || 'Browser Page';
      pageUrl.textContent   = url ? displayUrl(url) : '';
      favicon.classList.add('hidden');
      showError("QR codes can\u2019t be generated for\nbrowser system pages.");
      return;
    }

    currentUrl   = url;
    currentTitle = title;

    console.log('URL:', url);

    // ── Update page info section ──
    pageTitle.textContent = title || url;
    pageUrl.textContent   = displayUrl(url);

    // ── Favicon ──
    // Chrome exposes tab.favIconUrl; Firefox too in most cases
    const favUrl = tab.favIconUrl || '';
    if (favUrl && !favUrl.startsWith('chrome://')) {
      favicon.src = favUrl;
      favicon.onload  = () => favicon.classList.add('loaded');
      favicon.onerror = () => favicon.classList.add('hidden');
      favicon.classList.remove('hidden');
    } else {
      favicon.classList.add('hidden');
    }

    // ── Render QR ──
    renderQR(url);

    // ── Show native share button if supported ──
    if (navigator.share) {
      shareBtn.hidden = false;
      actionsDiv.classList.add('has-share');
    }

  } catch (err) {
    showError('Could not read the current tab.\n' + (err.message || ''));
  }
}

// ── Button: Copy Link ─────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  if (!currentUrl) return;
  try {
    await navigator.clipboard.writeText(currentUrl);
    // Success state
    copyBtn.classList.add('success');
    copyLabel.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('success');
      copyLabel.textContent = 'Copy Link';
    }, 2000);
  } catch {
    // Fallback for browsers that restrict clipboard in extensions
    try {
      const ta = document.createElement('textarea');
      ta.value = currentUrl;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.classList.add('success');
      copyLabel.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('success');
        copyLabel.textContent = 'Copy Link';
      }, 2000);
    } catch (e) {
      copyLabel.textContent = 'Failed';
      setTimeout(() => { copyLabel.textContent = 'Copy Link'; }, 2000);
    }
  }
});

// ── Button: WhatsApp ──────────────────────────────────────────
whatsappBtn.addEventListener('click', () => {
  if (!currentUrl) return;
  const text = currentTitle
    ? `${currentTitle}\n${currentUrl}`
    : currentUrl;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  // Use chrome.tabs.create / browser.tabs.create so it opens in a real tab
  api.tabs.create({ url: waUrl });
});

// ── Button: Download QR ───────────────────────────────────────
downloadBtn.addEventListener('click', () => {
  if (!qrCanvas) return;
  try {
    // Get a higher-res version by drawing the existing canvas onto a bigger one
    const size   = 512;
    const output = document.createElement('canvas');
    output.width  = size;
    output.height = size;
    const ctx = output.getContext('2d');
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    // Scale up the QR canvas
    ctx.drawImage(qrCanvas, 0, 0, size, size);

    // Derive a clean filename from the page title / hostname
    let filename = 'qr-code';
    try {
      const host = new URL(currentUrl).hostname.replace(/^www\./, '');
      filename   = `qr-${host}`;
    } catch {}

    const link    = document.createElement('a');
    link.download = `${filename}.png`;
    link.href     = output.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Download failed:', err);
  }
});

// ── Button: Native Share ──────────────────────────────────────
shareBtn.addEventListener('click', async () => {
  if (!currentUrl || !navigator.share) return;
  try {
    await navigator.share({
      title: currentTitle || 'Shared from TabQR',
      url:   currentUrl,
    });
  } catch (err) {
    // User cancelled share — that's fine
    if (err.name !== 'AbortError') console.warn('Share failed:', err);
  }
});

// ── Init ──────────────────────────────────────────────────────
initTheme();
loadTab();
