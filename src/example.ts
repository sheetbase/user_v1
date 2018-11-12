import * as UserPassword from './public_api';

const database = {
   id: '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI',
};
const apiKey = 'the_api_key';
const encryptionKey = 'xxx';

function load_() {
   return UserPassword.userPassword({ database, apiKey, encryptionKey });
}

export function example1(): void {
   const UserPassword = load_();
   const profile = UserPassword.Account.create('test@mail.com', 'test0123');
   Logger.log(profile);
}

export { database, apiKey, encryptionKey };