import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: [ 'guides', 'api' ] //eslint-disable-line

});
