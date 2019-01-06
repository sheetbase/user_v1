import { uniqueId } from '@sheetbase/core-server';

import { DatabaseDriver, UserData } from './types';
import { securePassword, sha256 } from './utils';

export class User {

    private userData: UserData;
    private Database: DatabaseDriver;

    constructor(
        userData: UserData,
        Database: DatabaseDriver,
    ) {
        this.userData = userData;
        this.Database = Database;
    }

    getData() {
        return this.userData;
    }

    getProfile() {
        const {
            '#': id, uid, email, username,
            createdAt, lastLogin,
            displayName, phoneNumber, address, photoUrl,
            claims, refreshToken, tokenTimestamp,
        } = this.userData;
        return {
            '#': id, uid, email, username,
            createdAt, lastLogin,
            displayName, phoneNumber, address, photoUrl,
            claims, refreshToken, tokenTimestamp,
        };
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

    updateClaims(claims: {[key: string]: any}) {
        this.userData.claims = { ... this.userData.claims, ... claims };
        return this;
    }

    setEmail(email: string): User {
        this.userData.email = email;
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

    save(): User {
        const { '#': id } = this.userData;
        this.Database.updateUser(id, this.userData);
        return this;
    }

}
