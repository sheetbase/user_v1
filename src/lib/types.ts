import { Filter } from '@sheetbase/sheets-server';

export interface DatabaseDriver {
    getUser(finder: string | Filter): UserData;
    addUser(uid: string, userData: UserData): void;
    updateUser(uid: string, userData: UserData): void;
    deleteUser(uid: string): void;
}

export type AuthUrl = string | {(mode: string, oobCode: string): string};
export type EmailSubject = {(mode: string): string};
export type EmailBody = {(mode: string, url: string, userData: UserData): string};
export type ProviderId = 'password' | 'custom' | 'anonymous' | 'google.com' | 'facebook.com' | 'twitter.com';
export type OobMode = 'resetPassword' | 'verifyEmail' | 'none';

export interface Options {
    databaseDriver: DatabaseDriver;
    encryptionSecret: string;
    // oob email
    authUrl?: AuthUrl;
    emailPrefix?: string;
    emailSubject?: EmailSubject;
    emailBody?: EmailBody;
}

export interface UserData extends UserInfo, UserSecret {}

export interface UserInfo extends UserProfile {
    '#'?: number;
    uid?: string;
    providerId?: ProviderId;
    providerData?: any;
    email?: string;
    emailVerified?: boolean;
    createdAt?: string;
    lastLogin?: string;
    username?: string;
    phoneNumber?: string;
    claims?: {
        [claim: string]: any;
    };
    isAnonymous?: boolean;
    isNewUser?: boolean;
}

export interface UserProfile {
    displayName?: string;
    photoURL?: string;
}

export interface UserSecret {
    password?: string;
    refreshToken?: string;
    tokenTimestamp?: number;
    oobCode?: string;
    oobMode?: OobMode;
    oobTimestamp?: number;
}