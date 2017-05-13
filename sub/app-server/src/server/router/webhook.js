//
// Copyright 2017 Alien Labs.
//

import express from 'express';

import { Logger } from 'alien-util';

const logger = Logger.get('webhook');

/**
 * Webhook router.
 * @param {} options
 * @returns {Router}
 */
export const webhookRouter = (options) => {
  const router = express.Router();

  // TODO(burdon): Hook registry (from config file).
  router.get('/:id', (req, res) => {
    let { id } = req.params;
    logger.log('Hook:', id);
  });

  return router;
};
