import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { auth, sheetsDriver } from '../src/public_api';
import { sha256, securePassword, validEmail } from '../src/lib/utils';

const g: any = global;
g.ScriptApp = {
    getService: () => ({ getUrl: () => 'https://script.google.com/xxx' }),
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

    let sendEmailStub: sinon.SinonStub;

    beforeEach(() => {
        gmailAppRecorder = null;
        sendEmailStub = sinon.stub(Oob, 'sendEmail');
    });

    afterEach(() => {
        sendEmailStub.restore();
    });

    it('.options default values', () => {
        // @ts-ignore
        expect(Oob.siteName).to.equal('Sheetbase App');
    });

    it('.options custom values', () => {
        const { Oob } = auth({
            ... options,
            siteName: 'My App',
        });
        // @ts-ignore
        expect(Oob.siteName).to.equal('My App');
    });

    it('#buildAuthUrl (no authUrl)', () => {
        const result = Oob.buildAuthUrl('passwordReset', 'xxx');
        expect(result).to.equal(
            'https://script.google.com/xxx?e=auth/action&mode=passwordReset&oobCode=xxx',
        );
    });

    it('#buildAuthUrl (has authUrl = string)', () => {
        const { Oob } = auth({
            ... options,
            authUrl: 'https://xxx.xxx/auth',
        });
        const result = Oob.buildAuthUrl('passwordReset', 'xxx');
        expect(result).to.equal(
            'https://xxx.xxx/auth?mode=passwordReset&oobCode=xxx',
        );
    });

    it('#buildAuthUrl (has authUrl = Function)', () => {
        const { Oob } = auth({
            ... options,
            // tslint:disable-next-line:max-line-length
            authUrl: (mode, oobCode) => `https://xxx.xxx/auth?m=${mode}&c=${oobCode}&k=abc`,
        });
        const result = Oob.buildAuthUrl('reset', 'xxx');
        expect(result).to.equal(
            'https://xxx.xxx/auth?m=reset&c=xxx&k=abc',
        );
    });

    it('#buildEmailSubject (no emailSubject)', () => {
        const result = Oob.buildEmailSubject('passwordReset', 'The default subject');
        expect(result).to.contain('The default subject');
    });

    it('#buildEmailSubject (has emailSubject)', () => {
        const { Oob } = auth({
            ... options,
            emailSubject: (mode) => 'Email subject for ' + mode,
        });
        const result = Oob.buildEmailSubject('passwordReset', 'The default subject');
        expect(result).to.contain('Email subject for passwordReset');
    });

    it('#buildEmailBody (no emailBody)', () => {
        const result1 = Oob.buildEmailBody(
            'emailConfirmation', 'https://xxx.xxx', {},
            'Hello world!',
        );
        const result2 = Oob.buildEmailBody(
            'emailConfirmation', 'https://xxx.xxx', { displayName: 'John' },
            'Hello John!',
        );
        expect(result1).to.contain('Hello world!');
        expect(result2).to.contain('Hello John!');
    });

    it('#buildEmailBody (has emailBody)', () => {
        const { Oob } = auth({
            ... options,
            emailBody: (mode, url, userData) => 'Email body for ' + mode + ' ' + url,
        });
        const result = Oob.buildEmailBody(
            'emailConfirmation', 'https://xxx.xxx', {},
            'Hello world!',
        );
        expect(result).to.equal('Email body for emailConfirmation https://xxx.xxx');
    });

    it('#sendEmail', () => {
        sendEmailStub.restore();

        Oob.sendEmail(
            'emailConfirmation',
            'https://xxx.xxx',
            { email: 'xxx@gmail.com', oobCode: 'xxx' },
            'The default title',
            'The default body ...',
        );
        expect(gmailAppRecorder.email).to.equal('xxx@gmail.com');
        expect(gmailAppRecorder.subject).to.equal('The default title');
        expect(typeof gmailAppRecorder.plainBody === 'string').to.equal(true);
        expect(gmailAppRecorder.options.name).to.equal('Sheetbase App');
        expect(typeof gmailAppRecorder.options.htmlBody === 'string').to.equal(true);
    });

    it('#sendPasswordResetEmail', () => {
        let result: any;
        sendEmailStub.callsFake((mode, url, userData, defaultSubject, defaultBody) => {
            result = { mode, url, userData, defaultSubject, defaultBody };
        });

        Oob.sendPasswordResetEmail({ displayName: 'Jane' });
        expect(result.mode).to.equal('passwordReset');
        expect(result.url).to.contain('https://script.google.com');
        expect(result.userData.displayName).to.equal('Jane');
        expect(result.defaultSubject).to.equal('Reset your password for Sheetbase App');
        expect(result.defaultBody).to.contain('Hello Jane!');
        expect(result.defaultBody).to.contain('https://script.google.com');
    });

    it('#sendEmailConfirmationEmail', () => {
        let result: any;
        sendEmailStub.callsFake((mode, url, userData, defaultSubject, defaultBody) => {
            result = { mode, url, userData, defaultSubject, defaultBody };
        });

        Oob.sendEmailConfirmationEmail({ displayName: 'Jane' });
        expect(result.mode).to.equal('emailConfirmation');
        expect(result.url).to.contain('https://script.google.com');
        expect(result.userData.displayName).to.equal('Jane');
        expect(result.defaultSubject).to.equal('Confirm your email for Sheetbase App');
        expect(result.defaultBody).to.contain('Hello Jane!');
        expect(result.defaultBody).to.contain('https://script.google.com');
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

    it('#validEmail', () => {
        const result1 = validEmail('xxx');
        const result2 = validEmail('xxx@xxx');
        const result3 = validEmail('xxx@xxx.xxx');
        expect(result1).to.equal(false);
        expect(result2).to.equal(false);
        expect(result3).to.equal(true);
    });

});

describe('Account service', () => {

    const { Account } = Auth;

});
