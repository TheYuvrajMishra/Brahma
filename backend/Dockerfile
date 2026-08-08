FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src

# Build TypeScript code
RUN npm run build

EXPOSE 3005 3006

CMD ["node", "dist/index.js"]
