import { AddonRoutesOptions } from '@sheetbase/core-server';

import { OptionService } from './option';
import { AccountService } from './account';
import { DatabaseService } from './database';
import { OobService } from './oob';
import { ResetService } from './reset';
import { TokenService } from './token';

import { Options } from './types';
import { moduleRoutes } from './routes';

// TODO: TODO
// improve
// tests
// support database drivers
// add more database drivers
// custom auth solution instead of just apiKey
export enum DatabaseDriver {
  SHEETS = 'SHEETS',
  FIREBASE = 'FIREBASE',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
}

export class UserPasswordService {
  Option: OptionService;
  Account: AccountService;
  Database: DatabaseService;
  Oob: OobService;
  Reset: ResetService;
  Token: TokenService;

  constructor(options: Options) {
    this.Option = new OptionService(options);
    this.Database = new DatabaseService(this.Option);
    this.Token = new TokenService(this.Option);
    this.Oob = new OobService(this.Database);
    this.Reset = new ResetService(this.Option, this.Database, this.Oob);
    this.Account = new AccountService(this.Option, this.Database, this.Token);
  }

  getOptions(): Options {
    return this.Option.get();
  }

  registerRoutes(options?: AddonRoutesOptions) {
    return moduleRoutes(this, options);
  }

}
