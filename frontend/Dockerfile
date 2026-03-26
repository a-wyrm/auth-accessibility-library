FROM node:20-bookworm

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY public ./public
COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000

CMD ["npm", "start"]
