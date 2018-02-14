import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: [ 'version' ] //eslint-disable-line
});
