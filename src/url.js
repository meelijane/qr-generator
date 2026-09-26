// Turn whatever someone pasted into a URL a phone can open, or explain why not.
export function normaliseUrl(input) {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Paste a link first.' };

  // "example.com/page" → assume https
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That doesn't look like a link." };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Only http and https links are supported.' };
  }
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
    return { ok: false, error: "That doesn't look like a link." };
  }

  return { ok: true, url: url.href };
}

// A filename people can recognise later: qr-example.com-page.png
export function fileNameFor(href, ext) {
  const { hostname, pathname } = new URL(href);
  const slug = `${hostname}${pathname}`
    .replace(/^www\./, '')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `qr-${slug || 'link'}.${ext}`;
}
