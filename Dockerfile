FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p /app/.data && chown node:node /app/.data
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/content.js ./src/content.js
COPY --from=build /app/src/learning.js ./src/learning.js
COPY --from=build /app/src/curriculum ./src/curriculum
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
