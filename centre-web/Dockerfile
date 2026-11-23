# "build-stage", based on Node.js, to build and compile the frontend
# pull official base image
FROM node:18-alpine as build-stage

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./

RUN npm install --silent

# create and set user permissions to app folder
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# add app files
COPY . ./

RUN npm run build

# Serve the compiled frontend with unprivileged NGINX.
FROM nginx/nginx-unprivileged:1.30.7-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
