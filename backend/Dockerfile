# backend/Dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 60000

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
