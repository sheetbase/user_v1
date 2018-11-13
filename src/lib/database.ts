import { sheetsNosql, SheetsNosqlService } from '@sheetbase/sheets-nosql-server';

import { User, UserIdentity, DBSheets } from './types';
import { OptionService } from './option';

export class DatabaseService {
    private optionService: OptionService;

    constructor (optionService: OptionService) {
        this.optionService = optionService;
    }

    getUsers(): User[] {
        const { databaseDriver } = this.optionService.get();
        return this[`getUsersFrom${databaseDriver}`]();
    }

    getUser(identity: UserIdentity): User {
        const { databaseDriver } = this.optionService.get();
        return this[`getUserFrom${databaseDriver}`](identity);
    }

    updateUser(identity: UserIdentity, data: User) {
        const { databaseDriver } = this.optionService.get();
        return this[`updateUserFrom${databaseDriver}`](identity, data);
    }

    /**
     * SHEETS
     *
     */
    private SHEETS(): SheetsNosqlService {
        const { database } = this.optionService.get();
        const databaseId: string = (database as DBSheets).id;
        return sheetsNosql({ databaseId });
    }

    private getUsersFromSHEETS(): User[] {
        const DB = this.SHEETS();
        return DB.list('/users');
    }

    private getUserFromSHEETS(identity: UserIdentity): User {
        const DB = this.SHEETS();
        // TODO: replace with the native query
        let userResult: User;
        const identityKey: string = Object.keys(identity)[0];
        const identityValue: any = identity[identityKey];
        const users: User[] = DB.list('/users');
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (user[identityKey] === identityValue) {
                userResult = user;
            }
        }
        return userResult;
    }

    private updateUserFromSHEETS(identity: UserIdentity, data: User | any) {
        const DB = this.SHEETS();
        const user = this.getUserFromSHEETS(identity);
        const userId = user['$key'];
        const updates: any = {};
        for (const key of Object.keys(data)) {
            updates[`/users/${userId}/${key}`] = data[key];
        }
        return DB.update(updates);
    }

}