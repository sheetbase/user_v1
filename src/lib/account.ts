import { uniqueId } from '@sheetbase/core-server';
import { KJUR } from 'jsrsasign-jwths';

import { Options, User } from './types';
import { TokenService } from './token';
import { DatabaseService } from './database';

export class AccountService {
    private options: Options;
    private databaseService: DatabaseService;
    private tokenService: TokenService;

    constructor (
        options: Options,
        databaseService: DatabaseService,
        tokenService: TokenService,
    ) {
        this.options = options;
        this.databaseService = databaseService;
        this.tokenService = tokenService;
    }

    create(email: string, password: string) {
        // tslint:disable-next-line:max-line-length
        if (!(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i).test(email)) {
            throw new Error('auth/invalid-email');
        }
        if ((password || '').length < 7) {
            throw new Error('auth/invalid-passsword');
        }

        // check exists
        const user = this.databaseService.getUser({ email });
        if (!!user) {
            throw new Error('auth/user-exists');
        }

        // add user
        const timeNow: number = (new Date()).getTime();
        const uid = uniqueId(28, '1');
        const newUser: User = {
            email,
            uid,
            password: this.buildPassword(uid, password),
            refreshToken: this.tokenService.createRefreshToken(),
            tokenTimestamp: timeNow,
            createdAt: timeNow,
            lastLogin: timeNow,
        };
        this.databaseService.addUser(newUser);
        // return the profile
        return this.userProfile(newUser);
    }

    login(email: string, password: string) {
        const user = this.databaseService.getUser({ email });
        if (!user) {
            throw new Error('auth/user-not-exists');
        }

        // check password
        const { '#': id, uid, password: userPassword } = user;
        const passwordHash = this.buildPassword(uid, password);
        if (userPassword !== passwordHash) {
            throw new Error('auth/wrong-password');
        }

        // update login
        this.databaseService.updateUser(id, { lastLogin: (new Date()).getTime() });
        return this.userProfile(user);
    }

    changePassword(uid: string, currentPassword: string, newPassword: string) {
        // compare passwords
        const user = this.databaseService.getUser({ uid });
        const currentPasswordHash = this.buildPassword(uid, currentPassword);
        if (!user || currentPasswordHash !== user.password) {
            throw new Error('auth/no-password-change');
        }
        // set new password
        this.databaseService.updateUser({ uid }, {
            password: this.buildPassword(uid, newPassword),
        });
    }

    changePasswordByOob(oobCode: string, newPassword: string) {
        const user = this.databaseService.getUser({ oobCode });
        if (!user) {
            throw new Error('auth/no-password-change');
        }
        // set new password
        const { uid } = user;
        this.databaseService.updateUser({ uid }, {
            password: this.buildPassword(uid, newPassword),
        });
    }

    private userProfile(user: User): User {
        const profile = { ... user };
        profile.oobCode = null;
        profile.oobTimestamp = null;
        return profile;
    }

    private buildPassword(uid: string, password: string) {
        return KJUR.crypto.Util.sha256(`${uid}.${password}`);
    }

}