import test from 'node:test';
import assert from 'node:assert/strict';
import { ImageGenerationClient } from '../backend/src/image/providerClient.js';

test('image generation succeeds after one retry', async () => {
  let attempts = 0;
  const provider = {
    async generate() {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('temporary upstream error');
      }
      return { url: 'https://example.com/final.png', provider: 'fake' };
    }
  };

  const client = new ImageGenerationClient(provider, {
    providerName: 'fake',
    apiKey: '12345678',
    maxRetries: 2,
    baseBackoffMs: 1,
    requestTimeoutMs: 100
  });

  const result = await client.generateImage('req-1', 'a prompt', 'cinematic');
  assert.equal(result.url, 'https://example.com/final.png');
  assert.equal(result.attempts, 2);
});

test('image generation fails after retries exhausted', async () => {
  const provider = {
    async generate() {
      throw new Error('hard failure');
    }
  };

  const client = new ImageGenerationClient(provider, {
    providerName: 'fake',
    apiKey: '12345678',
    maxRetries: 1,
    baseBackoffMs: 1,
    requestTimeoutMs: 50
  });

  await assert.rejects(() => client.generateImage('req-2', 'a prompt', 'style'), /hard failure/);
});
