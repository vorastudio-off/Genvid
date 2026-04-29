/**
 * Shared request/response contracts between frontend and backend.
 */

export const GenerateVideoRequestContract = {
  name: 'GenerateVideoRequest',
  required: [
    'requestId',
    'prompt',
    'durationSeconds',
    'sceneChangeTimestamps',
    'imageStyle'
  ]
};

export const GenerateVideoResponseContract = {
  name: 'GenerateVideoResponse',
  required: ['requestId', 'scenes', 'answers', 'images']
};

export function validateGenerateVideoRequest(payload) {
  const missing = GenerateVideoRequestContract.required.filter((key) => payload[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (typeof payload.requestId !== 'string' || payload.requestId.length === 0) {
    throw new Error('requestId must be a non-empty string');
  }
  if (typeof payload.prompt !== 'string' || payload.prompt.length === 0) {
    throw new Error('prompt must be a non-empty string');
  }
  if (!Number.isFinite(payload.durationSeconds) || payload.durationSeconds < 0) {
    throw new Error('durationSeconds must be a finite number >= 0');
  }
  if (!Array.isArray(payload.sceneChangeTimestamps)) {
    throw new Error('sceneChangeTimestamps must be an array');
  }
  if (typeof payload.imageStyle !== 'string' || payload.imageStyle.length === 0) {
    throw new Error('imageStyle must be a non-empty string');
  }
}
