import { AddonRoutesOptions } from '@sheetbase/core-server';

import { AccountService } from './account';
import { TokenService } from './token';
import { OobService } from './oob';
import { DatabaseService } from './database';

import { Options } from './types';

// TODO: TODO
// custom auth solution instead of just apiKey

export class UserService {
  private options: Options;

  Account: AccountService;
  Database: DatabaseService;
  Oob: OobService;
  Token: TokenService;

  constructor(options: Options) {
    this.options = {
      siteName: 'Sheetbase App',
      ... options,
    };

    this.Token = new TokenService(this.options);
    this.Database = new DatabaseService(this.options.sheetsSQL);
    this.Oob = new OobService(this.Database);
    this.Account = new AccountService(this.options, this.Database, this.Token);
  }

  registerRoutes(options?: AddonRoutesOptions) {

  }

}
