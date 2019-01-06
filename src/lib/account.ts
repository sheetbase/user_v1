import { uniqueId } from '@sheetbase/core-server';

import { Options, DatabaseDriver, UserFinder, UserData } from './types';
import { TokenService } from './token';
import { User } from './user';
import { securePassword } from './utils';

export class AccountService {

    private Database: DatabaseDriver;
    private Token: TokenService;

    constructor(options: Options) {
        this.Database = options.databaseDriver;
        this.Token = new TokenService(options);
    }

    private user(userData: UserData) {
        return new User(userData, this.Database);
    }

    isUser(finder: UserFinder) {
        return !! this.getUser(finder);
    }

    getUser(finder: UserFinder) {
        const userData = this.Database.getUser(finder);
        return !!userData ? this.user(userData) : null;
    }

    getUserByEmailAndPassword(email: string, password: string) {
        const user = this.getUser({ email });
        if (!!user) {
            const { password: userPassword } = user.getData();
            const passwordHash = securePassword(password);
            if (userPassword === passwordHash) {
                return user;
            }
        } else {
            const timeNow: number = (new Date()).getTime();
            const newUser: UserData = {
                email,
                uid: uniqueId(28, '1'),
                password: securePassword(password),
                refreshToken: uniqueId(64, 'A'),
                tokenTimestamp: timeNow,
                createdAt: timeNow,
                lastLogin: timeNow,
            };
            return this.user(newUser).save();
        }
        return null;
    }

    getUserByCustomToken(customToken: string) {
        const payload = this.Token.decodeIdToken(customToken);
        if (!!payload) {
            const { uid } = payload;
            const user = this.getUser({ uid });
            if (!!user) {
                return user;
            } else {
                const timeNow: number = (new Date()).getTime();
                const newUser: UserData = {
                    uid,
                    refreshToken: uniqueId(64, 'A'),
                    tokenTimestamp: timeNow,
                    createdAt: timeNow,
                    lastLogin: timeNow,
                };
                return this.user(newUser).save();
            }
        }
        return null;
    }

    getUserByIdToken(idToken: string) {
        const payload = this.Token.decodeIdToken(idToken);
        if (!!payload) {
            const { uid } = payload;
            const user = this.getUser({ uid });
            if (!!user) {
                return user;
            }
        }
        return null;
    }

    getUserByOobCode(oobCode: string) {
        const user = this.getUser({ oobCode });
        if (!!user) {
            const { oobTimestamp } = user.getData();
            const beenMinutes = Math.round(((new Date()).getTime() - oobTimestamp) / 60000);
            if (!!oobTimestamp && beenMinutes < 60) {
                return user;
            }
        }
        return null;
    }

}