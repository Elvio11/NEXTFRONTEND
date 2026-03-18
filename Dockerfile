FROM python:3.11.9-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Node.js for MCPorter CLI (MCP tool execution)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install MCPorter CLI globally and register tools
RUN npm install -g @mcporter/cli \
    && mcporter install playwright firecrawl markitdown tavily mcp-gmail

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/start.sh

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "/app/start.sh"]
