import { SQLService } from '@sheetbase/sheets-server';

import { Options, DatabaseDriver } from './types';
import { SheetsDriver } from './drivers';
import { OobService } from './oob';
import { TokenService } from './token';
import { AccountService } from './account';
import { idTokenMiddleware, userMiddleware, registerRoutes } from './routes';

export function auth(options: Options) {
    const Account = new AccountService(options);
    const Oob = new OobService(options);
    const Token = new TokenService(options);
    return {
        Oob,
        Token,
        Account,
        IdTokenMiddleware: idTokenMiddleware(Token),
        UserMiddleware: userMiddleware(Account),
        registerRoutes: registerRoutes(Account, Oob),
    };
}

export function sheetsDriver(sheetsSQL: SQLService): DatabaseDriver {
    return new SheetsDriver(sheetsSQL);
}
