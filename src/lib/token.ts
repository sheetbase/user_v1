import { KJUR } from 'jsrsasign-jwths';

import { User, Options } from './types';
import { OptionService } from './option';

export class TokenService {
  private optionService: OptionService;

  constructor (
    optionService: OptionService,
  ) {
    this.optionService = optionService;
  }

  generateAccessToken(user: User): string {
    const { encryptionKey } = this.optionService.get() as Options;
    const { uid, email } = user;
    // generate access token
    const iss = 'https://sheetbaseapp.com';
    const tNow = KJUR.jws.IntDate.get('now');
    const tEnd = KJUR.jws.IntDate.get('now + 1hour');
    return KJUR.jws.JWS.sign('HS256',
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      JSON.stringify({
        uid, iss,
        sub: email,
        nbf: tNow,
        iat: tNow,
        exp: tEnd,
        jti: uid,
        aud: iss,
      }),
      { utf8: encryptionKey },
    );
  }

}