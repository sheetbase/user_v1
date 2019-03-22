import { SheetsService, Filter } from '@sheetbase/sheets-server';
import { User as UserData } from '@sheetbase/models';

export class SheetsDriver {

    private Sheets: SheetsService;

    constructor(Sheets: SheetsService) {
        this.Sheets = Sheets;
    }

    getUser(finder: string | Filter): UserData {
        return this.Sheets.item('users', finder);
    }

    addUser(uid: string, userData: UserData) {
        this.Sheets.add('users', uid, userData);
    }

    updateUser(uid: string, userData: UserData) {
        this.Sheets.update('users', uid, userData);
    }

    deleteUser(uid: string) {
        this.Sheets.remove('users', uid);
    }

}