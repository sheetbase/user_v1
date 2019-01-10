import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { sheetsDriver } from '../src/public_api';

describe('SheetsDriver', () => {

    const SheetsDriver = sheetsDriver({
        item: () => null,
        update: () => null,
        delete: () => null,
    } as any);

    let itemStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;
    let deleteStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        itemStub = sinon.stub(SheetsDriver.sheets, 'item');
        // @ts-ignore
        updateStub = sinon.stub(SheetsDriver.sheets, 'update');
        // @ts-ignore
        deleteStub = sinon.stub(SheetsDriver.sheets, 'delete');
    });

    afterEach(() => {
        itemStub.restore();
        updateStub.restore();
        deleteStub.restore();
    });

    it('correct properties', () => {
        // @ts-ignore
        const sheets = SheetsDriver.sheets;
        expect(
            !!sheets &&
            !!sheets.item &&
            !!sheets.update &&
            !!sheets.delete,
        ).to.equal(true);
    });

    it('#getUser', () => {
        itemStub.callsFake((table, idOrCond) => ({ table, idOrCond }));

        const result1 = SheetsDriver.getUser(1);
        const result2 = SheetsDriver.getUser({ email: 'xxx@gmail.com' });
        expect(result1).to.eql({
            table: 'users',
            idOrCond: 1,
        });
        expect(result2).to.eql({
            table: 'users',
            idOrCond: { email: 'xxx@gmail.com' },
        });
    });

    it('#addUser', () => {
        let result: any;
        updateStub.callsFake((table, user) => { result = { table, user }; });

        SheetsDriver.addUser({ uid: 'abc' });
        expect(result).to.eql({
            table: 'users',
            user: { uid: 'abc' },
        });
    });

    it('#updateUser', () => {
        let result: any;
        updateStub.callsFake((table, data, idOrCond) => { result = { table, data, idOrCond }; });

        SheetsDriver.updateUser(1, { displayName: 'xxx' });
        expect(result).to.eql({
            table: 'users',
            data: { displayName: 'xxx' },
            idOrCond: 1,
        });
    });

    it('#deleteUser', () => {
        let result: any;
        deleteStub.callsFake((table, idOrCond) => { result = { table, idOrCond }; });

        SheetsDriver.deleteUser(1);
        expect(result).to.eql({
            table: 'users',
            idOrCond: 1,
        });
    });

});
