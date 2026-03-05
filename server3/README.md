# Talvix Server 3 (Automation Layer)

Deployed on [Fly.io](https://fly.io) as `talvix-server3`.

Runs the Server 3 FastAPI application with Google Chrome and Selenium via a custom Dockerfile.

## Deployment

```bash
fly deploy --config server3/fly.toml
```

## Health Check

```
GET /health
→ {"status": "ok", "server": "server3", "port": 8003}
```
