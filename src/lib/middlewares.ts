import { RouteHandler } from '@sheetbase/server';

import { TokenService } from './token';
import { AccountService } from './account';

export function idTokenMiddleware(Token: TokenService): RouteHandler {
    return (req, res, next) => {
        const idToken = req.query['idToken'] || req.body['idToken'];
        if (!!idToken) {
            const auth = Token.decodeIdToken(idToken);
            if (!!auth) {
                return next({ auth });
            }
        }
        return res.error('auth/invalid-token');
    };
}

export function userMiddleware(Account: AccountService): RouteHandler {
    return (req, res, next) => {
        const idToken = req.query['idToken'] || req.body['idToken'];
        if (!!idToken) {
            const user = Account.getUserByIdToken(idToken);
            if (!!user) {
                return next({ user });
            }
        }
        return res.error('auth/invalid-token');
    };
}