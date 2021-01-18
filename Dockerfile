# Set node version
FROM node:14

# App directory
WORKDIR /usr/src
COPY package.json .
RUN npm install

# Copy all files
COPY . .

# Run app
CMD ["npm", "start"]