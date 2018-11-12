import { RouterService } from '@sheetbase/core-server';

export interface Options {
    router?: RouterService | any;
    disabledRoutes?: string[];

    database: DBSheets | any;
    databaseDriver?: string;

    apiKey: string;
    encryptionKey: string;
    siteName?: string;
    authUrl?: string;
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
    photoUrl?: string;
    refreshToken?: string | {
        token?: string;
        obtainedAt?: number;
    };
    providerData?: any;
    _password?: string;
    _oob?: string | {
        code?: string;
        obtainedAt?: number;
    };
}

export interface UserIdentity {
    uid?: string;
    email?: string;
    oobCode?: string;
}

export interface EmailTemplate {
    subject: string;
    plain?: string;
    html?: string;
}

export interface DBSheets {
    id: string;
}
