//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Logger } from 'alien-util';

const logger = Logger.get('webhook');

/**
 * Webhook router.
 * @param config
 * @param { hooks } options
 * @returns {Router}
 */
export const webhookRouter = (config, options) => {
  const router = express.Router();

  _.each(_.get(options, 'hooks'), (handler, id) => {
    logger.log('Hook: ' + id);
  });

  // TODO(burdon): Hook registry (from config file).
  router.post('/:id', (req, res) => {
    let { id } = req.params;

    let handler = _.get(options, 'hooks', {})[id];
    if (handler) {
      logger.log('Invoking hook: ' + id);
      return Promise.resolve(handler(req))
        .then(() => {
          res.status(200).send();
        })
        .catch(err => {
          logger.error(err);
          res.status(500).send();
        });

    } else {
      logger.warn('Invalid hook: ' + id);
      res.status(500).send();
    }
  });

  return router;
};
