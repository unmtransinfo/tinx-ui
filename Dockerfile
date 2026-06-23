FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install

# expose is just documentation
EXPOSE 8080 

# can replace this command in docker-compose file
CMD ["npm", "run", "dev"]
