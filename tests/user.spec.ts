import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { TokenService, User } from '../src/public_api';
import { Auth } from './index.spec';

const userData = {
  '#': 1,
  uid: 'xxx',
  email: 'xxx@xxx.com',
  password: 'xxx',
  refreshToken: 'xxx',
};

let user: User;

let updateUserStub: sinon.SinonStub;
let deleteUserStub: sinon.SinonStub;
let signIdTokenStub: sinon.SinonStub;

function before() {
  user = Auth.Account.user({ ... userData, providerId: 'password' });
  // @ts-ignore
  updateUserStub = sinon.stub(user.Database, 'updateUser');
  // @ts-ignore
  deleteUserStub = sinon.stub(user.Database, 'deleteUser');
  // @ts-ignore
  signIdTokenStub = sinon.stub(user.Token, 'signIdToken');
}

function after() {
  updateUserStub.restore();
  deleteUserStub.restore();
  signIdTokenStub.restore();
}

describe('User service', () => {

  beforeEach(before);
  afterEach(after);

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
    expect(result).to.eql({ ... userData, providerId: 'password' });
  });

  it('#getInfo', () => {
    const result: any = user.getInfo();
    expect(result.uid).to.equal('xxx');
    expect(result.email).to.equal('xxx@xxx.com');
    expect(result.password).to.equal(undefined);
    expect(result.oobCode).to.equal(undefined);
  });

  it('#getProvider', () => {
    const result = user.getProvider();
    expect(result.providerId).to.equal('password');
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
      password: 'xxx2', // ignore
      displayName: 'John', // access
    } as any).getData();
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
    expect(!!result.lastLogin && typeof result.lastLogin === 'string').to.equal(true);
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

  it('#setPhoneNumber', () => {
    expect(user.getData().phoneNumber).to.equal(undefined); // before
    const result = user.setPhoneNumber('xxx').getData();
    expect(result.phoneNumber).to.equal('xxx');
  });

  it('#setOob', () => {
    global['Utilities'] = {
      getUuid: () => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    };

    expect(user.getData().oobCode).to.equal(undefined); // before
    expect(user.getData().oobMode).to.equal(undefined); // before
    expect(user.getData().oobTimestamp).to.equal(undefined); // before
    const result1 = user.setOob().getData();
    const { oobMode: mode1 } = result1;
    const result2 = user.setOob('resetPassword').getData();
    const { oobMode: mode2 } = result2;
    const result3 = user.setOob('xxx' as any).getData(); // invalid mode
    const { oobMode: mode3 } = result3;
    expect(result1.oobCode.length === 64).to.equal(true, 'code');
    expect(typeof result1.oobTimestamp === 'number').to.equal(true, 'timestamp');
    expect(mode1).to.equal('none');
    expect(mode2).to.equal('resetPassword');
    expect(mode3).to.equal('none');
  });

  it('#setRefreshToken', () => {
    expect(user.getData().refreshToken).to.equal('xxx'); // before
    expect(user.getData().tokenTimestamp).to.equal(undefined); // before
    const result = user.setRefreshToken().getData();
    expect(result.refreshToken.length === 64).to.equal(true, 'token');
    expect(typeof result.tokenTimestamp === 'number').to.equal(true, 'timestamp');
  });

  it('#delete', () => {
    let uid: number;
    deleteUserStub.callsFake(_uid => { uid = _uid; });
    const result = user.delete();
    expect(uid).to.equal('xxx');
    expect(result instanceof User).to.equal(true);
  });

  it('#save', () => {
    let data: any;
    updateUserStub.callsFake((uid, userData) => { data = { uid, userData }; });
    const result = user.save();
    expect(data.uid).to.equal('xxx');
    expect(data.userData.email).to.equal('xxx@xxx.com');
    expect(result instanceof User).to.equal(true);
  });

});
