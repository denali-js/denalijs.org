import { Model,belongsTo } from 'ember-cli-mirage';

export default Model.extend({
  addon: belongsTo('addon'),
  doc: belongsTo('doc')
});

