# express-cognito-poc

A proof-of-concept ExpressJS application using AWS Cognito authentication.

This project was heavily influenced by the tutorial by [TDot Code](https://floydfajones.medium.com/?source=post_page-----ffc7bc9dc957--------------------------------), [Express with AWS CognitoAuth w/ Typescript (2020)](https://floydfajones.medium.com/express-with-aws-congito-auth-w-typescript-2020-ffc7bc9dc957) and a smaller proof-of-concept by [@ChildOfJustice](https://github.com/ChildOfJustice), found on GitHub at [Auth-AWS-Cognito-for-express-server](https://github.com/ChildOfJustice/Auth-AWS-Cognito-for-express-server). It extends the ideas presented in those resources to a more complete example, in order to help myself (and hopefully others by means of checking in the code here) better understand how to create an ExpressJS app using AWS Cognito for authentication.

## Setup

### Create an AWS Cognito User Pool

Login to your AWS account and open the Cognito Service, and follow the steps below:

1. Click 'Manage User Pools'
1. Click 'Create a user pool'
1. Enter a name for the pool and click 'Step through settings
1. Under 'Which standard attributes do you want to require?', select the following attributes:
   - birthdate
   - email
   - family name
   - name
1. Click 'Next step'
1. Make no changes on the next page, and click 'Next step'
1. Under 'How will a user e able to recover their account?' select 'Email only,' and click 'Next step'.
1. Make no changes on the next three pages, clicking 'Next step' on all three.
1. On the 'Which app clients will have access to this user pool?' click 'Add an app client'.
1. Type in an App client name and uncheck 'Enable lambda trigger...' and 'Enable SRP...', then click 'Create app client'.
1. Click 'Next step'.
1. Make no changes on the next page, and click 'Next step'.
1. Click 'Create pool'.
1. After the pool is created, click the pencil icon to the right of the 'App clients' section.
1. Click 'Show Details'
1. Make note of the 'App client id' and 'App client secret', as they will be needed in the next section of the setup.

### Create a `.env` file.

1. In the root of the project, make a copy of `.env.sample` called `.env`.
1. Update `AWS_USER_POOL_ID` with the ID of your user pool. This can be found by clicking on 'User Pools' in the top left corner, clicking on the name of your user pool, and copy/pasting the value of 'Pool Id' on the pool details page.
1. Update `AWS_USER_POOL_REGION` with the AWS region your user pool was created in (ex. `us-east-1`)
1. Update `AWS_CLIENT_ID` to the 'App client id' value found in step 16 in the previous section.
1. Update `AWS_CLIENT_SECRET` to teh 'Appl client secret' value found in step 16 in the previous section.

### Install Dependencies

Run `npm install` to install project dependencies

### Start the application

Run `npm run dev` to start the application with `nodemon`. The server will be listening on port `3030` (or whatever is configured for `SERVER_PORT` in the `.env` file).\

## Using the application.

The application exposes 4 endpoints:

- `GET /` - This is an unprotected "home" endpoint and can be used to verify that the application is running. It will respond with the JSON object `{ "message": "success" }`.
- `POST /auth/register` - This can be used to create a new user in the user pool. See [Creating Users](#creating-users) below.
- `POST /auth/verify` - This is used to verify a newly created user, using the code that was emailed to the user. See [Creating Users](#creating-users) below.
- `POST /auth/login` - This is used to "login" a user, essentially asking AWS Cognito for a set of JWTs that can be used to authenticate into protected endpoints. See [Authenticating with a User](#authenticating-with-a-user) below.
- `POST /auth/refresh` - This can be used to get a fresh set of JWTs without having to login again, using the refresh token received while initially logging in. See [Using a Refresh Token](#using-a-refresh-token) below.
- `GET /protected/secret` - This endpoint can be used to verify a JWT. If a valid access token is set as the `Authorization: Bearer` header, the endpoint will respond with a JSON message that includes the user's name. Otherwise, it will respond with a `401`. See [Authenticating with a User](#authenticating-with-a-user) for more information.

### Creating Users

To create a user, make a `POST` request to `/auth/register` with the following request body (filling in values as appropriate):

```json
{
  "username": "johnsmith",
  "password": "Test12345!",
  "email": "jsmith@example.com",
  "birthdate": "1980-01-01",
  "name": "John",
  "family_name": "Smith"
}
```

Note that the password must meet the password requirements established in AWS Cognito when the user pool was created. The email address must also be a valid email. The application will do some basic validation of this JSON and return a `400` if not formatted correctly.

If the request is successful, a `200` status will be returned, along with the raw response payload from AWS SDK. If you go to your user pool in the AWS Console, and click 'Users and groups', you'll see the new user listed with the status 'UNCONFIRMED'. You should also receive an email with a verification code.

Once you have the verification code, make a `POST` request to `/auth/verify` with the following request body (filling in values as appropriate):

```json
{
  "username": "johnsmith",
  "code": "123456"
}
```

As before, some validation will occur, and a `400` will be returned if the payload isn't valid. If all goes well, you'll get a `200` response and an empty JSON object `{}`, and the user will now be listed as 'CONFIRMED' in the user pool.

### Authenticating with a User

To login in, make a `POST` request to `/auth/login` with the following request body (filling in values as appropriate):

```json
{
  "username": "johnsmith",
  "password": "Test12345!"
}
```

Like previous requests, validation will occur and a `400` will be returned if the payload isn't valid. Also, if the username or password are incorrect, Cognito will return a `401` which will be passed through.

On a successful login, a `200` response and the body from Cognito will be passed through. The body will contain the `AccessToken`, `RefreshToken`, and `IdentityToken` needed for other operations. The former two are covered in this project.

The `AccessToken` can be used to make requests to the protected resource. To do this, make a `GET` request to `/protected/secret` with the `Authorization: Bearer ${AccessToken}` header set, where `${AccessToken}` is equal to the `AccessToken` retrieved from the request.

This endpoint will validate if the token is valid and not expired. If it is, a `200` response will be returned with a JSON message containing the user's name (this was extracted from the token). If the token is not valid or has expired, a `401 Not Authorized` response will be returned.

### Using a Refresh Token

The `RefreshToken` obtained in the previous section can be used to get a fresh set of tokens without having the user log in again. To do this, make a `POST` request to `/auth/refresh` with the following request body (filling in values as appropriate)

```json
{
  "username": "johnsmith",
  "refreshToken": "${refreshToken}"
}
```

This endpoint's response will behave the similar to the `POST /auth/login` returning either a `401` if the refresh token is no longer valid and/or the username is incorrect, or a `200` and new `AccessToken` and `IdentityToken`. A new `RefreshToken` is not issued from this API.
