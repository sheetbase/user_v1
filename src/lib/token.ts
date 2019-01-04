import { uniqueId } from '@sheetbase/core-server';
import { KJUR } from 'jsrsasign-jwths';

import { User, Options } from './types';

export class TokenService {
  private options: Options;

  constructor (options: Options) {
    this.options = options;
  }

  createRefreshToken() {
    return '1/' + uniqueId(64).substr(2, 62);
  }

  createIdToken(user: User): string {
    const { '#': id, uid, email, claims = {} } = user;
    return this.sign({ ... claims, id, uid, sub: email });
  }

  sign(payload: any): string {
    const { encryptionSecret } = this.options;
    return KJUR.jws.JWS.sign('HS256',
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      JSON.stringify({
        ... payload,
        iss: 'https://sheetbaseapp.com',
        aud: 'https://sheetbaseapp.com',
        iat: KJUR.jws.IntDate.get('now'),
        exp: KJUR.jws.IntDate.get('now + 1hour'),
      }),
      { utf8: encryptionSecret },
    );
  }

  verify(token: string) {
    const { encryptionSecret } = this.options;
    const isValid = KJUR.jws.JWS.verifyJWT(token,
      { utf8: encryptionSecret },
      {
        alg: ['HS256'],
        iss: ['https://sheetbaseapp.com'],
        aud: ['https://sheetbaseapp.com'],
      },
    );
    return !!isValid;
  }

  decode(token: string) {
    if (!this.verify(token)) { return null; }
    const { payloadObj } = KJUR.jws.JWS.parse(token);
    return payloadObj;
  }

}