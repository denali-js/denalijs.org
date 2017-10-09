import { moduleForModel, test } from 'ember-qunit';

moduleForModel('addon', 'Unit | Model | addon', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
