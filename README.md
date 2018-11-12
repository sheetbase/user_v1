# Sheetbase Module: @sheetbase/user-password-server

Create and login user with email and password.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/sheetbase/user-password-server.svg?branch=master)](https://travis-ci.com/sheetbase/user-password-server) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/user-password-server/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/user-password-server?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/user-password-server.svg)](https://www.npmjs.com/package/@sheetbase/user-password-server) [![License][license_badge]][license_url] [![clasp][clasp_badge]][clasp_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

Using npm: `npm install --save @sheetbase/user-password-server`

```ts
import * as UserPassword from "@sheetbase/user-password-server";
```

As a library: `1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr`

Set the _Indentifier_ to **UserPasswordModule** and select the lastest version, [view code](https://script.google.com/d/1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr/edit?usp=sharing).

```ts
declare const UserPasswordModule: { UserPassword: any };
const UserPassword = UserPasswordModule.UserPassword;
```

## Scopes

`https://www.googleapis.com/auth/gmail.send

https://www.googleapis.com/auth/script.send_mail

https://www.googleapis.com/auth/script.scriptapp

https://www.googleapis.com/auth/spreadsheets`

## Usage

- Docs homepage: https://sheetbase.github.io/user-password-server

- API reference: https://sheetbase.github.io/user-password-server/api

### Examples

```ts
import * as UserPassword from "./public_api";

const database = {
  id: "1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI"
};

const apiKey = "the_api_key";
const encryptionKey = "xxx";

function load_() {
  return UserPassword.userPassword({ database, apiKey, encryptionKey });
}

export function example1(): void {
  const UserPassword = load_();
  const profile = UserPassword.Account.create("test@mail.com", "test0123");
  Logger.log(profile);
}

export { database, apiKey, encryptionKey };
```

## License

**@sheetbase/user-password-server** is released under the [MIT](https://github.com/sheetbase/user-password-server/blob/master/LICENSE) license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/user-password-server/blob/master/LICENSE
[clasp_badge]: https://img.shields.io/badge/built%20with-clasp-4285f4.svg
[clasp_url]: https://github.com/google/clasp
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->
