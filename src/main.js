import { inject } from '@vercel/analytics';
import QRCode from 'qrcode';
import { fileNameFor, normaliseUrl } from './url.js';
import './style.css';

// Counts anonymous page visits only — no cookies, and it never sees what's typed into the form.
inject();

const form = document.querySelector('#qr-form');
const input = document.querySelector('#url');
const error = document.querySelector('#url-error');
const result = document.querySelector('#result');
const preview = document.querySelector('#preview');
const encoded = document.querySelector('#encoded');
const pngLink = document.querySelector('#download-png');
const svgLink = document.querySelector('#download-svg');
const fgColor = document.querySelector('#fg-color');
const bgColor = document.querySelector('#bg-color');
const transparentBg = document.querySelector('#transparent-bg');

// Medium error correction: survives smudges and printing, keeps codes small enough to scan easily.
function currentOptions() {
  return {
    errorCorrectionLevel: 'M',
    margin: 4,
    color: {
      dark: fgColor.value,
      light: transparentBg.checked ? `${bgColor.value}00` : bgColor.value,
    },
  };
}

let svgUrl;
let lastUrl;

function showError(message) {
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  result.hidden = true;
}

async function generate(url) {
  const options = currentOptions();
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...options, type: 'svg' }),
    QRCode.toDataURL(url, { ...options, width: 1024 }),
  ]);

  preview.innerHTML = svg;
  preview.classList.toggle('transparent', transparentBg.checked);
  const svgEl = preview.querySelector('svg');
  svgEl.setAttribute('role', 'img');
  svgEl.setAttribute('aria-label', `QR code linking to ${url}`);

  encoded.textContent = url;
  encoded.href = url;

  if (svgUrl) URL.revokeObjectURL(svgUrl);
  svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  svgLink.href = svgUrl;
  svgLink.download = fileNameFor(url, 'svg');
  pngLink.href = png;
  pngLink.download = fileNameFor(url, 'png');

  result.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const parsed = normaliseUrl(input.value);
  if (!parsed.ok) return showError(parsed.error);

  error.textContent = '';
  input.removeAttribute('aria-invalid');
  input.value = parsed.url;
  lastUrl = parsed.url;

  try {
    await generate(parsed.url);
    result.querySelector('h2').focus();
  } catch {
    showError('That link is too long to fit in a QR code.');
  }
});

// Re-render with the new style immediately, without waiting for another submit.
for (const control of [fgColor, bgColor, transparentBg]) {
  control.addEventListener('input', () => {
    bgColor.disabled = transparentBg.checked;
    if (lastUrl) generate(lastUrl).catch(() => {});
  });
}
