import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';
import { config } from '../config';

const logger = console;

const pems: any = {};

export const verifyToken = (req: Request, res: Response, next: () => void) => {
  let token = req.header('Authorization');

  if (!token) {
    logger.error('No token found');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  token = token.replace('Bearer ', '');

  const decodedJwt = jwt.decode(token, { complete: true });

  if (!decodedJwt) {
    logger.error('Token could not be decoded');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  const kid = decodedJwt.header.kid;

  const { client_id, iss, username } = decodedJwt.payload;

  if (client_id !== config.aws.clientId) {
    logger.error('Token client ID does not match');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  if (!iss || !iss.includes(config.aws.userPoolId)) {
    logger.error('Token client ID belongs to a different user pool');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  if (!kid) {
    logger.error('Token kid not found');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  const pem = pems[kid];

  if (!pem) {
    logger.error('Token pem not found');
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  jwt.verify(token, pem, (error: any) => {
    if (error) {
      logger.error('Token could not be verified');
      res.status(401).json({ message: 'Not Authorized' });
      return;
    }

    res.locals.username = username;
    next();
  });
};

const initialize = async () => {
  logger.info('Initializing auth');

  const url = `https://cognito-idp.${config.aws.userPoolRegion}.amazonaws.com/${config.aws.userPoolId}/.well-known/jwks.json`;

  try {
    const response = await fetch(url);

    if (response.status !== 200) {
      throw new Error('Could not retrieve JWKS from AWS');
    }

    const data = await response.json();
    const { keys } = data;

    keys.forEach((key: any) => {
      const jwk = {
        kty: key.kty,
        n: key.n,
        e: key.e,
      };
      const pem = jwkToPem(jwk);
      pems[key.kid] = pem;
    });
  } catch (error) {
    console.error(error);
  }
};

initialize();
