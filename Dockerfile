FROM node:17-alpine

WORKDIR /usr/src/app

# Copy only package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Start a script that runs both index.js and discord.js
CMD ["sh", "-c", "node index.js & node discord.js"]
