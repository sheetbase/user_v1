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
        data: {},
    } as any;

    res = {
        html: html => html,
        sucess: data => data,
        error: error => error,
    } as any;

    next = data => data as any;
}

const { registerRoutes, Account } = Auth;
let router: RouterService;

function createRoutes() {
    router = new RouterService(new OptionService());
    registerRoutes({ router });
}

describe('PUT/POST /auth (create new account & log user in)', () => {

    let handler: RouteHandler;

    let getUserByCustomTokenStub: sinon.SinonStub;
    let getUserByEmailAndPasswordStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('PUT', '/auth').pop();

        getUserByCustomTokenStub = sinon.stub(Auth.Account, 'getUserByCustomToken');
        getUserByEmailAndPasswordStub = sinon.stub(Auth.Account, 'getUserByEmailAndPassword');
    });

    afterEach(() => {
        getUserByCustomTokenStub.restore();
        getUserByEmailAndPasswordStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for no user (getUserByCustomToken)', () => {
        getUserByCustomTokenStub.onFirstCall().returns(null);

        const result = handler({
            body: { customToken: 'xxx' },
        }, res);
        expect(result).to.equal('auth/no-user');
    });

    it('should error for no user (getUserByEmailAndPassword)', () => {
        getUserByEmailAndPasswordStub.onFirstCall().returns(null);

        const result = handler({
            body: { email: 'xxx@xxx.xxx', password: '1234567' },
        }, res);
        expect(result).to.equal('auth/no-user');
    });

});

