import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { auth, sheetsDriver } from '../src/public_api';
import { sha256, securePassword } from '../src/lib/utils';

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
    databaseDriver: {
        getUser: () => null,
        addUser: () => null,
        updateUser: () => null,
    } as any,
};
const Auth = auth(options);

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

});

describe('SheetsDriver', () => {

    const SheetsDriver = sheetsDriver({
        item: () => null,
        update: () => null,
    } as any);

    let itemStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        itemStub = sinon.stub(SheetsDriver.sheetsSQL, 'item');
        // @ts-ignore
        updateStub = sinon.stub(SheetsDriver.sheetsSQL, 'update');
    });

    afterEach(() => {
        itemStub.restore();
        updateStub.restore();
    });

    it('#getUser', () => {
        itemStub.callsFake((table, idOrCond) => ({ table, idOrCond }));

        const result1 = SheetsDriver.getUser(1);
        const result2 = SheetsDriver.getUser({ email: 'xxx@gmail.com' });
        expect(result1).to.eql({
            table: 'users',
            idOrCond: 1,
        });
        expect(result2).to.eql({
            table: 'users',
            idOrCond: { email: 'xxx@gmail.com' },
        });
    });

    it('#addUser', () => {
        let result: any;
        updateStub.callsFake((table, user) => { result = { table, user }; });

        SheetsDriver.addUser({ uid: 'abc' });
        expect(result).to.eql({
            table: 'users',
            user: { uid: 'abc' },
        });
    });

    it('#updateUser', () => {
        let result: any;
        updateStub.callsFake((table, data, idOrCond) => { result = { table, data, idOrCond }; });

        SheetsDriver.updateUser(1, { displayName: 'xxx' });
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
    let decodeStub: sinon.SinonStub;

    beforeEach(() => {
        signStub = sinon.stub(Token, 'sign');
        decodeStub = sinon.stub(Token, 'decode');
    });

    afterEach(() => {
        signStub.restore();
        decodeStub.restore();
    });

    it('#sign', () => {
        signStub.restore();

        const result = Token.sign({ uid: 'xxx', email: 'xxx@gmail.com' });
        expect(result).to.contain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('#signIdToken', () => {
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
        const result = Token.signIdToken(user);
        expect(result).to.eql({
            a: 1,
            b: 2,
            id: 1,
            uid: 'xxx',
            sub: 'xxx@gmail.com',
            tty: 'ID',
        });
    });

    it('#decode', () => {
        signStub.restore();
        decodeStub.restore();

        const payload = { a: 1, b: 2 };
        // tslint:disable-next-line:max-line-length
        const result1 = Token.decode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4eHgiLCJlbWFpbCI6Inh4eEBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJhdWQiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJpYXQiOjE1NDY2MTE0NTUsImV4cCI6MTU0NjYxNTA1NX0.csU-Jc98S8RrF7WywBdlT60dbkb9WoGbQTcjdtlbGx8');
        const result2 = Token.decode(Token.sign(payload) + 'x');
        const result3 = Token.decode(Token.sign(payload));

        expect(result1).to.equal(null, 'expired');
        expect(result2).to.equal(null, 'invalid signature');
        expect(result3.aud).to.equal('https://sheetbaseapp.com');
        expect(result3.iss).to.equal('https://sheetbaseapp.com');
        expect(result3.a).to.equal(1);
        expect(result3.b).to.equal(2);
    });

    it('#decode (with ands)', () => {
        signStub.restore();
        decodeStub.restore();

        const ands = { tty: 'ID' };
        const result1 = Token.decode(Token.sign({}) + 'x', ands);
        const result2 = Token.decode(Token.sign({}), ands);
        const result3 = Token.decode(Token.sign({ tty: 'XXX' }), ands);
        const result4 = Token.decode(Token.signIdToken({}), ands);
        expect(result1).to.equal(null, 'invalid');
        expect(result2).to.equal(null, 'no tty');
        expect(result3).to.equal(null, 'wrong values');
        expect(!!result4).to.equal(true);
        expect(result4.tty).to.equal('ID');
    });

    it('#decodeIdToken', () => {
        decodeStub.onFirstCall().returns({ tty: 'ID' });

        const result = Token.decodeIdToken('xxx');
        expect(!!result).to.equal(true);
        expect(result.tty).to.equal('ID');
    });

    it('#decodeCustomToken', () => {
        decodeStub.onFirstCall().returns({ tty: 'CUSTOM' });

        const result = Token.decodeCustomToken('xxx');
        expect(!!result).to.equal(true);
        expect(result.tty).to.equal('CUSTOM');
    });

});

describe('Oob service', () => {

    const { Oob } = Auth;

    let sendPasswordResetStub: sinon.SinonStub;

    beforeEach(() => {
        gmailAppRecorder = null;
        sendPasswordResetStub = sinon.stub(Oob, 'sendPasswordReset');
    });

    afterEach(() => {
        sendPasswordResetStub.restore();
    });

    it('.options default values', () => {
        // @ts-ignore
        expect(Oob.siteName).to.equal('Sheetbase App');
        // @ts-ignore
        expect(Oob.passwordResetSubject).to.equal('Reset password for Sheetbase App');
    });

    it('#buildAuthUrl (no authUrl)', () => {
        // @ts-ignore
        const result = Oob.buildAuthUrl('passwordReset', 'xxx');
        expect(result).to.equal(
            'https://my-app-script-url.com/xxx?e=auth/action&mode=passwordReset&oobCode=xxx',
        );
    });

    it('#buildAuthUrl (has authUrl = string)', () => {
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

    it('#buildAuthUrl (has authUrl = Function)', () => {
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

    it('#buildPasswordResetBody (no passwordResetBody)', () => {
        // @ts-ignore
        const result1 = Oob.buildPasswordResetBody('https://xxx.xxx', {});
        // @ts-ignore
        const result2 = Oob.buildPasswordResetBody('https://xxx.xxx', { displayName: 'John' });
        expect(result1).to.contain('Hello User,');
        expect(result1).to.contain('https://xxx.xxx');
        expect(result2).to.contain('Hello John,');
    });

    it('#buildPasswordResetBody (has passwordResetBody)', () => {
        const { Oob } = auth({
            ... options,
            passwordResetBody: (url: string, user: any) => `xxx`,
        });
        // @ts-ignore
        const result = Oob.buildPasswordResetBody('https://xxx.xxx', {});
        expect(result).to.equal('xxx');
    });

    // it('#parse should throw error (no user)', () => {
    //     getUserStub.onFirstCall().returns(null);

    //     expect(Oob.parse('xxx')).to.equal(null);
    // });

    // it('#parse should throw error (no oobCode or oobTimestamp)', () => {
    //     getUserStub.onFirstCall().returns({ oobCode: null });
    //     getUserStub.onSecondCall().returns({ oobTimestamp: null });

    //     expect(Oob.parse('xxx')).to.equal(null);
    //     expect(Oob.parse('xxx')).to.equal(null);
    // });

    // it('#parse should throw error (not matched oobCode)', () => {
    //     getUserStub.onFirstCall().returns({ oobCode: 'xxx2', oobTimestamp: 1234567890 });

    //     expect(Oob.parse('xxx')).to.equal(null);
    // });

    // it('#parse should throw error (expired)', () => {
    //     getUserStub.onFirstCall().returns({
    //         oobCode: 'xxx',
    //         oobTimestamp: 0,
    //     });

    //     expect(Oob.parse('xxx')).to.equal(null);
    // });

    // it('#parse', () => {
    //     getUserStub.onFirstCall().returns({
    //         oobCode: 'xxx',
    //         oobTimestamp: (new Date()).getTime(),
    //     });

    //     const result = Oob.parse('xxx');
    //     expect(result.oobCode).to.equal('xxx');
    //     expect(typeof result.oobTimestamp === 'number').to.equal(true);
    // });

    // it('#verify', () => {
    //     getUserStub.onFirstCall().returns({
    //         oobCode: 'xxx',
    //         oobTimestamp: (new Date()).getTime(),
    //     });

    //     const result = Oob.verify('xxx');
    //     expect(result).to.equal(true);
    // });

    // it('#setOob (no user)', () => {
    //     getUserStub.onFirstCall().returns(null);
    //     setOobStub.restore();

    //     const result = Oob.setOob('xxx@gmail.com');
    //     expect(result).to.equal(null);
    // });

    // it('#setOob (has user)', () => {
    //     getUserStub.onFirstCall().returns({ uid: 'xxx' });
    //     setOobStub.restore();

    //     const result = Oob.setOob('xxx@gmail.com');
    //     expect(result.uid).to.equal('xxx');
    //     expect(typeof result.oobCode === 'string').to.equal(true);
    //     expect(result.oobCode.length).to.equal(64);
    //     expect(typeof result.oobTimestamp === 'number').to.equal(true);
    // });

    it('#sendPasswordReset', () => {
        sendPasswordResetStub.restore();

        Oob.sendPasswordReset({ email: 'xxx@gmail.com', oobCode: 'xxx' });
        expect(gmailAppRecorder.email).to.equal('xxx@gmail.com');
        expect(gmailAppRecorder.subject).to.equal('Reset password for Sheetbase App');
        expect(typeof gmailAppRecorder.plainBody === 'string').to.equal(true);
        expect(gmailAppRecorder.options.name).to.equal('Sheetbase App');
        expect(typeof gmailAppRecorder.options.htmlBody === 'string').to.equal(true);
    });

});

describe('Utils', () => {

    it('#sha256', () => {
        const result = sha256('xxx');
        expect(result).to.equal('cd2eb0837c9b4c962c22d2ff8b5441b7b45805887f051d39bf133b583baf6860');
    });

    it('#securePassword', () => {
        const result = securePassword('xxx');
        expect(result).to.equal('cd2eb0837c9b4c962c22d2ff8b5441b7b45805887f051d39bf133b583baf6860');
    });

});

describe('Account service', () => {

    const { Account } = Auth;

});
