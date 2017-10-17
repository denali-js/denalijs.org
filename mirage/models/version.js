import { Model, belongsTo, hasMany } from 'ember-cli-mirage';

export default Model.extend({
  guides: hasMany('guide'),
  api: belongsTo('api'),
});
