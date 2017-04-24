#
# Copyright 2016 Alien Labs.
#
# Alen Web Server
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

RUN npm install

#
# Add sources.
#

# TODO(burdon): Set-up for Jenkins local build.
# TODO(burdon): Currently just add all unbuilt assets.

ADD conf                    $HOME/app/conf
ADD dist                    $HOME/app/dist
ADD src/public              $HOME/app/dist/public
ADD src/views               $HOME/app/dist/views

ENV APP_SERVER_CONF_DIR="$HOME/app/conf"
ENV APP_SERVER_NODE_MODULES="$HOME/app/node_modules"
ENV APP_SERVER_ASSETS_DIR="$HOME/app/dist"
ENV APP_SERVER_PUBLIC_DIR="$HOME/app/dist/public"
ENV APP_SERVER_VIEWS_DIR="$HOME/app/dist/views"

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
