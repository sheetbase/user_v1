import { SQLService } from '@sheetbase/sheets-server';

import { Options, DatabaseDriver } from './types';
import { SheetsDriver } from './drivers';
import { OobService } from './oob';
import { TokenService } from './token';
import { AccountService } from './account';

export function auth(options: Options) {
    const Oob = new OobService(options);
    const Token = new TokenService(options);
    const Account = new AccountService(options);
    return {
        Oob,
        Token,
        Account,
    };
}

export function sheetsDriver(sheetsSQL: SQLService): DatabaseDriver {
    return new SheetsDriver(sheetsSQL);
}