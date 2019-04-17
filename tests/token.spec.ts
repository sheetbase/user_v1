import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { Auth } from './index.spec';

const { Token } = Auth;

let signStub: sinon.SinonStub;
let decodeStub: sinon.SinonStub;

function before() {
  signStub = sinon.stub(Token, 'sign');
  decodeStub = sinon.stub(Token, 'decode');
}

function after() {
  signStub.restore();
  decodeStub.restore();
}

describe('Token service', () => {

  beforeEach(before);
  afterEach(after);

  it('correct properties', () => {
    // @ts-ignore
    const encryptionSecret = Token.encryptionSecret;
    expect(typeof encryptionSecret === 'string').to.equal(true);
  });

  it('#sign', () => {
    signStub.restore();

    const result = Token.sign({ uid: 'xxx', email: 'xxx@gmail.com' });
    expect(result).to.contain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('#signIdToken', () => {
    signStub.callsFake((payload) => payload);

    const user = {
      uid: 'xxx',
      email: 'xxx@gmail.com',
      claims: {
        a: 1,
        b: 2,
      },
    };
    const result = Token.signIdToken(user);
    expect(result).to.eql({
      a: 1,
      b: 2,
      uid: 'xxx',
      sub: 'xxx@gmail.com',
      tty: 'ID',
    });
  });

  it('#decode', () => {
    signStub.restore();
    decodeStub.restore();

    const payload = { a: 1, b: 2 };
    // tslint:disable-next-line:max-line-length
    const result1 = Token.decode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4eHgiLCJlbWFpbCI6Inh4eEBnbWFpbC5jb20iLCJpc3MiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJhdWQiOiJodHRwczovL3NoZWV0YmFzZWFwcC5jb20iLCJpYXQiOjE1NDY2MTE0NTUsImV4cCI6MTU0NjYxNTA1NX0.csU-Jc98S8RrF7WywBdlT60dbkb9WoGbQTcjdtlbGx8');
    const result2 = Token.decode(Token.sign(payload) + 'x');
    const result3 = Token.decode(Token.sign(payload));

    expect(result1).to.equal(null, 'expired');
    expect(result2).to.equal(null, 'invalid signature');
    expect(result3.aud).to.equal('https://sheetbaseapp.com');
    expect(result3.iss).to.equal('https://sheetbaseapp.com');
    expect(result3.a).to.equal(1);
    expect(result3.b).to.equal(2);
  });

  it('#decode (with ands)', () => {
    signStub.restore();
    decodeStub.restore();

    const ands = { tty: 'ID' };
    const result1 = Token.decode(Token.sign({}) + 'x', ands);
    const result2 = Token.decode(Token.sign({}), ands);
    const result3 = Token.decode(Token.sign({ tty: 'XXX' }), ands);
    const result4 = Token.decode(Token.signIdToken({ uid: 'xxx' }), ands);
    expect(result1).to.equal(null, 'invalid');
    expect(result2).to.equal(null, 'no tty');
    expect(result3).to.equal(null, 'wrong values');
    expect(!!result4).to.equal(true);
    expect(result4.tty).to.equal('ID');
  });

  it('#decodeIdToken', () => {
    decodeStub.onFirstCall().returns({ tty: 'ID' });

    const result = Token.decodeIdToken('xxx');
    expect(!!result).to.equal(true);
    expect(result.tty).to.equal('ID');
  });

  it('#decodeCustomToken', () => {
    decodeStub.onFirstCall().returns({ tty: 'CUSTOM' });

    const result = Token.decodeCustomToken('xxx');
    expect(!!result).to.equal(true);
    expect(result.tty).to.equal('CUSTOM');
  });

});
