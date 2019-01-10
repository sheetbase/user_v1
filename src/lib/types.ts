export interface DatabaseDriver {
    getUser(finder: UserFinder): UserData;
    addUser(userData: UserData): void;
    updateUser(finder: UserFinder, userData: UserData): void;
    deleteUser(finder: UserFinder): void;
}

export type UserFinder = number | {[field: string]: any};
export type AuthUrl = string | {(mode: string, oobCode: string): string};
export type EmailSubject = {(mode: string): string};
export type EmailBody = {(mode: string, url: string, userData: UserData): string};

export interface Options {
    databaseDriver: DatabaseDriver;
    encryptionSecret: string;
    // oob email
    authUrl?: AuthUrl;
    siteName?: string;
    emailSubject?: EmailSubject;
    emailBody?: EmailBody;
}

export interface UserData extends UserInfo, UserSecret {}

export interface UserInfo extends UserProfile {
    '#'?: number;
    uid?: string;
    providerId?: 'password' | 'custom' | 'google.com' | 'facebook.com' | 'twitter.com';
    providerData?: any;
    email?: string;
    emailVerified?: boolean;
    createdAt?: number;
    lastLogin?: number;
    username?: string;
    phoneNumber?: string;
    claims?: {
        [claim: string]: any;
    };
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
    oobTimestamp?: number;
}