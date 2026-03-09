/**
 * @fileoverview Shared utility functions for PlacePrep.
 */

/**
 * Generates a URL-safe slug from a company name.
 * e.g. "Tata Consultancy Services" → "tata-consultancy-services"
 * @param {string} name
 * @returns {string}
 */
export function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
