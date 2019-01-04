import { Options } from './types';
import { UserService } from './user';

export function user(options: Options): UserService {
    return new UserService(options);
}