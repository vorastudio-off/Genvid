import http from 'node:http';
import { createApp } from './app.js';

const gammaEngine = {
  async ask(prompt) {
    return {
      answer: `Gamma 4b answer for: ${prompt.slice(0, 30)}...`,
      provider: 'gamma4b',
      latencyMs: 100
    };
  }
};

const imageProvider = {
  async generate(prompt, style) {
    return {
      url: `https://images.example.com/${encodeURIComponent(style)}/${encodeURIComponent(prompt.slice(0, 24))}`,
      provider: 'mock-image-provider'
    };
  }
};

const app = createApp({ gammaEngine, imageProvider, env: process.env, logger: console });

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate-video') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const response = await app.generateVideo(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
