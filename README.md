# Sheetbase Module: @sheetbase/user-server

User management system.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/sheetbase/user-server.svg?branch=master)](https://travis-ci.com/sheetbase/user-server) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/user-server/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/user-server?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/user-server.svg)](https://www.npmjs.com/package/@sheetbase/user-server) [![License][license_badge]][license_url] [![clasp][clasp_badge]][clasp_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

Using npm: `npm install --save @sheetbase/user-server`

```ts
import * as User from "@sheetbase/user-server";
```

As a library: `1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr`

Set the _Indentifier_ to **UserModule** and select the lastest version, [view code](https://script.google.com/d/1ThvmvlMcPVBFUzT2QUy6pHiAEsfrKbhLSmju-CCXatiLASXXb8KFssHr/edit?usp=sharing).

```ts
declare const UserModule: { User: any };
const User = UserModule.User;
```

## Usage

- Docs homepage: https://sheetbase.github.io/user-server

- API reference: https://sheetbase.github.io/user-server/api

### Examples

```ts
import * as Auth from "./public_api";

function _load() {
  return Auth.auth({
    encryptionSecret: "xxx",
    databaseDriver: {} as any
  });
}
```

## License

**@sheetbase/user-server** is released under the [MIT](https://github.com/sheetbase/user-server/blob/master/LICENSE) license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/user-server/blob/master/LICENSE
[clasp_badge]: https://img.shields.io/badge/built%20with-clasp-4285f4.svg
[clasp_url]: https://github.com/google/clasp
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->
