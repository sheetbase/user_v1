import { KJUR } from 'jsrsasign-jwths';

import { Options, UserData } from './types';

export class TokenService {

  private encryptionSecret: string;

  constructor(options: Options) {
    this.encryptionSecret = options.encryptionSecret;
  }

  sign(payload: {[key: string]: any}): string {
    return KJUR.jws.JWS.sign('HS256',
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      JSON.stringify({
        ... payload,
        iss: 'https://sheetbaseapp.com',
        aud: 'https://sheetbaseapp.com',
        iat: KJUR.jws.IntDate.get('now'),
        exp: KJUR.jws.IntDate.get('now + 1hour'),
      }),
      { utf8: this.encryptionSecret },
    );
  }

  signIdToken(userData: UserData): string {
    const { '#': id, uid, email, claims = {} } = userData;
    return this.sign({ ... claims, id, uid, sub: email, tty: 'ID' });
  }

  decode(token: string, ands?: {[key: string]: any}) {
    // check validation
    let valid: boolean = !! KJUR.jws.JWS.verifyJWT(token,
      { utf8: this.encryptionSecret },
      {
        alg: ['HS256'],
        iss: ['https://sheetbaseapp.com'],
        aud: ['https://sheetbaseapp.com'],
      },
    );
    // extract the payload
    let payload: any;
    if (valid) {
      const { payloadObj } = KJUR.jws.JWS.parse(token);
      payload = payloadObj;
      // check ands
      if (!!ands) {
        for (const key of Object.keys(ands)) {
          if (!payload[key] || payload[key] !== ands[key]) {
            valid = false;
          }
        }
      }
    }
    return valid ? payload : null;
  }

  decodeIdToken(token: string) {
    return this.decode(token, { tty: 'ID' });
  }

  decodeCustomToken(token: string) {
    return this.decode(token, { tty: 'CUSTOM' });
  }

}