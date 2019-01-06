import { Options, AuthUrl, PasswordResetBody, UserData } from './types';

export class OobService {

    private authUrl: AuthUrl;
    private siteName: string;
    private passwordResetSubject: string;
    private passwordResetBody: PasswordResetBody;

    constructor(options: Options) {
        const {
            authUrl,
            siteName = 'Sheetbase App',
            passwordResetSubject = 'Reset password for Sheetbase App',
            passwordResetBody,
        } = options;
        this.authUrl = authUrl;
        this.siteName = siteName;
        this.passwordResetSubject = passwordResetSubject;
        this.passwordResetBody = passwordResetBody;
    }

    sendPasswordReset(userData: UserData) {
        const { email, oobCode } = userData;
        // send email
        const subject = this.passwordResetSubject;
        const htmlBody = this.buildPasswordResetBody(
            this.buildAuthUrl('passwordReset', oobCode), userData,
        );
        const plainBody = htmlBody.replace(/<[^>]*>?/g, '');
        GmailApp.sendEmail(email, subject, plainBody, { name: this.siteName, htmlBody });
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

    buildPasswordResetBody(url: string, userData: UserData) {
        // build template
        if (!!this.passwordResetBody) {
            return this.passwordResetBody(url, userData);
        } else {
            const { displayName } = userData;
            return '' +
            `<p>Hello ${ displayName || 'User' },</p>;
            <p>Here is your password reset link: <a href="${url}">${url}</a>.</p>;
            <p>If you did request for password reset, please ignore this email.</p>;
            <p>Thank you!</p>`;
        }
    }

}