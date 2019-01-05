import { User } from './types';
import { UserService } from './user';

export class AccountService {
    private user: User;
    private User: UserService;

    constructor (
        user: User,
        User: UserService,
    ) {
        this.user = user;
        this.User = User;
    }

}