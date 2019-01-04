import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { user } from '../src/public_api';

const g: any = global;
g.ScriptApp = {
    getService: () => ({ getUrl: () => 'https://my-app-script-url.com/xxx' }),
};

const User = user({
    encryptionSecret: 'abcxyz',
    sheetsSQL: {
        item: () => null,
        update: () => null,
    } as any,
});

describe('User module', () => {

    it('User service should be created', () => {
        expect(!!User).to.equal(true);
    });

    it('.Account member', () => {
        expect(!!User.Account).to.equal(true);
    });

    it('.Database member', () => {
        expect(!!User.Database).to.equal(true);
    });

    it('.Oob member', () => {
        expect(!!User.Oob).to.equal(true);
    });

    it('.Token member', () => {
        expect(!!User.Token).to.equal(true);
    });

});

describe('.options', () => {

    it('default values', () => {
        // @ts-ignore
        const options = User.options;
        expect(options.siteName).to.eql('Sheetbase App');
    });

    it('custom values', () => {
        // @ts-ignore
        const options = User.options;
        expect(options.encryptionSecret).to.eql('abcxyz');
    });

});

describe('Database service', () => {
    const Database = User.Database;

    let itemStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        itemStub = sinon.stub(Database.sheetsSQL, 'item');
        // @ts-ignore
        updateStub = sinon.stub(Database.sheetsSQL, 'update');
    });

    afterEach(() => {
        itemStub.restore();
        updateStub.restore();
    });

    it('#getUser should work', () => {
        itemStub.callsFake((table, idOrCond) => ({ table, idOrCond }));

        const result1 = Database.getUser(1);
        const result2 = Database.getUser({ email: 'xxx@gmail.com' });
        expect(result1).to.eql({
            table: 'users',
            idOrCond: 1,
        });
        expect(result2).to.eql({
            table: 'users',
            idOrCond: { email: 'xxx@gmail.com' },
        });
    });

    it('#addUser should work', () => {
        let result: any;
        updateStub.callsFake((table, user) => { result = { table, user }; });

        Database.addUser({ uid: 'abc' });
        expect(result).to.eql({
            table: 'users',
            user: { uid: 'abc' },
        });
    });

    it('#updateUser should work', () => {
        let result: any;
        updateStub.callsFake((table, data, idOrCond) => { result = { table, data, idOrCond }; });

        Database.updateUser(1, { displayName: 'xxx' });
        expect(result).to.eql({
            table: 'users',
            data: { displayName: 'xxx' },
            idOrCond: 1,
        });
    });

});

describe('Token service', () => {

    const Token = User.Token;

    let signStub: sinon.SinonStub;

    beforeEach(() => {
        signStub = sinon.stub(Token, 'sign');
    });

    afterEach(() => {
        signStub.restore();
    });

    it('#createRefreshToken should work', () => {
        const result = Token.createRefreshToken();
        expect(typeof result === 'string').to.equal(true);
        expect(result.length).to.equal(64);
    });

    it('#sign should work', () => {
        signStub.restore();

        const result = Token.sign({ uid: 'xxx', email: 'xxx@gmail.com' });
        expect(result).to.contain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('#createIdToken should work', () => {
        signStub.callsFake((payload) => payload);

        const user = {
            '#': 1,
            uid: 'xxx',
            email: 'xxx@gmail.com',
            claims: {
                a: 1,
                b: 2,
            },
        };
        const result = Token.createIdToken(user);
        expect(result).to.eql({
            a: 1,
            b: 2,
            id: 1,
            uid: 'xxx',
            sub: 'xxx@gmail.com',
        });
    });

    it('#verify should work', () => {
        signStub.restore();

        // tslint:disable-next-line:max-line-length
        const result1 = Token.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4eHgiLCJlbWFpbCI6Inh4eEBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJhdWQiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJpYXQiOjE1NDY2MTE0NTUsImV4cCI6MTU0NjYxNTA1NX0.csU-Jc98S8RrF7WywBdlT60dbkb9WoGbQTcjdtlbGx8');
        const result2 = Token.verify(
            Token.sign({ a: 1, b: 2 }) + 'x',
        );
        const result3 = Token.verify(
            Token.sign({ a: 1, b: 2 }),
        );
        expect(result1).to.equal(false, 'expired');
        expect(result2).to.equal(false, 'wrong signature');
        expect(result3).to.equal(true);
    });

    it('#decode should work', () => {
        signStub.restore();

        const payload = { a: 1, b: 2 };
        const result = Token.decode(Token.sign(payload));
        expect(result.aud).to.equal('https://sheetbaseapp.com');
        expect(result.iss).to.equal('https://sheetbaseapp.com');
        expect(result.a).to.equal(1);
        expect(result.b).to.equal(2);
    });

});

describe('Oob service', () => {

    const Oob = User.Oob;

    let getUserStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        getUserStub = sinon.stub(Oob.databaseService, 'getUser');
    });

    afterEach(() => {
        getUserStub.restore();
    });

    it('#parse should throw error (no user)', () => {
        getUserStub.onFirstCall().returns(null);

        expect(Oob.parse('xxx')).to.equal(null);
    });

    it('#parse should throw error (no oobCode or oobTimestamp)', () => {
        getUserStub.onFirstCall().returns({ oobCode: null });
        getUserStub.onSecondCall().returns({ oobTimestamp: null });

        expect(Oob.parse('xxx')).to.equal(null);
        expect(Oob.parse('xxx')).to.equal(null);
    });

    it('#parse should throw error (not matched oobCode)', () => {
        getUserStub.onFirstCall().returns({ oobCode: 'xxx2', oobTimestamp: 1234567890 });

        expect(Oob.parse('xxx')).to.equal(null);
    });

    it('#parse should throw error (expired)', () => {
        getUserStub.onFirstCall().returns({
            oobCode: 'xxx',
            oobTimestamp: 0,
        });

        expect(Oob.parse('xxx')).to.equal(null);
    });

    it('#parse should work', () => {
        getUserStub.onFirstCall().returns({
            oobCode: 'xxx',
            oobTimestamp: (new Date()).getTime(),
        });

        const result = Oob.parse('xxx');
        expect(result.oobCode).to.equal('xxx');
        expect(typeof result.oobTimestamp === 'number').to.equal(true);
    });

    it('#verify should work', () => {
        getUserStub.onFirstCall().returns({
            oobCode: 'xxx',
            oobTimestamp: (new Date()).getTime(),
        });

        const result = Oob.verify('xxx');
        expect(result).to.equal(true);
    });

});

describe('Account service', () => {

});
