import DS from 'ember-data';

const belongsTo = DS.belongsTo;
const hasMany = DS.hasMany;

export default DS.Model.extend({

  version: belongsTo('version'),

  classes: hasMany('api-class'),
  functions: hasMany('api-function'),
  interfaces: hasMany('api-interface')

});
