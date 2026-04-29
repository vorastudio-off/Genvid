function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('image provider timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ImageGenerationClient {
  /**
   * @param {{generate:(prompt:string, style:string)=>Promise<{url:string,provider:string}>}} provider
   * @param {{providerName:string, apiKey?:string, requestTimeoutMs?:number, maxRetries?:number, baseBackoffMs?:number, logger?:(entry:object)=>void}} config
   */
  constructor(provider, config) {
    this.provider = provider;
    this.config = {
      requestTimeoutMs: 1800,
      maxRetries: 2,
      baseBackoffMs: 100,
      ...config
    };
    this.logger = config.logger ?? (() => {});
  }

  validateStartupConfig() {
    if (!this.config.providerName) {
      throw new Error('IMAGE_PROVIDER_NAME is required');
    }
    if (!this.config.apiKey || this.config.apiKey.length < 8) {
      throw new Error('IMAGE_PROVIDER_API_KEY is missing or invalid');
    }
  }

  async generateImage(requestId, prompt, style) {
    const started = Date.now();
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await withTimeout(this.provider.generate(prompt, style), this.config.requestTimeoutMs);
        return {
          ...result,
          attempts: attempt + 1,
          latencyMs: Date.now() - started
        };
      } catch (error) {
        const isLastAttempt = attempt >= this.config.maxRetries;
        this.logger({
          level: 'error',
          module: 'image-provider-client',
          requestId,
          attempt: attempt + 1,
          provider: this.config.providerName,
          error: error instanceof Error ? error.message : String(error),
          latencyMs: Date.now() - started
        });

        if (isLastAttempt) {
          throw error;
        }

        const backoff = this.config.baseBackoffMs * 2 ** attempt;
        await sleep(backoff);
      }
      attempt += 1;
    }

    throw new Error('unreachable image generation state');
  }
}
