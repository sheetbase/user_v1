import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { TokenService, User } from '../src/public_api';
import { Auth } from './index.spec';

const { Account } = Auth;

let dbGetUserStub: sinon.SinonStub;
let decodeIdTokenStub: sinon.SinonStub;
let userStub: sinon.SinonStub;
let getUserStub: sinon.SinonStub;

function before() {
  // @ts-ignore
  dbGetUserStub = sinon.stub(Account.Database, 'getUser');
  // @ts-ignore
  decodeIdTokenStub = sinon.stub(Account.Token, 'decodeIdToken');
  userStub = sinon.stub(Account, 'user');
  getUserStub = sinon.stub(Account, 'getUser');
}

function after() {
  dbGetUserStub.restore();
  decodeIdTokenStub.restore();
  userStub.restore();
  getUserStub.restore();
}

describe('Account service', () => {

  beforeEach(before);
  afterEach(after);

  it('correct properties', () => {
    // @ts-ignore
    const Database = Account.Database;
    // @ts-ignore
    const Token = Account.Token;
    expect(
      !!Database &&
      !!Database.getUser &&
      !!Database.addUser &&
      !!Database.updateUser &&
      !!Database.deleteUser,
    ).to.equal(true);
    expect(!!Token && Token instanceof TokenService).to.equal(true);
  });

  it('#user', () => {
    userStub.restore();

    const result = Account.user({ uid: 'xxx' });
    expect(result instanceof User).to.equal(true);
  });

  it('#getUser', () => {
    userStub.restore();
    getUserStub.restore();
    dbGetUserStub.onFirstCall().returns(null);
    dbGetUserStub.onSecondCall().returns({});

    const result1 = Account.getUser('xxx');
    const result2 = Account.getUser('xxx2');
    expect(result1).to.equal(null);
    expect(!!result2 && result2 instanceof User).to.equal(true);
  });

  it('#isUser', () => {
    userStub.restore();
    getUserStub.onFirstCall().returns(null);
    getUserStub.onSecondCall().returns(
      Account.user({ uid: 'xxx' }), // a valid user instance
    );

    const result1 = Account.isUser('xxx');
    const result2 = Account.isUser('xxx2');
    expect(result1).to.equal(false);
    expect(result2).to.equal(true);
  });

  it('#getUserByEmailAndPassword (new user)', () => {
    userStub.callsFake((newUser) => ({
      setEmail: () => ({
        setPassword: () => ({
          setRefreshToken: () => newUser,
        }),
      }),
    }));
    getUserStub.onFirstCall().returns(null); // user not exists

    const result: any = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
    expect(
      typeof result.uid === 'string' && result.uid.length === 28,
    ).to.equal(true, 'uid');
    expect(result.providerId).to.equal('password');
    expect(typeof result.createdAt === 'string').to.equal(true, 'created at');
    expect(result.isNewUser).to.equal(true, 'is new user');
  });

  it('#getUserByEmailAndPassword (existing user, incorrect password)', () => {
    userStub.restore();
    getUserStub.onFirstCall().returns(
      Account.user({ uid: 'xxx2', password: 'xxx2-hased' }), // user exists with pwd = 'xxx2'
    );

    const result = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByEmailAndPassword (existing user, correct password)', () => {
    userStub.restore();
    getUserStub.onFirstCall().returns(
      Account.user({
        uid: 'xxx',
        password: 'b7fb217694ae2d305e766608d250f797daa984e4ac4b5fa638a729be352f2fcd',
      }), // user exists with pwd = 'xxx'
    );

    const result = Account.getUserByEmailAndPassword('xxx@xxx.xxx', 'xxx');
    expect(!!result && result instanceof User).to.equal(true);
  });

  it('#getUserByCustomToken (invalid token)', () => {
    decodeIdTokenStub.onFirstCall().returns(null);

    const result = Account.getUserByCustomToken('xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByCustomToken (new user)', () => {
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    userStub.callsFake((newUser) => ({
      setRefreshToken: () => newUser,
    }));
    getUserStub.onFirstCall().returns(null); // user not exists

    const result: any = Account.getUserByCustomToken('xxx');
    expect(result.uid).to.equal('xxx');
    expect(result.providerId).to.equal('custom');
    expect(typeof result.createdAt === 'string').to.equal(true, 'created at');
    expect(result.isNewUser).to.equal(true, 'is new user');
  });

  it('#getUserByCustomToken (existing user)', () => {
    userStub.restore();
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    getUserStub.onFirstCall().returns(
      Account.user({ uid: 'xxx' }), // user exists
    );

    const result = Account.getUserByCustomToken('xxx');
    expect(!!result && result instanceof User).to.equal(true);
  });

  it('#getUserByIdToken (invalid token)', () => {
    decodeIdTokenStub.onFirstCall().returns(null);

    const result = Account.getUserByIdToken('xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByIdToken (valid token, no user)', () => {
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    getUserStub.onFirstCall().returns(null); // user not exists

    const result = Account.getUserByIdToken('xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByIdToken (has user)', () => {
    userStub.restore();
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    getUserStub.onFirstCall().returns(
      Account.user({ uid: 'xxx' }), // user exists
    );

    const result = Account.getUserByIdToken('xxx');
    expect(!!result && result instanceof User).to.equal(true);
  });

  it('#getUserByOobCode (invalid token)', () => {
    decodeIdTokenStub.onFirstCall().returns(null);

    const result = Account.getUserByOobCode('xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByOobCode (expired)', () => {
    userStub.restore();
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    getUserStub.onFirstCall().returns(
      Account.user({ uid: 'xxx', oobTimestamp: 0 }),
    );

    const result = Account.getUserByOobCode('xxx');
    expect(result).to.equal(null);
  });

  it('#getUserByOobCode', () => {
    userStub.restore();
    decodeIdTokenStub.onFirstCall().returns({ uid: 'xxx' });
    getUserStub.onFirstCall().returns(
      Account.user({ uid: 'xxx', oobTimestamp: (new Date()).getTime() }),
    );

    const result = Account.getUserByOobCode('xxx');
    expect(!!result && result instanceof User).to.equal(true);
  });

  it('#getUserByRefreshToken', () => {
    getUserStub.callsFake(finder => finder);

    const result = Account.getUserByRefreshToken('xxx');
    expect(result).to.eql({ refreshToken: 'xxx' });
  });

  it('#isValidPassword', () => {
    const result1 = Account.isValidPassword('xxx');
    const result2 = Account.isValidPassword('1234567');
    expect(result1).to.equal(false);
    expect(result2).to.equal(true);
  });

});
