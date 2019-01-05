import { Options } from './types';
import { DatabaseService } from './database';
import { OobService } from './oob';
import { TokenService } from './token';
import { UserService } from './user';

export function auth(options: Options) {
    const Database = new DatabaseService(options);
    const Oob = new OobService(options, Database);
    const Token = new TokenService(options);
    const User = new UserService(options, Database, Token);
    return {
        Database,
        Oob,
        Token,
        User,
    };
}