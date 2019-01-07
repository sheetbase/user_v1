import { Options, AuthUrl, EmailSubject, EmailBody, UserData } from './types';

export class OobService {

    private authUrl: AuthUrl;
    private siteName: string;
    private emailSubject: EmailSubject;
    private emailBody: EmailBody;

    constructor(options: Options) {
        const {
            authUrl,
            siteName = 'Sheetbase App',
            emailSubject,
            emailBody,
        } = options;
        this.authUrl = authUrl;
        this.siteName = siteName;
        this.emailSubject = emailSubject;
        this.emailBody = emailBody;
    }

    sendPasswordResetEmail(userData: UserData) {
        const mode = 'passwordReset';
        const { displayName, oobCode } = userData;
        const url = this.buildAuthUrl(mode, oobCode);
        this.sendEmail(
            mode,
            url,
            userData,
            'Reset your password for ' + this.siteName,
            `<p>Hello ${ displayName || 'User' }!</p>;
            <p>Here is your password reset link: <a href="${url}">${url}</a>.</p>;
            <p>If you did not request for password reset, please ignore this email.</p>;
            <p>Thank you!</p>`,
        );
    }

    sendEmailConfirmationEmail(userData: UserData) {
        const mode = 'emailConfirmation';
        const { displayName, oobCode } = userData;
        const url = this.buildAuthUrl(mode, oobCode);
        this.sendEmail(
            mode,
            url,
            userData,
            'Confirm your email for ' + this.siteName,
            `<p>Hello ${ displayName || 'User' }!</p>;
            <p>Click to confirm your email: <a href="${url}">${url}</a>.</p>;
            <p>If you did not request for the action, please ignore this email.</p>;
            <p>Thank you!</p>`,
        );
    }

    buildAuthUrl(mode: string, oobCode: string) {
        let authUrl = this.authUrl;
        if (!!authUrl && authUrl instanceof Function) {
          return authUrl(mode, oobCode);
        } else {
          authUrl = !authUrl ? (ScriptApp.getService().getUrl() + '?e=auth/action&') : authUrl + '?';
          authUrl += `mode=${mode}&oobCode=${oobCode}`;
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

    sendEmail(
        mode: string,
        url: string,
        userData: UserData,
        defaultSubject: string,
        defaultBody: string,
    ) {
        // build data
        const subject = this.buildEmailSubject(mode, defaultSubject);
        const htmlBody = this.buildEmailBody(mode, url, userData, defaultBody);
        const plainBody = htmlBody.replace(/<[^>]*>?/g, '');
        // send email
        const { email } = userData;
        GmailApp.sendEmail(email, subject, plainBody, { name: this.siteName, htmlBody });
    }

}