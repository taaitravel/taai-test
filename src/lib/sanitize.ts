/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Use this when inserting dynamic content into HTML strings
 */
export const escapeHtml = (str: string | undefined | null): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Strips HTML tags safely using regex (no DOM parsing that could execute scripts)
 * Use this when you need plain text from HTML content
 */
export const stripHtmlTags = (html: string | undefined | null): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove script tags and their content first
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
  
  // Trim and normalize whitespace
  return clean.trim().replace(/\s+/g, ' ');
};

/**
 * Validates that a price value is a safe number
 */
export const sanitizePrice = (price: unknown): number | undefined => {
  if (typeof price === 'number' && !isNaN(price) && isFinite(price)) {
    return price;
  }
  if (typeof price === 'string') {
    const parsed = parseFloat(price.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

/**
 * Validates that a category is one of the known safe values
 */
export const sanitizeCategory = (category: unknown): string | undefined => {
  const validCategories = [
    'hotel', 'property', 'flight', 'activity', 'reservation', 
    'restaurant', 'car', 'package', 'destination'
  ];
  
  if (typeof category === 'string' && validCategories.includes(category.toLowerCase())) {
    return category.toLowerCase();
  }
  return undefined;
};
