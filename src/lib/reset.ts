import { KJUR } from 'jsrsasign-jwths';

import { User, Options, EmailTemplate } from './types';
import { OptionService } from './option';
import { DatabaseService } from './database';
import { OobService } from './oob';

export class ResetService {
  private optionService: OptionService;
  private databaseService: DatabaseService;
  private oobService: OobService;

    constructor (
      optionService: OptionService,
      databaseService: DatabaseService,
      oobService: OobService,
    ) {
      this.optionService = optionService;
      this.databaseService = databaseService;
      this.oobService = oobService;
    }

    sendPasswordResetEmail(email: string) {
        if (!email) {
          throw new Error('auth/invalid-input');
        }

        // check exists
        const user: User = this.databaseService.getUser({ email });
        if (!user) {
          throw new Error('auth/user-not-exists');
        }

        const uid = user.uid;
        const _oob = {
          code: Utilities.getUuid(),
          obtainedAt: (new Date()).getTime(),
        };
        this.databaseService.updateUser({ uid }, { _oob });

        // send email
        const template = this.passwordResetEmailTemplate(user);
        const recipient = user.email;
        const title = template.subject;
        const bodyText = template.plain;
        const bodyHtml = template.html;

        const { siteName } = this.optionService.get() as Options;
        const options = {
          name: siteName,
          htmlBody: bodyHtml,
        };
        GmailApp.sendEmail(recipient, title, bodyText, options);

        return { emailSent: true };
      }

      doPasswordReset(oobCode: string, newPassword: string) {
        const { encryptionKey } = this.optionService.get() as Options;

        if (!oobCode || !newPassword) {
          throw new Error('auth/invalid-input');
        }

        if (('' + newPassword).length < 7) {
          throw new Error();
        }

        const { user } = this.oobService.verifyCode(oobCode);
        const uid = user.uid;
        const _password = KJUR.crypto.Util.sha256(`${encryptionKey}.${user.email}.${newPassword}`);
        const _oob = '';
        this.databaseService.updateUser({ uid }, { _password, _oob });

        return { passwordReset: true };
      }

      private passwordResetEmailTemplate(user: User): EmailTemplate {
        let subject = ''; let plain = ''; let html = '';
        const { displayName, _oob } = user;
        const { apiKey, authUrl, siteName } = this.optionService.get() as Options;
        let backendUrl: string;
        if (authUrl) {
          backendUrl = ScriptApp.getService().getUrl();
        }
        // more data
        let link = authUrl ? authUrl + '?' : backendUrl + '?e=auth/action&';
            link += 'mode=passwordReset';
            link += '&apiKey=' + apiKey;
            link += '&oobCode=' + _oob['code'];
        // subject
        subject += 'Reset your password for ' + siteName;
        // plain
        plain += `Hello${displayName ? ' ' + displayName : ''},
                  Here is your password reset link: ${link}.
                  If you did request for password reset, please ignore this email.
                  Thank you!`;
        // html
        html += `<p>Hello${displayName ? ' ' + displayName : ''},</p>;
                <p>Here is your password reset link: <a href="${link}">${link}</a>.</p>;
                <p>If you did request for password reset, please ignore this email.</p>;
                <p>Thank you!</p>`;
        return { subject, plain, html };
    }

}