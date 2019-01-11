import { RouteHandler, AddonRoutesOptions } from '@sheetbase/core-server';

import { User } from './user';
import { AccountService } from './account';
import { OobService } from './oob';
import { validEmail } from './utils';
import { userMiddleware } from './middlewares';

const ROUTING_ERRORS = {
  'auth/invalid-token': 'Invalid token.',
  'auth/invalid-email': 'Invalid email.',
  'auth/invalid-password': 'Invalid password.',
  'auth/no-user': 'No user.',
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
      signupOrLogin(Account),
    );

    // login
    router.post('/' + endpoint, ...middlewares,
      signupOrLogin(Account),
    );

    // get info
    router.get('/' + endpoint, ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      return res.success(user.getInfo());
    });

    // update profile
    router.patch('/' + endpoint, ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      const { profile } = req.body;
      return res.success(
        user.updateProfile(profile).save()
        .getInfo(),
      );
    });

    // logout (renew refresh token to revoke access)
    router.delete('/' + endpoint, ...middlewares, userMdlware,
    (req, res) => {
      const { user } = req.data as { user: User };
      user.setRefreshToken().save(); // new refresh token
      return res.success({ acknowledged: true });
    });

    /**
     * token
     */
    // exchange the refresh token for a new id token
    router.get('/' + endpoint + '/token', ...middlewares,
    (req, res) => {
      const { refreshToken, type = 'id' } = req.query;
      const user = Account.getUserByRefreshToken(refreshToken);
      if (!refreshToken || !user) {
        return res.error('auth/invalid-token');
      }
      let response: any;
      if (type === 'id') {
        response = { idToken: user.getIdToken() };
      }
      return res.success(response);
    });

    /**
     * oob
     */
    // request emails
    router.put('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { mode, email } = req.body;
      const user = Account.getUser({ email });
      const modes = ['resetPassword', 'verifyEmail'];
      if (!!user && !!modes[mode]) {
        const userData = user.setOob(mode).getData();
        if (mode === 'resetPassword') {
          Oob.sendPasswordResetEmail(userData);
        } else if (mode === 'verifyEmail') {
          Oob.sendEmailVerificationEmail(userData);
        }
      }
      return res.success({ acknowledged: true });
    });

    // check oob code
    router.get('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { oobCode, mode } = req.query;
      const user = Account.getUserByOobCode(oobCode);
      if (!!user) {
        const { email, oobMode } = user.getData();
        // also check mode if required
        if (!mode || (!!mode && mode === oobMode)) {
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
      return res.error('auth/invalid-oob');
    });

    // handler
    router.post('/' + endpoint + '/oob', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.body;
      const user = Account.getUserByOobCode(oobCode);
      if (!!user) {
        const { oobMode } = user.getData();
        if (mode === oobMode) { // check mode

          // reset password
          if (mode === 'resetPassword') {
            const { password, pwdrepeat } = req.body;
            if (password === pwdrepeat) { // validate password
              user.setPassword(password)
                .setRefreshToken() // revoke current access
                .setOob() // revoke oob code
                .save();
            }
          }

          // verify email
          else if (mode === 'verifyEmail') {
            user.confirmEmail()
              .save();
          }

          // done
          return res.success({ acknowledged: true });
        }
      }
      return res.error('auth/invalid-oob');
    });

    /**
     * default auth actions
     */
    // facing page
    router.get('/' + endpoint + '/action', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.query;
      const user = Account.getUserByOobCode(oobCode);
      if (!!user) {
        const { email, oobMode } = user.getData();
        if (mode === oobMode) { // check mode

          // reset password
          if (mode === 'resetPassword') {
            return res.html(htmlPage(
              `<h1>Reset password</h1>
              <p>Reset your acccount password of <strong>${email}</strong>:</p>
              <form method="POST" action="">
                <input type="text" name="password" placeholder="New password" />
                <input type="text" name="pwdrepeat" placeholder="Repeat password" />
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
        <p>Invalid inputs.</p>`,
      ));
    });

    // handler
    router.post('/' + endpoint + '/action', ...middlewares,
    (req, res) => {
      const { mode, oobCode } = req.query;
      const user = Account.getUserByOobCode(oobCode);
      if (!!user) {
        const { oobMode } = user.getData();
        if (mode === oobMode) { // check mode

          // reset password
          if (mode === 'resetPassword') {
            const { password, pwdrepeat } = req.body;
            if (password === pwdrepeat) { // validate password
              user.setPassword(password)
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
        <p>Invalid inputs.</p>`,
      ));
    });

    /**
     * cancel account
     */
    router.delete('/' + endpoint + '/cancel', ...middlewares, userMdlware,
    (req, res) => {
      const { refreshToken } = req.body;
      const { user } = req.data as { user: User };
      const { refreshToken: userRefreshToken } = user.getData();
      if (!!refreshToken && refreshToken === userRefreshToken) {
        user.delete(); // delete
        return res.success({ acknowledged: true });
      }
      return res.error('auth/invalid-token');
    });

  };
}

function signupOrLogin(Account: AccountService): RouteHandler {
  return (req, res) => {
    const { email, password = '', customToken, offlineAccess = false } = req.body;
    let user: User;

    // get user, new or existing if correct password
    if (!!customToken) {
      user = Account.getUserByCustomToken(customToken);
    } else {
      if (!validEmail(email)) {
        return res.error('auth/invalid-email');
      }
      if (password.length < 7) {
        return res.error('auth/invalid-password');
      }
      user = Account.getUserByEmailAndPassword(email, password);
    }

    // no user
    if (!user) {
      return res.error('auth/no-user');
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
