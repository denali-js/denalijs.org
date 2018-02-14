import Model from 'ember-data/model';
import DS from 'ember-data';
import { belongsTo } from 'ember-data/relationships';

const attr = DS.attr;

export default Model.extend({

  api: attr(),
  pages: attr(),

  version: belongsTo('version')

});
