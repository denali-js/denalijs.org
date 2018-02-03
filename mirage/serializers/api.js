import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: [ 'classes', 'functions', 'interfaces' ] //eslint-disable-line
});
