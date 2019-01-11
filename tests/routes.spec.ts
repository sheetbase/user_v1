import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import {
    RouterService,
    OptionService,
    RouteRequest,
    RouteResponse,
    RouteNext,
    RouteHandler,
} from '@sheetbase/core-server';

import { Auth } from './test';

/**
 * faked router objects
 */
let req: RouteRequest;
let res: RouteResponse;
let next: RouteNext;

function createRouterObjects() {
    req = {
        query: {},
        body: {},
    } as any;

    res = {
        html: html => html,
        sucess: data => data,
        error: error => error,
    } as any;

    next = data => data as any;
}

const { registerRoutes } = Auth;
let router: RouterService;

function createRoutes() {
    router = new RouterService(new OptionService());
    registerRoutes({ router });
}

describe('PUT /auth (create new account)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('PUT', '/auth').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth (log user in)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('DELETE /auth (log user out)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('DELETE', '/auth').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('DELETE /auth/cancel (delete user)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('DELETE', '/auth/cancel').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('GET /auth/user (get user info)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('GET', '/auth/user').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth/user (update profile)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth/user').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth/user/username (update username)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth/user/username').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth/user/password (update password)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth/user/password').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('GET /auth/token (issue new idToken)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('GET', '/auth/token').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('PUT /auth/oob (send oob emails)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('PUT', '/auth/oob').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('GET /auth/oob (check oob code)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('GET', '/auth/oob').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth/oob (handle oob action)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth/oob').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('GET /auth/action (default oob facing page)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('GET', '/auth/action').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});

describe('POST /auth/action (default oob handler)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRoutes();
        handler = router.route('POST', '/auth/action').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

});
