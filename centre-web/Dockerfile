# "build-stage", based on Node.js, to build and compile the frontend
# pull official base image
FROM node:24-alpine AS build-stage

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH

# install app dependencies exactly as locked
COPY package.json ./
COPY package-lock.json ./

RUN npm ci --silent

# create and set user permissions to app folder
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# add app files
COPY . ./

RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx.
# The unprivileged image runs as a non-root user and supports OpenShift's arbitrary UIDs.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
