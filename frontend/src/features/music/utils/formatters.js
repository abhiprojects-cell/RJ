// formatters.js — Duration, views, date formatting

/**
 * Format seconds into mm:ss or h:mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (typeof seconds === 'string' && seconds.includes(':')) {
    return seconds;
  }
  if (!seconds || isNaN(seconds)) return '0:00';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Format a view count to human-readable string
 * @param {number} views
 * @returns {string}
 */
export function formatViews(views) {
  if (!views || isNaN(views)) return '0';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

/**
 * Format a YouTube upload date (YYYYMMDD) to a readable string
 * @param {string|null} uploadDate — e.g. "20231215"
 * @returns {string}
 */
export function formatUploadDate(uploadDate) {
  if (!uploadDate || typeof uploadDate !== 'string') return '';
  if (uploadDate.length !== 8) return uploadDate;

  const year = uploadDate.slice(0, 4);
  const month = uploadDate.slice(4, 6);
  const day = uploadDate.slice(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return uploadDate;

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Get a time-aware greeting
 * @param {string|null} name — optional user name
 * @returns {string}
 */
export function getGreeting(name) {
  const hour = new Date().getHours();
  let prefix;
  if (hour < 12) prefix = 'Good morning';
  else if (hour < 17) prefix = 'Good afternoon';
  else prefix = 'Good evening';

  return name ? `${prefix}, ${name}` : prefix;
}

/**
 * Truncate a string to a max length with ellipsis
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 40) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

/**
 * Format bytes to a human-readable string (for storage warnings)
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
