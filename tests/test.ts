import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { auth } from '../src/public_api';

const g: any = global;
g.ScriptApp = {
    getService: () => ({ getUrl: () => 'https://my-app-script-url.com/xxx' }),
};

let gmailAppRecorder: any;
g.GmailApp = {
    sendEmail: (email: string, subject: string, plainBody: string, options: any) => {
        gmailAppRecorder = { email, subject, plainBody, options };
    },
};

g.Utilities = {
    getUuid: () => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

const options = {
    encryptionSecret: 'abcxyz',
    sheetsSQL: {
        item: () => null,
        update: () => null,
    } as any,
};
const Auth = auth(options);

describe('Auth module', () => {

    it('Auth service should be created', () => {
        expect(!!Auth).to.equal(true);
    });

    it('.User member', () => {
        expect(!!Auth.User).to.equal(true);
    });

    it('.Database member', () => {
        expect(!!Auth.Database).to.equal(true);
    });

    it('.Oob member', () => {
        expect(!!Auth.Oob).to.equal(true);
    });

    it('.Token member', () => {
        expect(!!Auth.Token).to.equal(true);
    });

});

describe('Database service', () => {

    const { Database } = Auth;

    let itemStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        itemStub = sinon.stub(Database.options.sheetsSQL, 'item');
        // @ts-ignore
        updateStub = sinon.stub(Database.options.sheetsSQL, 'update');
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

    const { Token } = Auth;

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

    const { Oob } = Auth;

    let getUserStub: sinon.SinonStub;
    let setOobStub: sinon.SinonStub;
    let sendPasswordResetStub: sinon.SinonStub;

    beforeEach(() => {
        gmailAppRecorder = null;
        // @ts-ignore
        getUserStub = sinon.stub(Oob.Database, 'getUser');
        setOobStub = sinon.stub(Oob, 'setOob');
        sendPasswordResetStub = sinon.stub(Oob, 'sendPasswordReset');
    });

    afterEach(() => {
        getUserStub.restore();
        setOobStub.restore();
        sendPasswordResetStub.restore();
    });

    it('.options default values', () => {
        // @ts-ignore
        const options = Oob.options;
        expect(options.siteName).to.equal('Sheetbase App');
        expect(options.passwordResetSubject).to.equal('Reset password for Sheetbase App');
    });

    it('#buildAuthUrl should work (no authUrl)', () => {
        // @ts-ignore
        const result = Oob.buildAuthUrl('passwordReset', 'xxx');
        expect(result).to.equal(
            'https://my-app-script-url.com/xxx?e=auth/action&mode=passwordReset&oobCode=xxx',
        );
    });

    it('#buildAuthUrl should work (has authUrl = string)', () => {
        const { Oob } = auth({
            ... options,
            authUrl: 'https://xxx.xxx/auth',
        });
        // @ts-ignore
        const result = Oob.buildAuthUrl('passwordReset', 'xxx');
        expect(result).to.equal(
            'https://xxx.xxx/auth?mode=passwordReset&oobCode=xxx',
        );
    });

    it('#buildAuthUrl should work (has authUrl = Function)', () => {
        const { Oob } = auth({
            ... options,
            // tslint:disable-next-line:max-line-length
            authUrl: (mode: string, oobCode: string) => `https://xxx.xxx/auth?m=${mode}&c=${oobCode}&k=abc`,
        });
        // @ts-ignore
        const result = Oob.buildAuthUrl('reset', 'xxx');
        expect(result).to.equal(
            'https://xxx.xxx/auth?m=reset&c=xxx&k=abc',
        );
    });

    it('#buildPasswordResetBody should work (no passwordResetBody)', () => {
        // @ts-ignore
        const result1 = Oob.buildPasswordResetBody('https://xxx.xxx', {});
        // @ts-ignore
        const result2 = Oob.buildPasswordResetBody('https://xxx.xxx', { displayName: 'John' });
        expect(result1).to.contain('Hello User,');
        expect(result1).to.contain('https://xxx.xxx');
        expect(result2).to.contain('Hello John,');
    });

    it('#buildPasswordResetBody should work (has passwordResetBody)', () => {
        const { Oob } = auth({
            ... options,
            passwordResetBody: (url: string, user: any) => `xxx`,
        });
        // @ts-ignore
        const result = Oob.buildPasswordResetBody('https://xxx.xxx', {});
        expect(result).to.equal('xxx');
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

    it('#setOob should work (no user)', () => {
        getUserStub.onFirstCall().returns(null);
        setOobStub.restore();

        const result = Oob.setOob('xxx@gmail.com');
        expect(result).to.equal(null);
    });

    it('#setOob should work (has user)', () => {
        getUserStub.onFirstCall().returns({ uid: 'xxx' });
        setOobStub.restore();

        const result = Oob.setOob('xxx@gmail.com');
        expect(result.uid).to.equal('xxx');
        expect(typeof result.oobCode === 'string').to.equal(true);
        expect(result.oobCode.length).to.equal(36);
        expect(typeof result.oobTimestamp === 'number').to.equal(true);
    });

    it('#sendPasswordReset should work', () => {
        sendPasswordResetStub.restore();

        Oob.sendPasswordReset({ email: 'xxx@gmail.com', oobCode: 'xxx' });
        expect(gmailAppRecorder.email).to.equal('xxx@gmail.com');
        expect(gmailAppRecorder.subject).to.equal('Reset password for Sheetbase App');
        expect(typeof gmailAppRecorder.plainBody === 'string').to.equal(true);
        expect(gmailAppRecorder.options.name).to.equal('Sheetbase App');
        expect(typeof gmailAppRecorder.options.htmlBody === 'string').to.equal(true);
    });

    it('#sendPasswordResetByEmail should work (no user)', () => {
        let result: any;
        setOobStub.onFirstCall().returns(null);
        sendPasswordResetStub.callsFake((user) => {
            result = user;
        });

        Oob.sendPasswordResetByEmail('xxx@gmail.com');
        expect(result).to.equal(undefined);
    });

    it('#sendPasswordResetByEmail should work (has user)', () => {
        let result: any;
        setOobStub.onFirstCall().returns({ uid: 'xxx' });
        sendPasswordResetStub.callsFake((user) => {
            result = user;
        });

        Oob.sendPasswordResetByEmail('xxx@gmail.com');
        expect(result).to.eql({ uid: 'xxx' });
    });

});

describe('User service', () => {

    const { User } = Auth;

    it('.options default values', () => {
        // @ts-ignore
        const options = User.options;
        expect(options.passwordSecret).to.equal('');
    });

    it('#hashPassword should work', () => {
        // @ts-ignore
        const result = User.hashPassword('xxx', 'xxx');
        expect(typeof result === 'string').to.equal(true);
        expect(result.length).to.equal(64);
    });

    it('#availableProfile should not return special fields', () => {
        // @ts-ignore
        const result = User.availableProfile({ password: 'xxx', oobCode: 'xxx', oobTimestamp: 123456789 });
        expect(result.password).that.equal(undefined);
        expect(result.oobCode).that.equal(undefined);
        expect(result.oobTimestamp).that.equal(undefined);
    });

});
