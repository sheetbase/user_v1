import { uniqueId } from '@sheetbase/core-server';

import { DatabaseDriver, UserData } from './types';
import { securePassword, sha256 } from './utils';
import { TokenService } from './token';

export class User {

    private userData: UserData;
    private Database: DatabaseDriver;
    private Token: TokenService;

    constructor(
        userData: UserData,
        Database: DatabaseDriver,
        Token: TokenService,
    ) {
        this.userData = userData;
        this.Database = Database;
        this.Token = Token;
    }

    getData() {
        return this.userData;
    }

    getProfile() {
        const {
            '#': id,
            uid,
            email = '',
            emailVerified = false,
            username = '',
            createdAt = 0,
            lastLogin = 0,
            displayName = '',
            phoneNumber = '',
            address = '',
            photoUrl = '',
            claims = {},
            refreshToken = '',
            tokenTimestamp = 0,
            provider = 'none',
        } = this.userData;
        return {
            '#': id, uid, email, emailVerified, username,
            createdAt, lastLogin,
            displayName, phoneNumber, address, photoUrl,
            claims, refreshToken, tokenTimestamp,
            provider,
        };
    }

    getIdToken() {
        return this.Token.signIdToken(this.userData);
    }

    updateProfile(data: UserData): User {
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
        // apply
        this.userData = { ... this.userData, ... profile };
        return this;
    }

    updateClaims(claims: {[key: string]: any}): User {
        this.userData.claims = { ... this.userData.claims, ... claims };
        return this;
    }

    setlastLogin(): User {
        this.userData.lastLogin = (new Date()).getTime();
        return this;
    }

    setEmail(email: string): User {
        this.userData.email = email;
        return this;
    }

    setEmailVerified(): User {
        this.userData.emailVerified = true;
        return this;
    }

    setPassword(password: string): User {
        this.userData.password = securePassword(password);
        return this;
    }

    setUsername(username: string): User {
        this.userData.username = username;
        return this;
    }

    setOob(): User {
        const { uid } = this.userData;
        this.userData.oobCode = sha256(uid + Utilities.getUuid());
        this.userData.oobTimestamp = (new Date()).getTime();
        return this;
    }

    setRefreshToken(): User {
        this.userData.refreshToken = uniqueId(64, 'A');
        this.userData.tokenTimestamp = (new Date()).getTime();
        return this;
    }

    delete(): User {
        const { '#': id } = this.userData;
        this.Database.deleteUser(id);
        return this;
    }

    save(): User {
        const { '#': id } = this.userData;
        this.Database.updateUser(id, this.userData);
        return this;
    }

}
