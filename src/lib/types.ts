import { SQLService } from '@sheetbase/sheets-server';

export interface Options {
    encryptionSecret: string;
    sheetsSQL: SQLService;
    passwordSecret?: string;
    // oob email
    siteName?: string;
    authUrl?: string | {(mode: string, oobCode: string): string};
    passwordResetSubject?: string;
    passwordResetBody?(url: string, user: User): string;
}

export interface User {
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
