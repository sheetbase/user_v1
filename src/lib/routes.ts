import { RouteHandler, AddonRoutesOptions, RouteRequest, RouteResponse } from '@sheetbase/core-server';

import { AccountService } from './account';
import { User } from './user';
import { validEmail } from './utils';

const ROUTING_ERRORS = {
    'auth/invalid-token': 'Invalid token.',
};

export function userMiddleware(Account: AccountService): RouteHandler {
    return (req, res, next) => {
        const idToken = req.body['token'] || req.query['token'];
        const user = Account.getUserByIdToken(idToken);
        if (!user) {
            return res.error('auth/invalid-token');
        }
        return next(user);
    };
}

export function registerRoutes(Account: AccountService) {
    return (options?: AddonRoutesOptions) => {

        const {
            router,
            endpoint = 'auth',
            disabledRoutes = [],
            middlewares = [(req, res, next) => next()],
        } = options;

        // register errors & disabled routes
        router.setDisabled(disabledRoutes);
        router.setErrors(ROUTING_ERRORS);

        // user middleware
        const userMdlware = userMiddleware(Account);

        /**
         * account
         */
        // create new
        router.put('/' + endpoint, ... middlewares,
            signupOrLogin(Account),
        );

        // login
        router.post('/' + endpoint, ... middlewares,
            signupOrLogin(Account),
        );

        // get profile
        router.get('/' + endpoint, ... middlewares, userMdlware,
            getProfile,
        );

        // update profile
        router.patch('/' + endpoint, ... middlewares, userMdlware,
            updateProfile,
        );

        // cancel account
        router.delete('/' + endpoint, ... middlewares, userMdlware,
            deleteAccount,
        );

        /**
         * token
         */
        router.get('/' + endpoint + '/token', ... middlewares,
            getToken(Account),
        );

        /**
         * auth actions
         */
        router.get('/' + endpoint + '/action', ... middlewares, authAction);
        router.post('/' + endpoint + '/action', ... middlewares, handleAuthAction);

    };
}

function signupOrLogin(Account: AccountService): RouteHandler {
    return (req, res) => {
        const { email, password = '', token } = req.body;
        let user: User;

        // get user, new or existing if correct password
        if (!!token) {
            user = Account.getUserByCustomToken(token);
        } else {
            if (!validEmail(email)) {
                return res.error('auth/invalid-email');
            }
            if (password.length < 7) {
                return res.error('auth/invalid-password');
            }
            user = Account.getUserByEmailAndPassword(email, password);
        }

        // return the profile or error
        if (!user) {
            return res.error('auth/no-user');
        }
        return res.success(
            user
            .setlastLogin()
            .save()
            .getProfile(),
        );
    };
}

function getProfile(req: RouteRequest, res: RouteResponse) {
    const { user } = req.data as { user: User };
    return res.success(user.getProfile());
}

function updateProfile(req: RouteRequest, res: RouteResponse) {
    const { user } = req.data as { user: User };
    const { profile } = req.body;
    return res.success(
        user
        .updateProfile(profile)
        .save()
        .getProfile(),
    );
}

function deleteAccount(req: RouteRequest, res: RouteResponse) {
    const { user } = req.data as { user: User };
    // return deleted user
    const { uid } = user.delete().getProfile();
    return res.success({ uid });
}

function getToken(Account: AccountService): RouteHandler {
    return (req, res) => {
        const { token } = req.query;
        if (!!token) {
            return res.error('auth/invalid-token');
        }
        const user = Account.getUserByRefreshToken(token);
        return res.success({ idToken: user.getIdToken() });
    };
}

function authAction(req: RouteRequest, res: RouteResponse) {

}

function handleAuthAction(req: RouteRequest, res: RouteResponse) {

}