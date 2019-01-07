import { SQLService } from '@sheetbase/sheets-server';

import { Options, DatabaseDriver } from './types';
import { SheetsDriver } from './drivers';
import { OobService } from './oob';
import { TokenService } from './token';
import { AccountService } from './account';
import { userMiddleware, registerRoutes } from './routes';

export function auth(options: Options) {
    const Oob = new OobService(options);
    const Token = new TokenService(options);
    const Account = new AccountService(options);
    return {
        Oob,
        Token,
        Account,
        UserMiddleware: userMiddleware(Account),
        registerRoutes: registerRoutes(Account),
    };
}

export function sheetsDriver(sheetsSQL: SQLService): DatabaseDriver {
    return new SheetsDriver(sheetsSQL);
}
