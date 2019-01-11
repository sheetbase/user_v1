import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { auth } from '../src/public_api';
import { options, Auth } from './test';

let gmailAppRecorder: any;
global['GmailApp'] = {
    sendEmail: (email: string, subject: string, plainBody: string, options: any) => {
        gmailAppRecorder = { email, subject, plainBody, options };
    },
};
global['ScriptApp'] = {
    getService: () => ({ getUrl: () => 'https://script.google.com/xxx' }),
};
global['Utilities'] = {
    getUuid: () => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

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
        const result = Oob.buildAuthUrl('resetPassword', 'xxx');
        expect(result).to.equal(
            'https://script.google.com/xxx?e=auth/action&mode=resetPassword&oobCode=xxx',
        );
    });

    it('#buildAuthUrl (has authUrl = string)', () => {
        const { Oob } = auth({
            ... options,
            authUrl: 'https://xxx.xxx/auth',
        });
        const result = Oob.buildAuthUrl('resetPassword', 'xxx');
        expect(result).to.equal(
            'https://xxx.xxx/auth?mode=resetPassword&oobCode=xxx',
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
        const result = Oob.buildEmailSubject('resetPassword', 'The default subject');
        expect(result).to.contain('The default subject');
    });

    it('#buildEmailSubject (has emailSubject)', () => {
        const { Oob } = auth({
            ... options,
            emailSubject: (mode) => 'Email subject for ' + mode,
        });
        const result = Oob.buildEmailSubject('resetPassword', 'The default subject');
        expect(result).to.contain('Email subject for resetPassword');
    });

    it('#buildEmailBody (no emailBody)', () => {
        const result1 = Oob.buildEmailBody(
            'verifyEmail', 'https://xxx.xxx', {},
            'Hello world!',
        );
        const result2 = Oob.buildEmailBody(
            'verifyEmail', 'https://xxx.xxx', { displayName: 'John' },
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
            'verifyEmail', 'https://xxx.xxx', {},
            'Hello world!',
        );
        expect(result).to.equal('Email body for verifyEmail https://xxx.xxx');
    });

    it('#sendEmail', () => {
        sendEmailStub.restore();

        Oob.sendEmail(
            'verifyEmail',
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

        Oob.sendPasswordResetEmail({ displayName: 'Jane', oobMode: 'resetPassword' });
        expect(result.mode).to.equal('resetPassword');
        expect(result.url).to.contain('https://script.google.com');
        expect(result.userData.displayName).to.equal('Jane');
        expect(result.defaultSubject).to.equal('Reset your password for Sheetbase App');
        expect(result.defaultBody).to.contain('Hello Jane!');
        expect(result.defaultBody).to.contain('https://script.google.com');
    });

    it('#sendEmailVerificationEmail', () => {
        let result: any;
        sendEmailStub.callsFake((mode, url, userData, defaultSubject, defaultBody) => {
            result = { mode, url, userData, defaultSubject, defaultBody };
        });

        Oob.sendEmailVerificationEmail({ displayName: 'Jane', oobMode: 'verifyEmail' });
        expect(result.mode).to.equal('verifyEmail');
        expect(result.url).to.contain('https://script.google.com');
        expect(result.userData.displayName).to.equal('Jane');
        expect(result.defaultSubject).to.equal('Confirm your email for Sheetbase App');
        expect(result.defaultBody).to.contain('Hello Jane!');
        expect(result.defaultBody).to.contain('https://script.google.com');
    });

});
