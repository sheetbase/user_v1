import { SheetsDriver } from './drivers';

export interface DatabaseDriver extends SheetsDriver {}

export type UserFinder = number | { [field: string]: any };
export type AuthUrl = string | { (mode: string, oobCode: string): string };
export type PasswordResetBody = { (url: string, userData: UserData): string };

export interface Options {
    databaseDriver: DatabaseDriver;
    encryptionSecret: string;
    // oob email
    authUrl?: AuthUrl;
    siteName?: string;
    passwordResetSubject?: string;
    passwordResetBody?: PasswordResetBody;
}

export interface UserData {
    '#'?: number;
    email?: string;
    uid?: string;
    username?: string;
    createdAt?: number;
    lastLogin?: number;
    displayName?: string;
    phoneNumber?: string;
    address?: string;
    photoUrl?: string;
    password?: string;
    claims?: {
        [claim: string]: any;
    };
    refreshToken?: string;
    tokenTimestamp?: number;
    oobCode?: string;
    oobTimestamp?: number;
}