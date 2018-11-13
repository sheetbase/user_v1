import { Options } from './types';
import { DatabaseDriver } from './user-password';

export class OptionService {
    private options: Options;

    constructor (options: Options) {
        this.options = {... this.options, ... options};
        this.options.databaseDriver = DatabaseDriver.SHEETS;
    }

    get(key?: string): Options | any {
        if (key) {
            return this.options[key];
        }
        return this.options;
    }

    set(dataOrKey: Options | string, value?: any): Options {
        if (dataOrKey instanceof Object) {
            const data = dataOrKey;
            for (const key of Object.keys(data)) {
                this.options[key] = data[key];
            }
        } else {
            const key: string = dataOrKey;
            this.options[key] = value;
        }
        return this.options;
    }
}