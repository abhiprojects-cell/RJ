// music.errors.js — Typed error class + error response factory

export const MusicErrorCodes = {
  TIMEOUT: 'TIMEOUT',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  YTDLP_MISSING: 'YTDLP_MISSING',
  STREAM_FAILED: 'STREAM_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export class MusicError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'MusicError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class TimeoutError extends MusicError {
  constructor(message = 'Process timed out') {
    super(message, MusicErrorCodes.TIMEOUT, 504);
  }
}

export class ParseError extends MusicError {
  constructor(message = 'Failed to parse response') {
    super(message, MusicErrorCodes.PARSE_ERROR, 502);
  }
}

export class NotFoundError extends MusicError {
  constructor(message = 'Resource not found') {
    super(message, MusicErrorCodes.NOT_FOUND, 404);
  }
}

export class InvalidInputError extends MusicError {
  constructor(message = 'Invalid input provided') {
    super(message, MusicErrorCodes.INVALID_INPUT, 400);
  }
}

export class YtdlpMissingError extends MusicError {
  constructor(message = 'yt-dlp is not installed or not in PATH') {
    super(message, MusicErrorCodes.YTDLP_MISSING, 503);
  }
}

/**
 * Shapes an error into a consistent JSON response object.
 * @param {MusicError|Error} err
 * @returns {{ error: string, code: string }}
 */
export function errorResponse(err) {
  const code = err.code || MusicErrorCodes.INTERNAL_ERROR;
  return { error: err.message, code };
}

/**
 * Sends a typed error response via Express res object.
 * @param {import('express').Response} res
 * @param {MusicError|Error} err
 */
export function sendError(res, err) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(errorResponse(err));
}
