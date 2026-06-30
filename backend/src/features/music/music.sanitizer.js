// music.sanitizer.js — Input sanitization (strip shell metacharacters)

import { InvalidInputError } from './music.errors.js';

// Shell metacharacters that must never reach yt-dlp or shell
const SHELL_META_PATTERN = /[;&|`$(){}[\]<>!\\'"*?~]/g;

/**
 * Sanitizes a search query string.
 * Strips shell metacharacters and trims whitespace.
 * @param {string} input
 * @returns {string} sanitized string
 * @throws {InvalidInputError} if input is empty after sanitization
 */
export function sanitizeQuery(input) {
  if (typeof input !== 'string') {
    throw new InvalidInputError('Query must be a string');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new InvalidInputError('Query cannot be empty');
  }

  if (trimmed.length > 200) {
    throw new InvalidInputError('Query is too long (max 200 characters)');
  }

  const sanitized = trimmed.replace(SHELL_META_PATTERN, '').trim();

  if (!sanitized) {
    throw new InvalidInputError('Query contains only disallowed characters');
  }

  return sanitized;
}

/**
 * Sanitizes a YouTube URL.
 * Only allows youtube.com and youtu.be domains.
 * @param {string} input
 * @returns {string} sanitized URL
 * @throws {InvalidInputError} if URL is not a valid YouTube URL
 */
export function sanitizeYouTubeUrl(input) {
  if (typeof input !== 'string') {
    throw new InvalidInputError('URL must be a string');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new InvalidInputError('URL cannot be empty');
  }

  // Only allow https youtube URLs
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidInputError('Invalid URL format');
  }

  const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'];
  if (!allowedHosts.includes(url.hostname)) {
    throw new InvalidInputError('Only YouTube URLs are allowed');
  }

  if (url.protocol !== 'https:') {
    throw new InvalidInputError('Only HTTPS URLs are allowed');
  }

  // Return the trimmed URL directly (we no longer execute shell commands)
  return trimmed;
}

/**
 * Extracts and validates a videoId from a YouTube URL or raw videoId string.
 * @param {string} input
 * @returns {string} videoId (11 chars, alphanumeric + dash + underscore)
 * @throws {InvalidInputError}
 */
export function extractVideoId(input) {
  if (typeof input !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = input.trim();

  // If it looks like a plain videoId already
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  } catch {
    // not a URL
  }

  throw new InvalidInputError('Could not extract a valid videoId');
}
