import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  // eslint-disable-next-line ember/avoid-leaking-state-in-ember-objects
  include: [ 'addon' ],
  serializeIds: 'always',
});