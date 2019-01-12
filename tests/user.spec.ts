import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { TokenService, User } from '../src/public_api';
import { Auth } from './test';

describe('User service', () => {

    const userData = {
        '#': 1,
        uid: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: 'xxx@xxx.com',
        password: 'xxx',
        refreshToken: 'xxx',
    };
    let user: User;

    let updateUserStub: sinon.SinonStub;
    let deleteUserStub: sinon.SinonStub;
    let signIdTokenStub: sinon.SinonStub;

    beforeEach(() => {
        user = Auth.Account.user({ ... userData, providerId: 'password' });
        // @ts-ignore
        updateUserStub = sinon.stub(user.Database, 'updateUser');
        // @ts-ignore
        deleteUserStub = sinon.stub(user.Database, 'deleteUser');
        // @ts-ignore
        signIdTokenStub = sinon.stub(user.Token, 'signIdToken');
    });

    afterEach(() => {
        updateUserStub.restore();
        deleteUserStub.restore();
        signIdTokenStub.restore();
    });

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
        expect(result['#']).to.equal(1);
        expect(result.uid).to.equal('xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        expect(result.email).to.equal('xxx@xxx.com');
        expect(result.password).to.equal(undefined);
        expect(result.oobCode).to.equal(undefined);
    });

    it('#getProvider', () => {
        const result = user.getProvider();
        expect(result.providerId).to.equal('password');
        expect(result.providerData).to.equal(undefined);
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

    it('#setProviderData', () => {
        expect(user.getData().providerData).to.equal(undefined); // before
        const result = user.setProviderData({ a: 1 }).getData();
        expect(result.providerData).to.eql({ a: 1 });
    });

    it('#setlastLogin', () => {
        expect(user.getData().lastLogin).to.equal(undefined); // before
        const result = user.setlastLogin().getData();
        expect(!!result.lastLogin && typeof result.lastLogin === 'number').to.equal(true);
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
        let id: number;
        deleteUserStub.callsFake(_id => { id = _id; });
        const result = user.delete();
        expect(id).to.equal(1);
        expect(result instanceof User).to.equal(true);
    });

    it('#save', () => {
        let data: any;
        updateUserStub.callsFake((id, userData) => { data = { id, userData }; });
        const result = user.save();
        expect(data.id).to.equal(1);
        expect(data.userData.email).to.equal('xxx@xxx.com');
        expect(result instanceof User).to.equal(true);
    });

});
