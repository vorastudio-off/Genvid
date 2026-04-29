import { splitScenes } from './scene/sceneSplitter.js';
import { Gamma4bHandler } from './gamma4b/handler.js';
import { ImageGenerationClient } from './image/providerClient.js';
import { validateGenerateVideoRequest } from '../../shared/contracts.js';

export function createApp({ gammaEngine, imageProvider, env = process.env, logger = console }) {
  const gammaHandler = new Gamma4bHandler(gammaEngine, {
    answerTimeoutMs: Number(env.GAMMA4B_TIMEOUT_MS ?? 1200),
    logger: (entry) => logger.error(JSON.stringify(entry))
  });

  const imageClient = new ImageGenerationClient(imageProvider, {
    providerName: env.IMAGE_PROVIDER_NAME,
    apiKey: env.IMAGE_PROVIDER_API_KEY,
    requestTimeoutMs: Number(env.IMAGE_PROVIDER_TIMEOUT_MS ?? 1800),
    maxRetries: Number(env.IMAGE_PROVIDER_MAX_RETRIES ?? 2),
    baseBackoffMs: Number(env.IMAGE_PROVIDER_BACKOFF_MS ?? 100),
    logger: (entry) => logger.error(JSON.stringify(entry))
  });

  imageClient.validateStartupConfig();

  return {
    async generateVideo(payload) {
      validateGenerateVideoRequest(payload);
      const scenes = splitScenes(payload.durationSeconds, payload.sceneChangeTimestamps);
      const answers = await gammaHandler.generateAnswers(payload.prompt, scenes, payload.requestId);

      const images = [];
      for (const answer of answers) {
        const image = await imageClient.generateImage(
          payload.requestId,
          `${payload.prompt}\n${answer.answer}`,
          payload.imageStyle
        );
        images.push({ sceneIndex: answer.sceneIndex, ...image });
      }

      return {
        requestId: payload.requestId,
        scenes,
        answers,
        images
      };
    }
  };
}
