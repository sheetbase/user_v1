import { SheetsService } from '@sheetbase/sheets-server';

import { UserFinder, UserData } from './types';

export class SheetsDriver {

    private sheets: SheetsService;

    constructor(sheets: SheetsService) {
        this.sheets = sheets;
    }

    getUser(finder: UserFinder): UserData {
        return this.sheets.item('users', finder);
    }

    addUser(userData: UserData) {
        this.sheets.update('users', userData);
    }

    updateUser(finder: UserFinder, userData: UserData) {
        this.sheets.update('users', userData, finder);
    }

    deleteUser(finder: UserFinder) {
        this.sheets.delete('users', finder);
    }

}