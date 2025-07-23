FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads/avatars uploads/medals

EXPOSE 3000

CMD ["npm", "run", "dev"]