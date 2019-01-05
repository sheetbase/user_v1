import { Options, User } from './types';

export class DatabaseService {
    private options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    getUser(idOrCondition: number | {[field: string]: string}): User {
        return this.options.sheetsSQL.item('users', idOrCondition);
    }

    addUser(user: User) {
        this.options.sheetsSQL.update('users', user);
    }

    updateUser(idOrCondition: number | {[field: string]: string}, data: User) {
        this.options.sheetsSQL.update('users', data, idOrCondition);
    }
}