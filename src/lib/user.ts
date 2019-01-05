import { uniqueId } from '@sheetbase/core-server';
import { KJUR } from 'jsrsasign-jwths';

import { Options, User } from './types';
import { DatabaseService } from './database';
import { TokenService } from './token';

// TODO: TODO
// custom auth solution instead of just apiKey

export class UserService {
  private options: Options;
  private Database: DatabaseService;
  private Token: TokenService;

  constructor(
      options: Options,
      Database?: DatabaseService,
      Token?: TokenService,
   ) {
    this.options = {
        passwordSecret: '',
      ... options,
    };
    this.Database = Database || new DatabaseService(this.options);
    this.Token = Token || new TokenService(this.options);
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
        const user = this.Database.getUser({ email });
        if (!!user) {
            throw new Error('auth/user-exists');
        }

        // add user
        const timeNow: number = (new Date()).getTime();
        const uid = uniqueId(28, '1');
        const newUser: User = {
            email,
            uid,
            password: this.hashPassword(password),
            refreshToken: this.Token.createRefreshToken(),
            tokenTimestamp: timeNow,
            createdAt: timeNow,
            lastLogin: timeNow,
        };
        this.Database.addUser(newUser);
        // return the profile
        return this.availableProfile(newUser);
    }

    login(email: string, password: string) {
        const user = this.Database.getUser({ email });
        if (!user) {
            throw new Error('auth/user-not-exists');
        }

        // check password
        const { '#': id, uid, password: userPassword } = user;
        const passwordHash = this.hashPassword(password);
        if (userPassword !== passwordHash) {
            throw new Error('auth/wrong-password');
        }

        // update login
        this.Database.updateUser(id, { lastLogin: (new Date()).getTime() });
        return this.availableProfile(user);
    }

    getProfile(uid: string) {
        const user = this.Database.getUser({ uid });
        if (!user) {
            throw new Error('auth/user-not-exists');
        }
        return this.availableProfile(user);
    }

    updateProfile(uid: string, data: User) {
        const allowedFields = [
            'displayName', 'phoneNumber', 'address', 'photoUrl',
        ];
        const profile = {};
        for (let i = 0; i < allowedFields.length; i++) {
            const field = allowedFields[i];
            if (!!data[field]) {
                profile[field] = data[field];
            }
        }
        this.Database.updateUser({ uid }, profile);
    }

    changePassword(uid: string, password: string) {
        this.Database.updateUser({ uid }, {
            password: this.hashPassword(password),
        });
    }

    changePasswordByMatched(uid: string, currentPassword: string, newPassword: string) {
        // compare passwords
        const user = this.Database.getUser({ uid });
        if (!user) {
            throw new Error('auth/no-password-change');
        }
        const { password: passwordHash } = user;
        const currentPasswordHash = this.hashPassword(currentPassword);
        if (currentPasswordHash !== passwordHash) {
            throw new Error('auth/incorrect-password');
        }
        // set new password
        this.changePassword(uid, newPassword);
    }

    changePasswordByOob(oobCode: string, newPassword: string) {
        const user = this.Database.getUser({ oobCode });
        if (!user) {
            throw new Error('auth/no-password-change');
        }
        // set new password
        this.changePassword(user.uid, newPassword);
    }

    private availableProfile(user: User): User {
        const {
            '#': id, uid, email, username,
            createdAt, lastLogin,
            displayName, phoneNumber, address, photoUrl,
            claims, refreshToken, tokenTimestamp,
        } = user;
        return {
            '#': id, uid, email, username,
            createdAt, lastLogin,
            displayName, phoneNumber, address, photoUrl,
            claims, refreshToken, tokenTimestamp,
        };
    }

    private hashPassword(password: string) {
        const { passwordSecret } = this.options;
        return KJUR.crypto.Util.sha256(`${passwordSecret}.${password}`);
    }

}
