FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p src/uploads/products

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
