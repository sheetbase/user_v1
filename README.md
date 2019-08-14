# Sheetbase Module: @sheetbase/user

User management system.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/sheetbase/user.svg?branch=master)](https://travis-ci.com/sheetbase/user) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/user/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/user?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/user.svg)](https://www.npmjs.com/package/@sheetbase/user) [![License][license_badge]][license_url] [![clasp][clasp_badge]][clasp_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

Using npm: `npm install --save @sheetbase/user`

```ts
import * as User from "@sheetbase/user";
```

As a library: `1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr`

Set the _Indentifier_ to **UserModule** and select the lastest version, [view code](https://script.google.com/d/1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr/edit?usp=sharing).

```ts
declare const UserModule: { User: any };
const User = UserModule.User;
```

## Usage

- Docs homepage: https://sheetbase.github.io/user

- API reference: https://sheetbase.github.io/user/api

<!-- <block:body> -->

## Getting started

Install: `npm install --save @sheetbase/user`

Usage:

```ts
import { auth } from "@sheetbase/user";

const Auth = auth({
  /* configs */
});
```

## Configs

Sheetbase auth configs

### databaseDriver

Database driver for auth module, for now only driver support is [@sheetbase/sheets](https://github.com/sheetbase/sheets).

```ts
import { sheets } from "@sheetbase/sheets";
import { auth, sheetsDriver } from "@sheetbase/user";

// Sheets instance
const Sheets = sheets({
  /* configs */
});

const Auth = auth({
  databaseDriver: sheetsDriver(Sheets.toAdmin())
  /* other configs */
});
```

### encryptionSecret

Secret key for signing token.

### emailPrefix

App name or any prefix for using when sending OOB emails.

### authUrl

Custom url for handling oob actions, a string or a builder that recieves a mode and a code then returns the url.

```ts
type AuthUrl = string | ((mode: string, oobCode: string) => string);
```

```ts
// auth url with the apiKey
{
authUrl: (mode, oobCode) => ScriptApp.getService().getUrl() +
        '?e=auth/action&' +
        `mode=${mode}&oobCode=${oobCode}&`
        `apiKey=${apiKey}`,
}
```

### emailSubject

Email subject builder.

```ts
type EmailSubject = (mode: string) => string;
```

### emailBody

Email body builder.

```ts
type EmailBody = (mode: string, url: string, userData: UserData) => string;
```

## Account

Account related actions.

- `user`: create a user instance from data
- `getUser`: get a user
- `isUser`: check if a user exists
- `getUserByEmailAndPassword`: get user by email & password
- `getUserByCustomToken`: by custom token
- `getUserAnonymously`: anomymously
- `getUserByIdToken`: id token
- `getUserByOobCode`: oob code
- `getUserByRefreshToken`: refresh token
- `getUserByOauthProvider`: oauth provider
- `getPublicUsers`: public users
- `isValidPassword`: check if password is valid

## User

The user object.

- `getData`
- `getInfo`
- `getIdToken`
- `comparePassword`
- `getProvider`
- `getProfile`
- `getPublicProfile`
- `updateProfile`
- `setAdditionalData`
- `setSettings`
- `setProfilePublicly`
- `setProfilePrivately`
- `updateClaims`
- `setlastLogin`
- `setEmail`
- `confirmEmail`
- `setPassword`
- `setUsername`
- `setPhoneNumber`
- `setOob`
- `setRefreshToken`
- `delete`
- `save`

## Middlewares

- `Auth.IdTokenMiddleware`
- `Auth.UserMiddleware`

## Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
Auth.registerRoutes(options?: AddonRoutesOptions);
```

<!-- </block:body> -->

## License

**@sheetbase/user** is released under the [MIT](https://github.com/sheetbase/user/blob/master/LICENSE) license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/user/blob/master/LICENSE
[clasp_badge]: https://img.shields.io/badge/built%20with-clasp-4285f4.svg
[clasp_url]: https://github.com/google/clasp
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->
