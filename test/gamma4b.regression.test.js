import test from 'node:test';
import assert from 'node:assert/strict';
import { Gamma4bHandler } from '../backend/src/gamma4b/handler.js';

test('regression: late answer in Gamma 4b returns fallback response', async () => {
  const delayedEngine = {
    async ask() {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { answer: 'late answer', provider: 'gamma4b', latencyMs: 50 };
    }
  };

  const logs = [];
  const handler = new Gamma4bHandler(delayedEngine, {
    answerTimeoutMs: 10,
    logger: (entry) => logs.push(entry)
  });

  const [answer] = await handler.generateAnswers('prompt', [{ index: 0, start: 0, end: 5 }], 'req-late');
  assert.equal(answer.timedOut, true);
  assert.match(answer.answer, /Fallback answer/);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].requestId, 'req-late');
});
