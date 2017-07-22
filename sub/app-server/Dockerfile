#
# Copyright 2016 Alien Labs.
#
# Alen App Server.
#

#
# Base node image.
# https://github.com/nodejs/docker-node
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp
#

FROM node

#
# Environment.
#

ENV NODE_ENV=production

ENV HOME=/home/nx

ENV PORT=3000

#
# Create the nx user and home directory.
# https://docs.docker.com/articles/dockerfile_best-practices/#user
# http://stackoverflow.com/questions/24308760/running-app-inside-docker-as-non-root-user
#

RUN groupadd -r nx && useradd -r -g nx nx
RUN mkdir -p $HOME
RUN chown -R nx:nx $HOME

# Volume for local data.

RUN mkdir -p $HOME/app/var
RUN chown -R nx:nx $HOME/app/var
VOLUME $HOME/app/var

#
# Server modules.
#

ADD dist/package.json       $HOME/app/package.json

WORKDIR $HOME/app

RUN npm install --production

#
# Add sources.
#

ADD dist                    $HOME/app/dist
ADD dist/conf               $HOME/app/conf
ADD dist/data               $HOME/app/data
ADD src/server/public       $HOME/app/public
ADD src/server/views        $HOME/app/views

# Required for OAuth callback.
ENV ALIEN_SERVER_URL="https://app.robotik.io"

ENV ALIEN_CONFIG="alienlabs-beta.yml"
ENV ALIEN_CONFIG_AWS="aws/aws-dev.yml"
ENV ALIEN_CONFIG_FIREBASE="firebase/alienlabs-beta.yml"
ENV ALIEN_CONFIG_GOOGLE="google/alienlabs-dev.yml"

ENV ALIEN_SERVER_ASSETS_DIR="$HOME/app/dist"
ENV ALIEN_SERVER_CONF_DIR="$HOME/app/conf"
ENV ALIEN_SERVER_DATA_DIR="$HOME/app/data"
ENV ALIEN_SERVER_PUBLIC_DIR="$HOME/app/public"
ENV ALIEN_SERVER_VIEWS_DIR="$HOME/app/views"

EXPOSE $PORT

#
# Switch to user.
#

USER nx

#
# Startup.
# TODO(burdon): Logging.
# https://docs.npmjs.com/misc/config#environment-variables
#

CMD [ "node", "dist/server.bundle.js" ]
