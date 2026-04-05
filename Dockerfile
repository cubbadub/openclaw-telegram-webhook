FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js .

EXPOSE 443

CMD ["node", "server.js"]