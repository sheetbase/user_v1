import { SQLService } from '@sheetbase/sheets-server';

import { User } from './types';

export class DatabaseService {
    private sheetsSQL: SQLService;

    constructor(sheetsSQL: SQLService) {
        this.sheetsSQL = sheetsSQL;
    }

    getUser(idOrCondition: number | {[field: string]: string}): User {
        return this.sheetsSQL.item('users', idOrCondition);
    }

    addUser(user: User) {
        this.sheetsSQL.update('users', user);
    }

    updateUser(idOrCondition: number | {[field: string]: string}, data: User) {
        this.sheetsSQL.update('users', data, idOrCondition);
    }
}