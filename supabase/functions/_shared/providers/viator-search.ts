const VIATOR_LIVE_BASE = 'https://api.viator.com/partner';
const VIATOR_SANDBOX_BASE = 'https://api.sandbox.viator.com/partner';
const VIATOR_TIMEOUT_MS = 15_000;
const MAX_ACTIVITIES = 6;

const cleanText = (value: unknown, max = 240): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/<[^>]+>/g, '').trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const safeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

const numOrNull = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const imageUrls = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  for (const image of images) {
    const variants = (image as { variants?: unknown[] } | null)?.variants;
    if (!Array.isArray(variants)) continue;
    let best: string | null = null;
    let bestWidth = -1;
    for (const variant of variants) {
      const url = safeUrl((variant as { url?: unknown })?.url);
      const width = numOrNull((variant as { width?: unknown })?.width) ?? 0;
      if (url && width >= bestWidth) {
        best = url;
        bestWidth = width;
      }
    }
    if (best) out.push(best);
    if (out.length >= 3) break;
  }
  return out;
};

/**
 * Same Viator Partner search the Search page uses. Purchase stays on viator.com.
 */
export const searchViatorActivities = async (destination: string, currency = 'USD') => {
  const apiKey = Deno.env.get('VIATOR_API_KEY');
  if (!apiKey) return { error: 'Activity search is currently unavailable', results: [] as unknown[] };

  const configuredHost = Deno.env.get('VIATOR_API_BASE');
  const bases = configuredHost
    ? [configuredHost.replace(/\/+$/, '')]
    : [VIATOR_LIVE_BASE, VIATOR_SANDBOX_BASE];

  const payload = JSON.stringify({
    searchTerm: destination,
    currency,
    productFiltering: { rating: { from: 3 } },
    searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: 1, count: MAX_ACTIVITIES } }],
  });

  let upstream: Response | null = null;
  for (const base of bases) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VIATOR_TIMEOUT_MS);
    try {
      upstream = await fetch(`${base}/search/freetext`, {
        method: 'POST',
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'exp-api-key': apiKey,
          Accept: 'application/json;version=2.0',
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json',
        },
        body: payload,
      });
    } catch (error) {
      console.error('Viator unreachable', error instanceof Error ? error.message : 'error');
      return { error: 'Activity search failed', results: [] };
    } finally {
      clearTimeout(timer);
    }
    if (upstream.ok || (upstream.status !== 401 && upstream.status !== 403)) break;
  }

  if (!upstream?.ok) {
    console.error('Viator search failed', upstream?.status);
    return { error: 'Activity search failed', results: [] };
  }

  const body = await upstream.json().catch(() => null);
  const products = Array.isArray(body?.products?.results) ? body.products.results : [];
  const results = products.slice(0, MAX_ACTIVITIES).map((product: Record<string, any>, index: number) => {
    const price = product?.pricing?.summary ?? {};
    const images = imageUrls(product?.images);
    return {
      id: String(product?.productCode ?? `viator_${index}`),
      name: cleanText(product?.title, 140) || 'Activity',
      price: numOrNull(price?.fromPrice) ?? 0,
      currency: typeof product?.pricing?.currency === 'string' ? product.pricing.currency : currency,
      rating: numOrNull(product?.reviews?.combinedAverageRating) ?? 0,
      reviewCount: numOrNull(product?.reviews?.totalReviews) ?? 0,
      description: cleanText(product?.description) || '',
      location: cleanText(product?.destinations?.[0]?.name, 120) || destination,
      image: images[0] || '',
      images,
      category: cleanText(product?.tags?.[0], 60) || 'activity',
      bookingLink: safeUrl(product?.productUrl),
      source: 'viator',
      note: 'Opens on Viator. taai does not sell or collect payment for this activity.',
    };
  });

  return {
    constraint_summary: `Activities in ${destination}`,
    results,
    action_buttons: ['select', 'save_to_shortlist'],
  };
};
