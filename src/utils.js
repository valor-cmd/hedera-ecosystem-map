// Utility functions for Hedera Ecosystem Map

// Category colors - purple theme matching Genfinity
export const CATEGORY_COLORS = {
  council: '#8b5cf6',
  core: '#a78bfa',
  media: '#c4b5fd',
  wallets: '#7c3aed',
  defi: '#6d28d9',
  rwas: '#5b21b6',
  iot: '#4c1d95',
  meme: '#9333ea'
};

/**
 * Get the color for a category
 * @param {string} category - Category name
 * @returns {string} Hex color code
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#8b5cf6';
}

/**
 * Calculate position on a circle given angle and radius
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Distance from center
 * @param {number} angleDegrees - Angle in degrees (0 = top)
 * @returns {{ x: number, y: number }}
 */
export function getPositionOnCircle(centerX, centerY, radius, angleDegrees) {
  const angleRad = (angleDegrees - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad)
  };
}

/**
 * Create a path to a logo file
 * @param {string} category - Category folder name
 * @param {string} logoFile - Logo filename
 * @returns {string} Relative path to logo
 */
export function createLogoPath(category, logoFile) {
  return `../logos/${category}/${logoFile}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum characters
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 15) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '...';
}

/**
 * Format large numbers with K/M/B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Generate a unique ID for SVG elements
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'elem') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert hex color to rgba
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calculate optimal font size to fit text in a given width
 * @param {string} text - Text to measure
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} baseFontSize - Starting font size
 * @returns {number} Optimal font size
 */
export function calculateFontSize(text, maxWidth, baseFontSize = 14) {
  const charWidth = baseFontSize * 0.6; // Approximate
  const textWidth = text.length * charWidth;
  if (textWidth <= maxWidth) return baseFontSize;
  return Math.floor(baseFontSize * (maxWidth / textWidth));
}
