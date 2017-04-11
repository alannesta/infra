FROM node:6.9.4

COPY . /app

WORKDIR /app

RUN npm install --production

EXPOSE 4303

CMD ["npm", "start"]
