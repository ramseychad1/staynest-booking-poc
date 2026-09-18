# Built with the repo root as the Docker build context (Railway does not
# scope the build context to a service's root directory), so every COPY
# below is repo-root-relative: TheBayHome-Backend/, not just ./
FROM node:22-alpine

WORKDIR /app

COPY TheBayHome-Backend/package.json TheBayHome-Backend/package-lock.json* ./
RUN npm install --omit=dev

COPY TheBayHome-Backend/ .

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8001

# Migrations run as Railway's pre-deploy step (see railway.toml / service
# config: preDeployCommand), not here - this only starts the API.
CMD ["node", "src/server.js"]
