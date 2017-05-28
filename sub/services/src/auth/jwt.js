//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import { AuthDefs } from 'alien-core';

// TODO(burdon): Get from ENV or config.
const ALIEN_JWT_SECRET = _.get(process.env, 'ALIEN_JWT_SECRET', 'alien-jwt-secret');
const ALIEN_JWT_AUDIENCE = 'alienlabs.io';

/**
 * JWT Utils.
 *
 * https://jwt.io/introduction
 */
export class JwtUtil {

  /**
   * Creates the Passport JWT strategy.
   *
   * @param callback
   */
  static createStrategy(callback) {

    // https://www.npmjs.com/package/passport-jwt
    return new JwtStrategy({

      authScheme: AuthDefs.JWT_SCHEME,
      jwtFromRequest: ExtractJwt.fromAuthHeader(),    // 'authorization: JWT xxx'
      secretOrKey: ALIEN_JWT_SECRET,
      audience: ALIEN_JWT_AUDIENCE,

      // TODO(burdon): Implement auth-refresh.
      ignoreExpiration: true,

      passReqToCallback: true
    }, callback);
  }

  /**
   * Creates the custom JWT token.
   *
   * @param {stirng} userId Canonical User ID.
   * @returns {{ token, exp }} JWT id token and expiration time.
   */
  static createToken(userId) {
    let idTokenExp = moment().add(...AuthDefs.JWT_EXPIRATION).unix();

    // https://www.npmjs.com/package/jsonwebtoken
    let idToken = jwt.sign({
      aud: ALIEN_JWT_AUDIENCE,
      iat: moment().unix(),
      exp: idTokenExp,
      data: {
        // TODO(burdon): Add clientId for extra security?
        id: userId
      }
    }, ALIEN_JWT_SECRET);

    return {
      token: idToken,
      exp: idTokenExp
    };
  }
}
