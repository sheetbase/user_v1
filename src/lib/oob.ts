
import { Options, User } from './types';
import { DatabaseService } from './database';

export class OobService {
    private options: Options;
    private databaseService: DatabaseService;

    constructor(
        databaseService: DatabaseService,
    ) {
        this.databaseService = databaseService;
    }

    parse(code: string) {
        const user = this.databaseService.getUser({ oobCode: code });
        const { oobCode, oobTimestamp } = user || {} as User;
        const beenMinutes = Math.round(((new Date()).getTime() - oobTimestamp) / 60000);
        if (
            !oobCode ||
            !oobTimestamp ||
            oobCode !== code ||
            beenMinutes > 60
        ) {
            return null;
        }
        return user;
    }

    verify(code: string) {
        return !! this.parse(code);
    }

    setOob(email: string): User {
        const user = this.databaseService.getUser({ email });
        // save oob
        if (!!user) {
            const oobCode = user.uid + '/' + Utilities.getUuid();
            const oobTimestamp = (new Date()).getTime();
            this.databaseService.updateUser({ email }, { oobCode, oobTimestamp });
            return { ... user, oobCode, oobTimestamp };
        } else {
            return null;
        }
    }

    sendPasswordReset(user: User) {
        const { siteName, passwordResetSubject } = this.options;
        const { email, oobCode } = user;
        // send email
        const subject = passwordResetSubject || 'Reset password for ' + siteName;
        const htmlBody = this.buildPasswordResetBody(this.buildAuthUrl('passwordReset', oobCode), user);
        const plainBody = htmlBody.replace(/<[^>]*>?/g, '');
        GmailApp.sendEmail(email, subject, plainBody, { name: siteName, htmlBody });
    }

    sendPasswordResetByEmail(email: string) {
        const user = this.setOob(email);
        if (!!user) {
            this.sendPasswordReset(user);
        }
    }

    private buildAuthUrl(mode: string, oobCode: string) {
        let { authUrl } = this.options;
        if (authUrl instanceof Function) {
          return authUrl(mode, oobCode);
        } else {
          authUrl = !authUrl ? (ScriptApp.getService().getUrl() + '?e=auth/action&') : authUrl + '?';
          authUrl += `mode=${mode}&oobCode=${oobCode}`;
          return authUrl;
        }
    }

    private buildPasswordResetBody(url: string, user: User) {
        const { passwordResetBody } = this.options;
        // build template
        if (!!passwordResetBody) {
            return passwordResetBody(url, user);
        } else {
            const { displayName } = user;
            return '' +
            `<p>Hello ${ displayName || 'User' },</p>;
            <p>Here is your password reset link: <a href="${url}">${url}</a>.</p>;
            <p>If you did request for password reset, please ignore this email.</p>;
            <p>Thank you!</p>`;
        }
    }

}