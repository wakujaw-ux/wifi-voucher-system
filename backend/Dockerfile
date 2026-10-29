# Tumia Node.js toleo la 20
FROM node:20-alpine

# Weka folda ya kazi
WORKDIR /app

# Copy package.json na package-lock.json kwanza
COPY package*.json ./

# Sakinisha packages
RUN npm install --production

# Copy code yote iliyobaki
COPY . .

# Fungua port 3000
EXPOSE 3000

# Amri ya kuwasha mfumo
CMD ["npm", "start"]