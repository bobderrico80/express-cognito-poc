import AWS from 'aws-sdk';
import {
  ConfirmSignUpRequest,
  InitiateAuthRequest,
  SignUpRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import crypto from 'crypto';
import { config } from '../config';

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: config.aws.userPoolRegion,
});

const generateHash = (username: string) => {
  return crypto
    .createHmac('SHA256', config.aws.clientSecret)
    .update(username + config.aws.clientId)
    .digest('base64');
};

export const registerUser = (
  username: string,
  password: string,
  userAttributes: any[]
) => {
  const params: SignUpRequest = {
    ClientId: config.aws.clientId,
    Password: password,
    Username: username,
    SecretHash: generateHash(username),
    UserAttributes: userAttributes,
  };

  return cognito.signUp(params).promise();
};

export const verifyUser = (username: string, code: string) => {
  const params: ConfirmSignUpRequest = {
    ClientId: config.aws.clientId,
    ConfirmationCode: code,
    SecretHash: generateHash(username),
    Username: username,
  };

  return cognito.confirmSignUp(params).promise();
};

export const loginUser = (username: string, password: string) => {
  const params: InitiateAuthRequest = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.aws.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: generateHash(username),
    },
  };

  return cognito.initiateAuth(params).promise();
};

export const refreshUser = (username: string, refreshToken: string) => {
  const params: InitiateAuthRequest = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: config.aws.clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      SECRET_HASH: generateHash(username),
    },
  };

  return cognito.initiateAuth(params).promise();
};
