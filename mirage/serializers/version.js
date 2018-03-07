import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: [ 'addon' ],
  serializeIds: 'always',
});