describe('DELETE /auth (log user out)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRouterObjects();
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
        createRouterObjects();
        createRoutes();
        handler = router.route('DELETE', '/auth/cancel').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for mismatch refresh token (revoke access)', () => {
        const result = handler({
            body: { refreshToken: 'xxx' },
            data: { user: Account.user({ refreshToken: 'xxx2' }) },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('GET /auth/user (get user info)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRouterObjects();
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
        createRouterObjects();
        createRoutes();
        handler = router.route('POST', '/auth/user').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('POST /auth/user/username (update username)', () => {

    let handler: RouteHandler;

    let isUserStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('POST', '/auth/user/username').pop();

        isUserStub = sinon.stub(Auth.Account, 'isUser');
    });

    afterEach(() => {
        isUserStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for existing username', () => {
        isUserStub.onFirstCall().returns(true); // user exists

        const result = handler({
            ... req,
            body: { username: 'xxx' }, // has username
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('POST /auth/user/password (update password)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('POST', '/auth/user/password').pop();
    });

    afterEach(() => {});

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result1 = handler(req, res);
        const result2 = handler({
            ...req,
            body: { password: '1234567' },
        }, res);
        const result3 = handler({
            ...req,
            body: { currentPassword: '2345678' },
        }, res);
        expect(result1).to.equal('auth/invalid-input', 'no values');
        expect(result2).to.equal('auth/invalid-input', 'no currentPassword');
        expect(result3).to.equal('auth/invalid-input', 'no password');
    });

    it('should error for not matched current password', () => {
        const result = handler({
            ... req,
            body: { password: '1234567', currentPassword: '2345678' },
            data: { user: { comparePassword: () => false } },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('GET /auth/token (issue new idToken)', () => {

    let handler: RouteHandler;

    let getUserByRefreshTokenStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('GET', '/auth/token').pop();

        getUserByRefreshTokenStub = sinon.stub(Auth.Account, 'getUserByRefreshToken');
    });

    afterEach(() => {
        getUserByRefreshTokenStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for no user', () => {
        getUserByRefreshTokenStub.onFirstCall().returns(null);

        const result = handler({
            query: { refreshToken: 'xxx' },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('PUT /auth/oob (send oob emails)', () => {

    let handler: RouteHandler;

    beforeEach(() => {
        createRouterObjects();
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

    let getUserByOobCodeStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('GET', '/auth/oob').pop();

        getUserByOobCodeStub = sinon.stub(Auth.Account, 'getUserByOobCode');
    });

    afterEach(() => {
        getUserByOobCodeStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result = handler(req, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for no user', () => {
        getUserByOobCodeStub.onFirstCall().returns(null);

        const result = handler({
            ...req,
            query: { oobCode: 'xxx' },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for mismatched mode', () => {
        getUserByOobCodeStub.onFirstCall().returns({
            getData: () => ({ oobMode: 'verifyEmail' }),
        });

        const result = handler({
            ...req,
            query: { oobCode: 'xxx', mode: 'resetPassword' },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('POST /auth/oob (handle oob action)', () => {

    let handler: RouteHandler;

    let getUserByOobCodeStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('POST', '/auth/oob').pop();

        getUserByOobCodeStub = sinon.stub(Auth.Account, 'getUserByOobCode');
    });

    afterEach(() => {
        getUserByOobCodeStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result1 = handler(req, res);
        const result2 = handler({
            ...req,
            body: { mode: 'resetPassword' },
        }, res);
        const result3 = handler({
            ...req,
            body: { oobCode: 'xxx' },
        }, res);
        expect(result1).to.equal('auth/invalid-input', 'no values');
        expect(result2).to.equal('auth/invalid-input', 'no oobCode');
        expect(result3).to.equal('auth/invalid-input', 'no mode');
    });

    it('should error for no user', () => {
        getUserByOobCodeStub.onFirstCall().returns(null);

        const result = handler({
            ...req,
            body: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

    it('should error for mismatched mode', () => {
        getUserByOobCodeStub.onFirstCall().returns({
            getData: () => ({ oobMode: 'verifyEmail' }),
        });

        const result = handler({
            ...req,
            query: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.equal('auth/invalid-input');
    });

});

describe('GET /auth/action (default oob facing page)', () => {

    let handler: RouteHandler;

    let getUserByOobCodeStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('GET', '/auth/action').pop();

        getUserByOobCodeStub = sinon.stub(Auth.Account, 'getUserByOobCode');
    });

    afterEach(() => {
        getUserByOobCodeStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result1 = handler(req, res);
        const result2 = handler({
            ...req,
            body: { mode: 'resetPassword' },
        }, res);
        const result3 = handler({
            ...req,
            body: { oobCode: 'xxx' },
        }, res);
        expect(result1).to.contain('Action failed', 'no values');
        expect(result2).to.contain('Action failed', 'no oobCode');
        expect(result3).to.contain('Action failed', 'no mode');
    });

    it('should error for no user', () => {
        getUserByOobCodeStub.onFirstCall().returns(null);

        const result = handler({
            ...req,
            body: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.contain('Action failed');
    });

    it('should error for mismatched mode', () => {
        getUserByOobCodeStub.onFirstCall().returns({
            getData: () => ({ oobMode: 'verifyEmail' }),
        });

        const result = handler({
            ...req,
            query: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.contain('Action failed');
    });

});

describe('POST /auth/action (default oob handler)', () => {

    let handler: RouteHandler;

    let getUserByOobCodeStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        createRoutes();
        handler = router.route('POST', '/auth/action').pop();

        getUserByOobCodeStub = sinon.stub(Auth.Account, 'getUserByOobCode');
    });

    afterEach(() => {
        getUserByOobCodeStub.restore();
    });

    it('should be created', () => {
        expect(!!handler && handler instanceof Function).to.equal(true);
    });

    it('should error for no values', () => {
        const result1 = handler(req, res);
        const result2 = handler({
            ...req,
            body: { mode: 'resetPassword' },
        }, res);
        const result3 = handler({
            ...req,
            body: { oobCode: 'xxx' },
        }, res);
        expect(result1).to.contain('Action failed', 'no values');
        expect(result2).to.contain('Action failed', 'no oobCode');
        expect(result3).to.contain('Action failed', 'no mode');
    });

    it('should error for no user', () => {
        getUserByOobCodeStub.onFirstCall().returns(null);

        const result = handler({
            ...req,
            body: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.contain('Action failed');
    });

    it('should error for mismatched mode', () => {
        getUserByOobCodeStub.onFirstCall().returns({
            getData: () => ({ oobMode: 'verifyEmail' }),
        });

        const result = handler({
            ...req,
            query: { mode: 'resetPassword', oobCode: 'xxx' },
        }, res);
        expect(result).to.contain('Action failed');
    });

});
