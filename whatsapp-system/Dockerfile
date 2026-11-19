FROM node:20-alpine

WORKDIR /app

# Install native dependencies and timezone data
RUN apk add --no-cache libc6-compat tzdata

# Copy package descriptors first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application code
COPY . .

# Ensure auth session folder exists
RUN mkdir -p auth_session

EXPOSE 5055

ENV NODE_ENV=production \
    TZ=Africa/Cairo \
    WA_PORT=5055

CMD ["node", "src/index.js"]

