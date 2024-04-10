FROM node:lts-alpine
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install && \
    yarn global add serve
COPY . .
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
CMD ["serve", "-s", "build"]
