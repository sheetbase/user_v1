import { Options } from './types';
import { UserPasswordService } from './user-password';

export function userPassword(options: Options): UserPasswordService {
    return new UserPasswordService(options);
}