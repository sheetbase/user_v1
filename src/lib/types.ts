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

export interface UserData {
    '#'?: number;
    uid?: string;
    provider?: 'password' | 'custom' | 'google' | 'facebook' | 'twitter';
    email?: string;
    emailVerified?: boolean;
    createdAt?: number;
    lastLogin?: number;
    username?: string;
    displayName?: string;
    phoneNumber?: string;
    photoUrl?: string;
    claims?: {
        [claim: string]: any;
    };
    password?: string;
    refreshToken?: string;
    tokenTimestamp?: number;
    oobCode?: string;
    oobTimestamp?: number;
}