FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001 
# Nota: Cambia a EXPOSE 3002 para el Dockerfile de orders-api
CMD ["npm", "start"]