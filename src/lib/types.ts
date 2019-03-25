import { Filter } from '@sheetbase/sheets-server';
import { User as UserData } from '@sheetbase/models';

export interface DatabaseDriver {
    getUser(finder: string | Filter): UserData;
    addUser(uid: string, userData: UserData): void;
    updateUser(uid: string, userData: UserData): void;
    deleteUser(uid: string): void;
}

export type AuthUrl = string | {(mode: string, oobCode: string): string};
export type EmailSubject = {(mode: string): string};
export type EmailBody = {(mode: string, url: string, userData: UserData): string};

export interface Options {
    databaseDriver: DatabaseDriver;
    encryptionSecret: string;
    // oob email
    authUrl?: AuthUrl;
    emailPrefix?: string;
    emailSubject?: EmailSubject;
    emailBody?: EmailBody;
}

export interface GoogleUserInfo {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    link?: string;
    [key: string]: any;
}

export interface FacebookUserInfo {
    id?: string;
    email?: string;
    name?: string;
    picture?: any;
    [key: string]: any;
}