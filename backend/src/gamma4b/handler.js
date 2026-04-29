/**
 * Orchestrates prompt/answer generation for Gamma 4b.
 */
export class Gamma4bHandler {
  /**
   * @param {{ask:(prompt:string, options:{deadlineMs:number})=>Promise<{answer:string,provider:string,latencyMs:number}>}} engine
   * @param {{answerTimeoutMs?:number, logger?:(entry:object)=>void}} options
   */
  constructor(engine, options = {}) {
    this.engine = engine;
    this.answerTimeoutMs = options.answerTimeoutMs ?? 1200;
    this.logger = options.logger ?? (() => {});
  }

  async generateAnswers(prompt, scenes, requestId) {
    const tasks = scenes.map((scene) => this.#answerScene(prompt, scene, requestId));
    return Promise.all(tasks);
  }

  async #answerScene(prompt, scene, requestId) {
    const started = Date.now();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('gamma4b answer timeout')), this.answerTimeoutMs);
    });

    try {
      const result = await Promise.race([
        this.engine.ask(`${prompt}\nScene ${scene.index + 1} (${scene.start}-${scene.end}s)`, {
          deadlineMs: this.answerTimeoutMs
        }),
        timeoutPromise
      ]);

      return {
        sceneIndex: scene.index,
        answer: result.answer,
        provider: result.provider,
        latencyMs: Date.now() - started,
        timedOut: false
      };
    } catch (error) {
      const entry = {
        level: 'error',
        requestId,
        module: 'gamma4b-handler',
        sceneIndex: scene.index,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - started
      };
      this.logger(entry);

      return {
        sceneIndex: scene.index,
        answer: 'Fallback answer due to delayed Gamma 4b response',
        provider: 'fallback',
        latencyMs: entry.latencyMs,
        timedOut: true
      };
    }
  }
}
