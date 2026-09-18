# Built with the repo root as the Docker build context (Railway does not
# scope the build context to a service's root directory), so every COPY
# below is repo-root-relative: TheBayHome-Backend/, not just ./
FROM node:22-alpine

WORKDIR /app

# One COPY of the whole directory rather than a separate
# package.json-only layer first: Railway's BuildKit daemon fails to
# calculate a checksum when a COPY instruction mixes an exact path with a
# subdirectory-prefixed wildcard glob (e.g. `TheBayHome-Backend/package-lock.json*`)
# in the same instruction. Not worth chasing the layer-caching optimization
# for a POC-sized dependency tree.
COPY TheBayHome-Backend/ .
RUN npm install --omit=dev
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8001

# Migrations run as Railway's pre-deploy step (see railway.toml / service
# config: preDeployCommand), not here - this only starts the API.
CMD ["node", "src/server.js"]
