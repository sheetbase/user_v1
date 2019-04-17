import { expect } from 'chai';
import { describe, it } from 'mocha';

import { auth } from '../src/public_api';
import { sha256, isValidEmail } from '../src/lib/utils';

export const options = {
    encryptionSecret: 'abcxyz',
    databaseDriver: {
        getUser: () => null,
        addUser: () => null,
        updateUser: () => null,
        deleteUser: () => null,
    } as any,
};

export const Auth = auth(options);

describe('Module', () => {

    it('Auth should be created', () => {
        expect(!!Auth).to.equal(true);
    });

    it('.Oob', () => {
        expect(!!Auth.Oob).to.equal(true);
    });

    it('.Token', () => {
        expect(!!Auth.Token).to.equal(true);
    });

    it('.Account', () => {
        expect(!!Auth.Account).to.equal(true);
    });

    it('.IdTokenMiddleware', () => {
        expect(!!Auth.IdTokenMiddleware).to.equal(true);
    });

    it('.UserMiddleware', () => {
        expect(!!Auth.UserMiddleware).to.equal(true);
    });

    it('.registerRoutes', () => {
        expect(!!Auth.registerRoutes).to.equal(true);
    });

});

describe('Utils', () => {

    it('#sha256', () => {
        const result = sha256('xxx');
        expect(result).to.equal('cd2eb0837c9b4c962c22d2ff8b5441b7b45805887f051d39bf133b583baf6860');
    });

    it('#isValidEmail', () => {
        const result1 = isValidEmail('xxx');
        const result2 = isValidEmail('xxx@xxx');
        const result3 = isValidEmail('xxx@xxx.xxx');
        expect(result1).to.equal(false);
        expect(result2).to.equal(false);
        expect(result3).to.equal(true);
    });

});
