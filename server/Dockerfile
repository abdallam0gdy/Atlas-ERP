FROM node:20-alpine

WORKDIR /app

# Install necessary libraries for native modules (sharp, etc.)
RUN apk add --no-cache libc6-compat

# Copy package descriptors first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy server application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads backups

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
