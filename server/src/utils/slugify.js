/**
 * Generate a URL-safe slug from any string
 * Handles English and special characters
 */
const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = slugify;
