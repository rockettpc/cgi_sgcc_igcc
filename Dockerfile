# Stage 1: Build React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup Express Backend & Final Image
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server
COPY db/ ./db
COPY docs/ ./docs

# Copy built frontend assets from stage 1
COPY --from=client-builder /app/client/dist ./client/dist

# Create uploads volume directory
RUN mkdir -p /uploads

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
