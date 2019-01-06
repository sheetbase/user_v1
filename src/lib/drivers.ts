import { SQLService } from '@sheetbase/sheets-server';

import { UserFinder, UserData } from './types';

export class SheetsDriver {

    private sheetsSQL: SQLService;

    constructor(sheetsSQL: SQLService) {
        this.sheetsSQL = sheetsSQL;
    }

    getUser(finder: UserFinder): UserData {
        return this.sheetsSQL.item('users', finder);
    }

    addUser(userData: UserData) {
        this.sheetsSQL.update('users', userData);
    }

    updateUser(finder: UserFinder, userData: UserData) {
        this.sheetsSQL.update('users', userData, finder);
    }

}