import DS from 'ember-data';

const attr = DS.attr;
const belongsTo = DS.belongsTo;

export default DS.Model.extend({

  version: attr('string'),
  displayName: attr('string'),
  compiledAt: attr('date'),
  addon: belongsTo('addon'),
  doc: belongsTo('doc')

});
