FROM hypriot/rpi-node:5

RUN apt-get update && apt-get install wireless-tools wpasupplicant

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app

# Install app dependencies
RUN npm install

CMD [ "npm", "start" ]

VOLUME [ "/var/log/" ]

# Bundle app source
COPY . /usr/src/app/

ARG version
ARG node_env

LABEL version=$version
ENV NODE_ENV=$node_env
