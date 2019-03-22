import { User as UserData } from '@sheetbase/models';

import { Options, AuthUrl, EmailSubject, EmailBody } from './types';

export class OobService {

    private authUrl: AuthUrl;
    private emailPrefix: string;
    private emailSubject: EmailSubject;
    private emailBody: EmailBody;

    constructor(options: Options) {
        const {
            authUrl,
            emailPrefix = 'Sheetbase',
            emailSubject,
            emailBody,
        } = options;
        this.authUrl = authUrl;
        this.emailPrefix = emailPrefix;
        this.emailSubject = emailSubject;
        this.emailBody = emailBody;
    }

    sendPasswordResetEmail(userData: UserData) {
        const { displayName, oobCode, oobMode } = userData;
        const url = this.buildAuthUrl(oobMode, oobCode);
        this.sendEmail(
            oobMode,
            url,
            userData,
            'Reset your password',
            `<p>Hello ${ displayName || 'User' }!</p>
            <p>Here is your password reset link: <a href="${url}">${url}</a>.</p>
            <p>If you did not request for password reset, please ignore this email.</p>
            <p>Thank you!</p>`,
        );
    }

    sendEmailVerificationEmail(userData: UserData) {
        const { displayName, oobCode, oobMode } = userData;
        const url = this.buildAuthUrl(oobMode, oobCode);
        this.sendEmail(
            oobMode,
            url,
            userData,
            'Confirm your email',
            `<p>Hello ${ displayName || 'User' }!</p>
            <p>Click to confirm your email: <a href="${url}">${url}</a>.</p>
            <p>If you did not request for the action, please ignore this email.</p>
            <p>Thank you!</p>`,
        );
    }

    buildAuthUrl(mode: string, code: string) {
        let authUrl = this.authUrl;
        if (!!authUrl && authUrl instanceof Function) {
          return authUrl(mode, code);
        } else {
          authUrl = !authUrl ? (ScriptApp.getService().getUrl() + '?e=auth/action&') : authUrl + '?';
          authUrl += `mode=${mode}&oobCode=${code}`;
          return authUrl;
        }
    }

    buildEmailSubject(mode: string, defaultSubject: string) {
        if (!!this.emailSubject) {
            return this.emailSubject(mode);
        }
        return defaultSubject;
    }

    buildEmailBody(
        mode: string,
        url: string,
        userData: UserData,
        defaultBody: string,
    ) {
        if (!!this.emailBody) {
            return this.emailBody(mode, url, userData);
        }
        return defaultBody;
    }

    getGmailLabel(name: string) {
        let label = GmailApp.getUserLabelByName(name);
        if (!label) {
            label = GmailApp.createLabel(name);
        }
        return label;
    }

    sendEmail(
        mode: string,
        url: string,
        userData: UserData,
        defaultSubject: string,
        defaultBody: string,
    ) {
        // build data
        const subject = '(' + this.emailPrefix + ') ' + this.buildEmailSubject(mode, defaultSubject);
        const htmlBody = this.buildEmailBody(mode, url, userData, defaultBody);
        const body = htmlBody.replace(/<[^>]*>?/g, '');
        const options = {
            name: this.emailPrefix,
            htmlBody,
        };
        // send email
        const { email } = userData;
        GmailApp.sendEmail(email, subject, body, options);
        // retrieve thread
        Utilities.sleep(3000);
        const sentThreads = GmailApp.search('from:me to:' + email);
        const [ thread ] = sentThreads;
        // set label
        thread.addLabel(this.getGmailLabel(this.emailPrefix + ':Oob'));
    }

}