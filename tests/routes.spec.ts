import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { RouteRequest, RouteResponse, RouteNext } from '@sheetbase/core-server';

import { Auth } from './test';
import { User } from '../src/lib/user';

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

describe('Middlewares', () => {

    const { IdTokenMiddleware, UserMiddleware, Account, Token } = Auth;

    let getUserStub: sinon.SinonStub;

    beforeEach(() => {
        createRouterObjects();
        getUserStub = sinon.stub(Account, 'getUser');
    });

    afterEach(() => {
        getUserStub.restore();
    });

    it('should create middlewares', () => {
        expect(IdTokenMiddleware instanceof Function).to.equal(true);
        expect(UserMiddleware instanceof Function).to.equal(true);
    });

    it('IdTokenMiddleware (error, no idToken or invlaid)', () => {
        const result1 = IdTokenMiddleware(req, res, next);
        const result2 = IdTokenMiddleware({
            // tslint:disable-next-line:max-line-length
            query: { idToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4eHgiLCJlbWFpbCI6Inh4eEBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJhdWQiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJpYXQiOjE1NDY2MTE0NTUsImV4cCI6MTU0NjYxNTA1NX0.csU-Jc98S8RrF7WywBdlT60dbkb9WoGbQTcjdtlbGx8' },
            body: {},
        }, res, next);
        expect(result1).to.equal('auth/invalid-token', 'no idToken');
        expect(result2).to.equal('auth/invalid-token', 'invalid');
    });

    it('IdTokenMiddleware', () => {
        const validIdToken = Token.signIdToken({ uid: 'xxx' });

        const result1 = IdTokenMiddleware({
            query: { idToken: validIdToken },
            body: {},
        }, res, next); // in query
        const result2 = IdTokenMiddleware({
            query: {},
            body: { idToken: validIdToken },
        }, res, next); // in body
        expect(result1.auth.uid === 'xxx' && result1.auth.tty === 'ID').to.equal(true, 'idToken in query');
        expect(result2.auth.uid === 'xxx' && result2.auth.tty === 'ID').to.equal(true, 'idToken in body');
    });

    it('UserMiddleware (error, no idToken or invlaid)', () => {
        const result1 = UserMiddleware(req, res, next);
        const result2 = UserMiddleware({
            // tslint:disable-next-line:max-line-length
            query: { idToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4eHgiLCJlbWFpbCI6Inh4eEBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJhdWQiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJpYXQiOjE1NDY2MTE0NTUsImV4cCI6MTU0NjYxNTA1NX0.csU-Jc98S8RrF7WywBdlT60dbkb9WoGbQTcjdtlbGx8' },
            body: {},
        }, res, next);
        expect(result1).to.equal('auth/invalid-token', 'no idToken');
        expect(result2).to.equal('auth/invalid-token', 'invalid');
    });

    it('UserMiddleware', () => {
        const validIdToken = Token.signIdToken({ uid: 'xxx' });
        const user = Account.user({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(user);
        getUserStub.onSecondCall().returns(user);

        const result1 = UserMiddleware({
            query: { idToken: validIdToken },
            body: {},
        }, res, next); // in query
        const result2 = UserMiddleware({
            query: {},
            body: { idToken: validIdToken },
        }, res, next); // in body
        expect(result1.user instanceof User).to.equal(true, 'idToken in query');
        expect(result2.user instanceof User).to.equal(true, 'idToken in body');
    });

});