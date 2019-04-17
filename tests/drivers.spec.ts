import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { sheetsDriver } from '../src/public_api';

const SheetsDriver = sheetsDriver({
  item: () => null,
  add: () => null,
  update: () => null,
  remove: () => null,
} as any);

let itemStub: sinon.SinonStub;
let addStub: sinon.SinonStub;
let updateStub: sinon.SinonStub;
let removeStub: sinon.SinonStub;

function before() {
  // @ts-ignore
  itemStub = sinon.stub(SheetsDriver.Sheets, 'item');
  // @ts-ignore
  addStub = sinon.stub(SheetsDriver.Sheets, 'add');
  // @ts-ignore
  updateStub = sinon.stub(SheetsDriver.Sheets, 'update');
  // @ts-ignore
  removeStub = sinon.stub(SheetsDriver.Sheets, 'remove');
}

function after() {
  itemStub.restore();
  addStub.restore();
  updateStub.restore();
  removeStub.restore();
}

describe('SheetsDriver', () => {

  beforeEach(before);
  afterEach(after);

  it('correct properties', () => {
    // @ts-ignore
    const Sheets = SheetsDriver.Sheets;
    expect(
      !!Sheets &&
      !!Sheets.item &&
      !!Sheets.add &&
      !!Sheets.update &&
      !!Sheets.remove,
    ).to.equal(true);
  });

  it('#getUser', () => {
    itemStub.callsFake((...args) => args);

    const result1 = SheetsDriver.getUser('xxx');
    const result2 = SheetsDriver.getUser({ email: 'xxx@gmail.com' });
    expect(result1).to.eql(['users', 'xxx']);
    expect(result2).to.eql(['users', { email: 'xxx@gmail.com' }]);
  });

  it('#addUser', () => {
    let addInput: any;
    addStub.callsFake((...args) => addInput = args);

    SheetsDriver.addUser(null, { uid: 'xxx' });
    expect(addInput).to.eql([ 'users', null, { uid: 'xxx' } ]);
  });

  it('#updateUser', () => {
    let updateInput: any;
    updateStub.callsFake((...args) => updateInput = args);

    SheetsDriver.updateUser('xxx', { uid: 'xxx', displayName: 'xxx' });
    expect(updateInput).to.eql([ 'users', 'xxx', { uid: 'xxx', displayName: 'xxx' } ]);
  });

  it('#deleteUser', () => {
    let removeInput: any;
    removeStub.callsFake((...args) => removeInput = args);

    SheetsDriver.deleteUser('xxx');
    expect(removeInput).to.eql([ 'users', 'xxx' ]);
  });

});
