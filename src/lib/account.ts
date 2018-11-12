import { uniqueId } from '@sheetbase/core-server';
import { KJUR } from 'jsrsasign-jwths';

import { User } from './types';
import { OptionService } from './option';
import { DatabaseService } from './database';
import { TokenService } from './token';

export class AccountService {
    private optionService: OptionService;
    private databaseService: DatabaseService;
    private tokenService: TokenService;

    constructor (
        optionService: OptionService,
        databaseService: DatabaseService,
        tokenService: TokenService,
    ) {
        this.optionService = optionService;
        this.databaseService = databaseService;
        this.tokenService = tokenService;
    }

    create(email: string, password: string) {
        if (!email || !password) {
            throw new Error('auth/missing');
        }

        if (
            // tslint:disable-next-line:max-line-length
            !(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
        ).test(email)) {
            throw new Error('auth/invalid-email');
        }
        if (('' + password).length < 7) {
            throw new Error('auth/invalid-passsword');
        }

        // check exists
        let user: User = this.databaseService.getUser({ email });
        if (!!user) {
            throw new Error('auth/user-exists');
        }

        const { encryptionKey } = this.optionService.get();
        const timeNow: number = (new Date()).getTime();
        const uid = uniqueId(28, '1');
        user = {
            email,
            uid,
            _password: KJUR.crypto.Util.sha256(
                `${encryptionKey}.${email}.${password}`,
            ),
            refreshToken: {
                token: '1/' + (uniqueId(50) as string).substr(2, 48),
                obtainedAt: timeNow,
            },
            createdAt: timeNow,
            lastLogin: timeNow,
        } as User;

        this.databaseService.updateUser({ uid }, user);
        return { accessToken: this.tokenService.generateAccessToken(user), profile: this.profile(user) };
    }

    login(email: string, password: string) {
        if (!email || !password) {
            throw new Error('auth/missing');
        }

        // check exists
        const user: User = this.databaseService.getUser({ email });
        if (!user) {
            throw new Error('auth/user-not-exists');
        }

        const { encryptionKey } = this.optionService.get();
        const passwordHash = KJUR.crypto.Util.sha256(
            `${encryptionKey}.${email}.${password}`,
        );
        if (user._password !== passwordHash) {
            throw new Error('auth/wrong-password');
        }

        // update login
        const uid = user.uid;
        this.databaseService.updateUser({ uid }, {
            lastLogin: (new Date()).getTime(),
        });

        return { accessToken: this.tokenService.generateAccessToken(user), profile: this.profile(user) };
    }

    private profile(user: User): User {
        const profile: User = { ... user };
        for (const key in profile) {
          if (key.substr(0, 1) === '_') delete profile[key];
        }
        return profile;
    }
}