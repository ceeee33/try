# Step 1: Use an official Node.js image as the base image
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Step 4: Install project dependencies
RUN npm ci

# Step 5: Copy the rest of the project files to the container
COPY . .

# Step 6: Expose the application port (usually 3000 for Node.js apps)
EXPOSE 3000

# Step 7: Define the command to run your app
CMD ["npm", "start"]
