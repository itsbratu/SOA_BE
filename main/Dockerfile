FROM node:16-slim

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

RUN npm run build

EXPOSE 9000

CMD ["npm", "start"]
