import {
    RoutingErrors,
    AddonRoutesOptions,
    RouteHandler,
    RouteResponse,
} from '@sheetbase/core-server';

import { UserPasswordService } from './user-password';

export const ROUTING_ERRORS: RoutingErrors = {
    'auth/unknown': {
        status: 400, message: 'Unknown errors.',
    },
    'auth/missing': {
        status: 400, message: 'Missing data, please prefer the docs.',
    },
    'auth/invalid-email': {
        status: 400, message: 'Invalid email format.',
    },
    'auth/invalid-password': {
        status: 400, message: 'Password must greater than 7 characters.',
    },
    'auth/user-exists': {
        status: 400, message: 'There is the user with the email.',
    },
    'auth/user-not-exists': {
        status: 400, message: 'User not exists.',
    },
    'auth/wrong-password': {
        status: 400, message: 'Wrong password.',
    },
    'auth/no-oob-code': {
        status: 400, message: 'No oob code.',
    },
    'auth/invalid-oob-code': {
        status: 400, message: 'Invalid oob code.',
    },
};

function routingError(res: RouteResponse, code: string) {
    const error = ROUTING_ERRORS[code] || ROUTING_ERRORS['auth/unknown'];
    const { status, message } = error;
    return res.error(code, message, status);
}

export function moduleRoutes(
    UserPassword: UserPasswordService,
    options: AddonRoutesOptions,
): void {
    const { router: Router, disabledRoutes } = UserPassword.getOptions();

    if (!Router) {
        throw new Error('No router, please check out for Sheetbase Router.');
    }
    const endpoint: string = options.endpoint || 'account';
    const middlewares: RouteHandler[] = options.middlewares || ([
        (req, res, next) => next(),
    ]);

    if (disabledRoutes.indexOf('get:' + endpoint) < 0) {
        Router.get('/' + endpoint, ... middlewares, (req, res) => {
            let result: any;
            try {
                result = 'xxx';
            } catch (code) {
                return routingError(res, code);
            }
            return res.success(result);
        });
    }

    if (disabledRoutes.indexOf('post:' + endpoint) < 0) {
        Router.post('/' + endpoint, ... middlewares, (req, res) => {
            let result: any;
            try {
                result = 'xxx';
            } catch (code) {
                return routingError(res, code);
            }
            return res.success(result);
        });
    }

}