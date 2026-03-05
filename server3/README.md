# Talvix Server 3 (Automation Layer)

Deployed on [FluxCloud](https://runonflux.com) via **Deploy with Git**.

Runs the Server 3 FastAPI application with Google Chrome and Selenium via a custom Dockerfile.

## Port

Container exposes port **8080**. Set this as the container port when registering on FluxCloud.

## Health Check

```
GET /health
→ {"status": "ok", "server": "server3", "port": 8003}
```
