FROM node:latest

WORKDIR /src
COPY package*.json /

RUN npm ci
COPY . /

CMD ["node", "app.js"]