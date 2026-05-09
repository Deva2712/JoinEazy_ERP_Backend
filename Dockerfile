# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:20-alpine AS base
WORKDIR /app

# Install dependencies separately for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ─── Stage 2: Development ─────────────────────────────────────────────────────
FROM base AS development
# Install all deps including devDependencies (nodemon)
RUN npm ci
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM base AS production
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "start"]
