# Genvid

This repository is now split into clean layers:

- `frontend/` — UI entrypoint and user-facing assets.
- `backend/` — API + service orchestration (Gamma 4b flow, scene splitting, image generation).
- `shared/` — request/response contracts used across layers.

## 1) Production Gamma 4b code location confirmation

Audit results in this repository:

- There are no git remotes configured (`git remote -v` returns empty).
- There are no extra branches besides `work` (`git branch -a`).
- Before this change, there was no Gamma 4b implementation tracked in this repo.

**Conclusion:** production Gamma 4b source is not present here and is likely in a separate private repo/service.

## 2) Backend API entrypoint

Start the backend:

```bash
npm start
```

Runs `backend/src/server.js` and exposes:

- `GET /health`
- `POST /api/generate-video`

## 3) Required environment variables

| Variable | Required | Default | Description |
|---|---|---:|---|
| `IMAGE_PROVIDER_NAME` | yes | n/a | Provider identifier for image generation |
| `IMAGE_PROVIDER_API_KEY` | yes | n/a | Provider credential (validated at startup) |
| `IMAGE_PROVIDER_TIMEOUT_MS` | no | `1800` | Per-attempt timeout |
| `IMAGE_PROVIDER_MAX_RETRIES` | no | `2` | Retry attempts after first failure |
| `IMAGE_PROVIDER_BACKOFF_MS` | no | `100` | Exponential backoff base |
| `GAMMA4B_TIMEOUT_MS` | no | `1200` | Timeout for Gamma 4b answers |
| `PORT` | no | `3000` | Backend listen port |

## 4) API contract

### Request (`POST /api/generate-video`)

```json
{
  "requestId": "req-123",
  "prompt": "Create a launch teaser",
  "durationSeconds": 10,
  "sceneChangeTimestamps": [5],
  "imageStyle": "cinematic"
}
```

### Response

```json
{
  "requestId": "req-123",
  "scenes": [
    { "index": 0, "start": 0, "end": 5 },
    { "index": 1, "start": 5, "end": 10 }
  ],
  "answers": [
    { "sceneIndex": 0, "answer": "...", "provider": "gamma4b", "latencyMs": 100, "timedOut": false }
  ],
  "images": [
    { "sceneIndex": 0, "url": "https://...", "provider": "...", "attempts": 1, "latencyMs": 95 }
  ]
}
```

## 5) Scene splitting behavior

Inputs:
- `durationSeconds`
- `sceneChangeTimestamps`

Rules:
- timestamps must be sorted ascending
- timestamps must be unique
- timestamps must be strictly inside bounds `(0, durationSeconds)`

Example:
- 10s total, split at 5s => `[{0-5}, {5-10}]`

## 6) Image generation reliability behavior

- per-attempt timeout
- retries with exponential backoff
- startup credential/config validation
- structured error logs with: `requestId`, provider, attempt, error, latency

## 7) Run tests

```bash
npm test
```

Covers:
- unit tests for scene splitting edge cases
- integration tests for image generation success/failure
- regression test for “late answer in Gamma 4b”

## 8) Debugging tips

- Use short timeout values in env vars to force retry/timeout scenarios.
- Check structured error logs in stdout/stderr for request tracing by `requestId`.
