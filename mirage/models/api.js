import { Model, belongsTo, hasMany } from 'ember-cli-mirage';

export default Model.extend({
  version: belongsTo('version'),
  classes: hasMany('api-class'),
  functions: hasMany('api-function'),
  interfaces: hasMany('api-interfaces')
});
