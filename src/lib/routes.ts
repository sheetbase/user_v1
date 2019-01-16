import { RouteHandler, AddonRoutesOptions } from '@sheetbase/core-server';

import { User } from './user';
import { AccountService } from './account';
import { OobService } from './oob';
import { isValidEmail } from './utils';
import { userMiddleware } from './middlewares';

const ROUTING_ERRORS = {
  'auth/invalid-input': 'Invalid input.',
  'auth/invalid-token': 'Invalid token.',
  'auth/invalid-email': 'Invalid email.',
  'auth/invalid-password': 'Invalid password.',
  'auth/user-exists': 'User already exists.',
  'auth/user-not-exists': 'No user.',
};

export function registerRoutes(
  Account: AccountService,
  Oob: OobService,
) {
  return (options?: AddonRoutesOptions) => {

    const {
      router,
      endpoint = 'auth',
      disabledRoutes = [],
      middlewares = [(req, res, next) => next()] as RouteHandler[],
    } = options;

    // register errors & disabled routes
    router.setDisabled(disabledRoutes);
    router.setErrors(ROUTING_ERRORS);

    // user middleware
    const userMdlware = userMiddleware(Account);

    /**
     * account
     */
    // create new
    router.put('/' + endpoint, ...middlewares,
    (req, res) => {
      const { email = '', password = '' } = req.body;

      let user: User;
      if (!email && !password) {
        user = Account.getUserAnonymously();
      } else {
        if (!isValidEmail(email)) {
          return res.error('auth/invalid-email');
        }
        if (!Account.isValidPassword(password)) {
          return res.error('auth/invalid-password');
        }
        user = Account.getUserByEmailAndPassword(email, password);
      }

      // user exists
      const { isNewUser } = user.getInfo();
      if (!isNewUser) {
        return res.error('auth/user-exists');
      }

      // result
      user.setlastLogin().save(); // update last login
      const { refreshToken } = user.getData();
      const response = {
        info: user.getInfo(),
        idToken: user.getIdToken(),
        refreshToken,
      };
      return res.success(response);
    });

    // login
    router.post('/' + endpoint, ...middlewares,
    (req, res) => {
      const { email, password = '', customToken, offlineAccess = false } = req.body;
      if (!email && !customToken) {
        return res.error('auth/invalid-input');
      }

      // get user
      let user: User;
      if (!!customToken) {
        user = Account.getUserByCustomToken(customToken);
      } else {
        if (!isValidEmail(email)) {
          return res.error('auth/invalid-email');
        }
        if (!Account.isValidPassword(password)) {
          return res.error('auth/invalid-password');
        }
        user = Account.getUserByEmailAndPassword(email, password);
      }

      // no user
      if (!user || user.getInfo().isNewUser) {
        return res.error('auth/user-not-exists');
      }

      // result
      user.setlastLogin().save(); // update last login
      const response: any = {
        info: user.getInfo(),
        idToken: user.getIdToken(),
      };
      if (!!offlineAccess) {
        const { refreshToken } = user.getData();
        response.refreshToken = refreshToken;
      }
      return res.success(response);
    });

    // logout (renew refresh token to revoke access)
    router.delete('/' + endpoint, ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      user.setRefreshToken().save(); // new refresh token
      return res.success({ acknowledged: true });
    });

    /**
     * cancel account
     */
    router.delete('/' + endpoint + '/cancel', ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      const { refreshToken } = req.body;
      if (!!refreshToken) {
        const { refreshToken: userRefreshToken } = user.getData();
        if (refreshToken === userRefreshToken) {
          user.delete(); // delete
          return res.success({ acknowledged: true });
        }
      }
      return res.error('auth/invalid-input');
    });

    /**
     * user
     */
    // get info
    router.get('/' + endpoint + '/user', ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      return res.success(user.getInfo());
    });

    // update profile (displayName && photoURL)
    router.post('/' + endpoint + '/user', ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      const { profile } = req.body;
      if (!!profile) {
        return res.success(
          user.updateProfile(profile)
          .save()
          .getInfo(),
        );
      }
      return res.error('auth/invalid-input');
    });

    // update username
    router.post('/' + endpoint + '/user/username', ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      const { username } = req.body;
      // TODO: must not contains invalid characters
      // username must be unique
      if (!!username && !Account.isUser({ username })) {
        return res.success(
          user.setUsername(username)
          .save()
          .getInfo(),
        );
      }
      return res.error('auth/invalid-input');
    });

    // update password
    router.post('/' + endpoint + '/user/password', ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      const { currentPassword, newPassword } = req.body;
      if (
        !!currentPassword &&
        !!newPassword &&
        !!Account.isValidPassword(newPassword) &&
        !!user.comparePassword(currentPassword)
      ) {
        return res.success(
          user.setPassword(newPassword)
          .save()
          .getInfo(),
        );
      }
      return res.error('auth/invalid-input');
    });

    // TODO: update email

    // TODO: update phoneNumber

    // TODO: may add signInWithPopup

    // TODO: may add signInWithEmailLink

    /**
     * token
     */
    // exchange the refresh token for a new id token
    router.get('/' + endpoint + '/token', ...middlewares,
    (req, res) => {
      const { refreshToken, type = 'ID' } = req.query;
      if (!!refreshToken) {
        const user = Account.getUserByRefreshToken(refreshToken);
        // no user
        if (!!user) {
          let response: any;
          if (type === 'ID') {
            response = { idToken: user.getIdToken() };
          }
          return res.success(response);
        }
      }
      return res.error('auth/invalid-input');
    });

    /**
     * oob
     */
    // request emails
    router.put('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { mode, email } = req.body;
      if (!!mode && !!email) {
        const user = Account.getUser({ email });
        if (!!user) {
          if (mode === 'resetPassword') {
            Oob.sendPasswordResetEmail(
              user.setOob(mode)
                .save()
                .getData(),
            );
          } else if (mode === 'verifyEmail') {
            Oob.sendEmailVerificationEmail(
              user.setOob(mode)
                .save()
                .getData(),
            );
          }
        }
      }
      return res.success({ acknowledged: true });
    });

    // check oob code
    router.get('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { oobCode, mode } = req.query;
      if (!!oobCode) {
        const user = Account.getUserByOobCode(oobCode);
        const { email, oobMode } = !!user ? user.getData() : {} as any;
        if (!!user && (!mode || (!!mode && mode === oobMode))) {
          const operations = {
            resetPassword: 'PASSWORD_RESET',
            verifyEmail: 'VERIFY_EMAIL',
          };
          return res.success({
            operation: operations[oobMode] || 'NONE',
            data: { email },
          });
        }
      }
      return res.error('auth/invalid-input');
    });

    // handler
    router.post('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.body;
      if (!!mode && !!oobCode) {
        const user = Account.getUserByOobCode(oobCode);
        const { oobMode } = !!user ? user.getData() : {} as any;
        if (!!user && mode === oobMode) {

          // reset password
          if (mode === 'resetPassword') {
            const { newPassword = '' } = req.body;
            if (Account.isValidPassword(newPassword)) { // validate password
              user.setPassword(newPassword)
                .setRefreshToken() // revoke current access
                .setOob() // revoke oob code
                .save();
              return res.success({ acknowledged: true });
            }
          }

          // verify email
          else if (mode === 'verifyEmail') {
            user.confirmEmail()
              .save();
            return res.success({ acknowledged: true });
          }
        }
      }
      return res.error('auth/invalid-input');
    });

    /**
     * default auth actions
     */
    // facing page
    router.get('/' + endpoint + '/action', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.query;
      if (!!mode && !!oobCode) {
        const user = Account.getUserByOobCode(oobCode);
        const { email, oobMode } = !!user ? user.getData() : {} as any;
        if (!!user && mode === oobMode) {

          // reset password
          if (mode === 'resetPassword') {
            return res.html(htmlPage(
              `<h1>Reset password</h1>
              <p>Reset your acccount password of <strong>${email}</strong>:</p>
              <form method="POST" action="">
                <input type="text" name="password" placeholder="New password" />
                <input type="text" name="passwordRepeat" placeholder="Repeat password" />
                <input type="submit" value="Change password">
              </form>`,
            ));
          }

          // verify email
          else if (mode === 'verifyEmail') {
            // verify the email
            user.confirmEmail()
              .save();
            return res.html(htmlPage(
              `<h1>Email confirmed</h1>
              <p>Your account email is now verified.`,
            ));
          }

        }
      }
      return res.html(htmlPage(
        `<h1>Action failed</h1>
        <p>Invalid input.</p>`,
      ));
    });

    // handler
    router.post('/' + endpoint + '/action', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.body;
      if (!!mode && !!oobCode) {
        const user = Account.getUserByOobCode(oobCode);
        const { oobMode } = !!user ? user.getData() : {} as any;
        if (!!user && mode === oobMode) {

          // reset password
          if (mode === 'resetPassword') {
            const { newPassword = '' } = req.body;
            if (Account.isValidPassword(newPassword)) { // validate password
              user.setPassword(newPassword)
                .setRefreshToken() // revoke current access
                .setOob() // revoke oob code
                .save();
              return res.html(htmlPage(
                `<h1>Password changed</h1>
                <p>Your password has been updated, now you can login with new password.`,
              ));
            }
          }

        }
      }
      return res.html(htmlPage(
        `<h1>Action failed</h1>
        <p>Invalid input.</p>`,
      ));
    });

  };
}

function htmlPage(body: string) {
  return (
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Sheetbase App</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
        }
        .wrapper {
          width: 500px;
          margin: 100px auto;
        }
      </style>

    </head>
    <body>

      <div class="wrapper">
        ${body}
      <div>

    </body>
    </html>`
  );
}
