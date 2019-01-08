import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { auth, sheetsDriver, TokenService, User } from '../src/public_api';
import { sha256, validEmail } from '../src/lib/utils';

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
        deleteUser: () => null,
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
        delete: () => null,
    } as any);

    let itemStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;
    let deleteStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        itemStub = sinon.stub(SheetsDriver.sheetsSQL, 'item');
        // @ts-ignore
        updateStub = sinon.stub(SheetsDriver.sheetsSQL, 'update');
        // @ts-ignore
        deleteStub = sinon.stub(SheetsDriver.sheetsSQL, 'delete');
    });

    afterEach(() => {
        itemStub.restore();
        updateStub.restore();
        deleteStub.restore();
    });

    it('correct properties', () => {
        // @ts-ignore
        const sheetsSQL = SheetsDriver.sheetsSQL;
        expect(
            !!sheetsSQL &&
            !!sheetsSQL.item &&
            !!sheetsSQL.update &&
            !!sheetsSQL.delete,
        ).to.equal(true);
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

    it('#deleteUser', () => {
        let result: any;
        deleteStub.callsFake((table, idOrCond) => { result = { table, idOrCond }; });

        SheetsDriver.deleteUser(1);
        expect(result).to.eql({
            table: 'users',
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

    it('correct properties', () => {
        // @ts-ignore
        const encryptionSecret = Token.encryptionSecret;
        expect(typeof encryptionSecret === 'string').to.equal(true);
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
            authUrl: 'https://xxx.xxx',
            siteName: 'My App',
            emailSubject: () => '',
            emailBody: () => '',
        });
        // @ts-ignore
        expect(Oob.authUrl).to.equal('https://xxx.xxx');
        // @ts-ignore
        expect(Oob.siteName).to.equal('My App');
        // @ts-ignore
        expect(Oob.emailSubject instanceof Function).to.equal(true);
        // @ts-ignore
        expect(Oob.emailBody instanceof Function).to.equal(true);
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

    let dbGetUserStub: sinon.SinonStub;
    let decodeIdTokenStub: sinon.SinonStub;
    let userStub: sinon.SinonStub;
    let getUserStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        dbGetUserStub = sinon.stub(Account.Database, 'getUser');
        // @ts-ignore
        decodeIdTokenStub = sinon.stub(Account.Token, 'decodeIdToken');
        userStub = sinon.stub(Account, 'user');
        getUserStub = sinon.stub(Account, 'getUser');
    });

    afterEach(() => {
        dbGetUserStub.restore();
        decodeIdTokenStub.restore();
        userStub.restore();
        getUserStub.restore();
    });

    it('correct properties', () => {
        // @ts-ignore
        const Database = Account.Database;
        // @ts-ignore
        const Token = Account.Token;
        expect(
            !!Database &&
            !!Database.getUser &&
            !!Database.addUser &&
            !!Database.updateUser &&
            !!Database.deleteUser,
        ).to.equal(true);
        expect(!!Token && Token instanceof TokenService).to.equal(true);
    });

    it('#user', () => {
        userStub.restore();

        const result = Account.user({ uid: 'xxx' });
        expect(result instanceof User).to.equal(true);
    });

    it('#getUser', () => {
        userStub.restore();
        getUserStub.restore();
        dbGetUserStub.onFirstCall().returns(null);
        dbGetUserStub.onSecondCall().returns({});

        const result1 = Account.getUser(1);
        const result2 = Account.getUser(2);
        expect(result1).to.equal(null);
        expect(!!result2 && result2 instanceof User).to.equal(true);
    });

    it('#isUser', () => {
        userStub.restore();
        getUserStub.onFirstCall().returns(null);
        getUserStub.onSecondCall().returns(
            Account.user({ uid: 'xxx' }), // a valid user instance
        );

        const result1 = Account.isUser(1);
        const result2 = Account.isUser(2);
        expect(result1).to.equal(false);
        expect(result2).to.equal(true);
    });

    it('#getUserByEmailAndPassword (new user)', () => {
        userStub.callsFake((newUser) => ({
            setEmail: () => ({
                setPassword: () => ({
                    setRefreshToken: () => ({
                        save: () => newUser,
                    }),
                }),
            }),
        }));
        getUserStub.onFirstCall().returns(null); // user not exists

        const result: any = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
        expect(
            typeof result.uid === 'string' && result.uid.length === 28,
        ).to.equal(true, 'uid');
        expect(result.provider).to.equal('password');
        expect(typeof result.createdAt === 'number').to.equal(true, 'created at');
    });

    it('#getUserByEmailAndPassword (existing user, incorrect password)', () => {
        userStub.restore();
        getUserStub.onFirstCall().returns(
            Account.user({ password: 'xxx2-hased' }), // user exists with pwd = 'xxx2'
        );

        const result = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
        expect(result).to.equal(null);
    });

    it('#getUserByEmailAndPassword (existing user, correct password)', () => {
        userStub.restore();
        getUserStub.onFirstCall().returns(
            Account.user({
                password: 'cd2eb0837c9b4c962c22d2ff8b5441b7b45805887f051d39bf133b583baf6860',
            }), // user exists with pwd = 'xxx'
        );

        const result = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
        expect(!!result && result instanceof User).to.equal(true);
    });

    it('#getUserByCustomToken (invalid token)', () => {
        decodeIdTokenStub.onFirstCall().returns(null);

        const result = Account.getUserByCustomToken('xxx');
        expect(result).to.equal(null);
    });

    it('#getUserByCustomToken (new user)', () => {
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        userStub.callsFake((newUser) => ({
            setRefreshToken: () => ({
                save: () => newUser,
            }),
        }));
        getUserStub.onFirstCall().returns(null); // user not exists

        const result: any = Account.getUserByCustomToken('xxx');
        expect(result.uid).to.equal('xxx');
        expect(result.provider).to.equal('custom');
        expect(typeof result.createdAt === 'number').to.equal(true, 'created at');
    });

    it('#getUserByCustomToken (existing user)', () => {
        userStub.restore();
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(
            Account.user({ uid: 'xxx' }), // user exists
        );

        const result = Account.getUserByCustomToken('xxx');
        expect(!!result && result instanceof User).to.equal(true);
    });

    it('#getUserByIdToken (invalid token)', () => {
        decodeIdTokenStub.onFirstCall().returns(null);

        const result = Account.getUserByIdToken('xxx');
        expect(result).to.equal(null);
    });

    it('#getUserByIdToken (valid token, no user)', () => {
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(null); // user not exists

        const result = Account.getUserByIdToken('xxx');
        expect(result).to.equal(null);

    });

    it('#getUserByIdToken (has user)', () => {
        userStub.restore();
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(
            Account.user({ uid: 'xxx' }), // user exists
        );

        const result = Account.getUserByIdToken('xxx');
        expect(!!result && result instanceof User).to.equal(true);
    });

    it('#getUserByOobCode (invalid token)', () => {
        decodeIdTokenStub.onFirstCall().returns(null);

        const result = Account.getUserByOobCode('xxx');
        expect(result).to.equal(null);
    });

    it('#getUserByOobCode (expired)', () => {
        userStub.restore();
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(
            Account.user({ uid: 'xxx', oobTimestamp: 0 }),
        );

        const result = Account.getUserByOobCode('xxx');
        expect(result).to.equal(null);
    });

    it('#getUserByOobCode', () => {
        userStub.restore();
        decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
        getUserStub.onFirstCall().returns(
            Account.user({ uid: 'xxx', oobTimestamp: (new Date()).getTime() }),
        );

        const result = Account.getUserByOobCode('xxx');
        expect(!!result && result instanceof User).to.equal(true);
    });

    it('#getUserByRefreshToken', () => {
        getUserStub.callsFake(finder => finder);

        const result = Account.getUserByRefreshToken('xxx');
        expect(result).to.eql({ refreshToken: 'xxx' });
    });

});

describe('User service', () => {

    const userData = {
        '#': 1,
        uid: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: 'xxx@xxx.com',
        password: 'xxx',
        refreshToken: 'xxx',
    };
    let user: User;

    let updateUserStub: sinon.SinonStub;
    let deleteUserStub: sinon.SinonStub;
    let signIdTokenStub: sinon.SinonStub;

    beforeEach(() => {
        user = Auth.Account.user({ ... userData, provider: 'password' });
        // @ts-ignore
        updateUserStub = sinon.stub(user.Database, 'updateUser');
        // @ts-ignore
        deleteUserStub = sinon.stub(user.Database, 'deleteUser');
        // @ts-ignore
        signIdTokenStub = sinon.stub(user.Token, 'signIdToken');
    });

    afterEach(() => {
        updateUserStub.restore();
        deleteUserStub.restore();
        signIdTokenStub.restore();
    });

    it('correct properties', () => {
        // @ts-ignore
        const userData = user.userData;
        // @ts-ignore
        const Database = user.Database;
        // @ts-ignore
        const Token = user.Token;
        expect(!!userData).to.equal(true);
        expect(
            !!Database &&
            !!Database.getUser &&
            !!Database.addUser &&
            !!Database.updateUser &&
            !!Database.deleteUser,
        ).to.equal(true);
        expect(!!Token && Token instanceof TokenService).to.equal(true);
    });

    it('#getData', () => {
        const result = user.getData();
        expect(result).to.eql({ ... userData, provider: 'password' });
    });

    it('#getProfile', () => {
        const result: any = user.getProfile();
        expect(result['#']).to.equal(1);
        expect(result.uid).to.equal('xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        expect(result.email).to.equal('xxx@xxx.com');
        expect(result.password).to.equal(undefined);
        expect(result.oobCode).to.equal(undefined);
    });

    it('#getProvider', () => {
        expect(user.getData().provider).to.equal('password');
    });

    it('#getIdToken', () => {
        signIdTokenStub.onFirstCall().returns('xxx');

        const result = user.getIdToken();
        expect(result).to.equal('xxx');
    });

    it('#comparePassword', () => {
        const result = user.comparePassword('x');
        expect(typeof result === 'boolean').to.equal(true);
    });

    it('#updateProfile', () => {
        const result = user.updateProfile({
            password: 'xxx2',
            displayName: 'John',
        }).getData();
        expect(result.password).to.equal('xxx'); // wont change password
        expect(result.displayName).to.equal('John');
    });

    it('#updateClaims', () => {
        expect(user.getData().claims).to.equal(undefined); // before
        const result = user.updateClaims({ a: 1, b: 2 }).getData();
        expect(result.claims).to.eql({ a: 1, b: 2 });
    });

    it('#setlastLogin', () => {
        expect(user.getData().lastLogin).to.equal(undefined); // before
        const result = user.setlastLogin().getData();
        expect(!!result.lastLogin && typeof result.lastLogin === 'number').to.equal(true);
    });

    it('#setEmail', () => {
        expect(user.getData().email).to.equal('xxx@xxx.com'); // before
        const result = user.setEmail('xxx2@xxx.com').getData();
        expect(result.email).to.equal('xxx2@xxx.com');
    });

    it('#confirmEmail', () => {
        expect(user.getData().emailVerified).to.equal(undefined); // before
        const result = user.confirmEmail().getData();
        expect(result.emailVerified).to.equal(true);
    });

    it('#setPassword', () => {
        expect(user.getData().password).to.equal('xxx'); // before
        const result = user.setPassword('xxx2').getData();
        expect(result.password.length === 64).to.equal(true);
    });

    it('#setUsername', () => {
        expect(user.getData().username).to.equal(undefined); // before
        const result = user.setUsername('xxx').getData();
        expect(result.username).to.equal('xxx');
    });

    it('#setOob', () => {
        expect(user.getData().oobCode).to.equal(undefined); // before
        expect(user.getData().oobTimestamp).to.equal(undefined); // before
        const result = user.setOob().getData();
        expect(result.oobCode.length === 64).to.equal(true, 'code');
        expect(typeof result.oobTimestamp === 'number').to.equal(true, 'timestamp');
    });

    it('#setRefreshToken', () => {
        expect(user.getData().refreshToken).to.equal('xxx'); // before
        expect(user.getData().tokenTimestamp).to.equal(undefined); // before
        const result = user.setRefreshToken().getData();
        expect(result.refreshToken.length === 64).to.equal(true, 'token');
        expect(typeof result.tokenTimestamp === 'number').to.equal(true, 'timestamp');
    });

    it('#delete', () => {
        let id: number;
        deleteUserStub.callsFake(_id => { id = _id; });
        const result = user.delete();
        expect(id).to.equal(1);
        expect(result instanceof User).to.equal(true);
    });

    it('#save', () => {
        let data: any;
        updateUserStub.callsFake((id, userData) => { data = { id, userData }; });
        const result = user.save();
        expect(data.id).to.equal(1);
        expect(data.userData.email).to.equal('xxx@xxx.com');
        expect(result instanceof User).to.equal(true);
    });

});
