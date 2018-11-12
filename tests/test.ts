// tslint:disable:no-unused-expression
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { userPassword } from '../src/public_api';
import { database, apiKey, encryptionKey } from '../src/example';

const UserPassword = userPassword({ database, apiKey, encryptionKey });

describe('User Password module test', () => {

    it('UserPassword service should be created', () => {
        expect(UserPassword).to.be.not.null;
    });

});