FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm ci && npx playwright install-deps chromium && npx playwright install chromium

COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
