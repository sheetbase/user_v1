import { uniqueId } from '@sheetbase/core-server';
import {
    User as UserData,
    UserInfo,
    UserEditableProfile,
    UserOobMode,
    UserProfile,
} from '@sheetbase/models';

import { DatabaseDriver } from './types';
import { sha256 } from './utils';
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

    getInfo(): UserInfo {
        const {
            uid,
            providerId,
            providerData = null,
            email = '',
            emailVerified = false,
            createdAt = '',
            lastLogin = '',
            username = '',
            phoneNumber = '',
            displayName = '',
            photoURL = '',
            bio = '',
            url = '',
            address = '',
            additionalData = null,
            claims = null,
            settings = null,
            isNewUser = false,
        } = this.userData;
        return {
            uid,
            providerId,
            providerData,
            email,
            emailVerified,
            createdAt,
            lastLogin,
            username,
            phoneNumber,
            displayName,
            photoURL,
            bio,
            url,
            address,
            additionalData,
            claims,
            settings,
            isAnonymous: !email && providerId === 'anonymous' ? true : false,
            isNewUser,
        };
    }

    getIdToken() {
        return this.Token.signIdToken(this.userData);
    }

    comparePassword(password: string) {
        const { uid = '', password: currentPasswordSecure } = this.userData;
        const passwordSecure = sha256(uid + password);
        return passwordSecure === currentPasswordSecure;
    }

    getProvider() {
        const { providerId, providerData } = this.userData;
        return { providerId, providerData };
    }

    getProfile(): UserProfile {
        const {
            uid,
            email = '',
            createdAt = '',
            phoneNumber = '',
            displayName = '',
            photoURL = '',
            bio = '',
            url = '',
            address = '',
            additionalData = null,
            claims = null,
        } = this.userData;
        const profile = {
            uid,
            email,
            createdAt,
            phoneNumber,
            displayName,
            photoURL,
            bio,
            url,
            address,
            additionalData,
            claims,
        };
        // clear empty field
        for (const key of Object.keys(profile)) {
            if (!profile[key]) {
                delete profile[key];
            }
        }
        return profile;
    }

    getPublicProfile(): UserProfile {
        const profile = this.getProfile();
        const { settings = {} } = this.userData;
        // remove private profile
        if (!settings.$email) {
            delete profile.email;
        }
        if (!settings.$phoneNumber) {
            delete profile.phoneNumber;
        }
        if (!settings.$address) {
            delete profile.address;
        }
        // remove private addional data
        const { additionalData } = profile;
        if (!!additionalData && additionalData instanceof Object) {
            for (const key of Object.keys(additionalData)) {
                if (!settings['$' + key]) {
                    delete additionalData[key];
                }
            }
            // set it back
            profile.additionalData = additionalData;
        }
        // clear empty field
        for (const key of Object.keys(profile)) {
            if (!profile[key]) {
                delete profile[key];
            }
        }
        return profile;
    }

    updateProfile(data: UserEditableProfile): User {
        const allowedFields = [ 'displayName', 'photoURL', 'bio', 'url', 'address' ];
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

    setAdditionalData(data: {[key: string]: any}): User {
        this.userData.additionalData = { ... this.userData.additionalData, ... data };
        return this;
    }

    setSettings(data: {[key: string]: any}): User {
        this.userData.settings = { ... this.userData.settings, ... data };
        return this;
    }

    setProfilePublicly(props: string | string[]): User {
        const { settings = {} } = this.userData;
        // turn string to string[]
        if (typeof props === 'string') {
            props = [ props ];
        }
        // set props
        for (let i = 0; i < props.length; i++) {
            settings['$' + props[i]] = true;
        }
        // set it back
        this.userData.settings = settings;
        return this;
    }

    setProfilePrivately(props: string | string[]): User {
        const { settings } = this.userData;
        if (!!settings && settings instanceof Object) {
            // turn string to string[]
            if (typeof props === 'string') {
                props = [ props ];
            }
            // set props
            for (let i = 0; i < props.length; i++) {
                delete settings['$' + props[i]];
            }
            // set it back
            this.userData.settings = settings;
        }
        return this;
    }

    updateClaims(claims: {[key: string]: any}): User {
        this.userData.claims = { ... this.userData.claims, ... claims };
        return this;
    }

    setProviderData(data: any): User {
        this.userData.providerData = data;
        return this;
    }

    setlastLogin(): User {
        this.userData.lastLogin = new Date().toISOString();
        return this;
    }

    setEmail(email: string): User {
        this.userData.email = email;
        return this;
    }

    confirmEmail(): User {
        this.userData.emailVerified = true;
        return this;
    }

    setPassword(password: string): User {
        // TODO: implement bcrypt
        const { uid = '' } = this.userData;
        this.userData.password = sha256(uid + password);
        return this;
    }

    setUsername(username: string): User {
        this.userData.username = username;
        return this;
    }

    setPhoneNumber(phoneNumber: string): User {
        this.userData.phoneNumber = phoneNumber;
        return this;
    }

    setOob(mode: UserOobMode = 'none'): User {
        const { uid } = this.userData;
        // valid modes
        if (mode !== 'resetPassword' && mode !== 'verifyEmail') {
            mode = 'none';
        }
        this.userData.oobCode = sha256(uid + Utilities.getUuid());
        this.userData.oobMode = mode;
        this.userData.oobTimestamp = (new Date()).getTime();
        return this;
    }

    setRefreshToken(): User {
        this.userData.refreshToken = uniqueId(64, 'A');
        this.userData.tokenTimestamp = (new Date()).getTime();
        return this;
    }

    delete(): User {
        const { uid } = this.userData;
        this.Database.deleteUser(uid);
        return this;
    }

    save(): User {
        const { uid } = this.userData;
        if (!!uid) {
            this.Database.updateUser(uid, this.userData);
        } else {
            this.Database.addUser(uid, this.userData);
        }
        return this;
    }

}
