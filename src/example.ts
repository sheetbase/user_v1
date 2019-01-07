import * as Auth from './public_api';

function _load() {
   return Auth.auth({
      encryptionSecret: 'xxx',
      databaseDriver: {} as any,
   });
}