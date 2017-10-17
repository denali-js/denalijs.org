import Ember from 'ember';
import DS from 'ember-data';

const attr = DS.attr;
const hasMany = DS.hasMany;
const belongsTo = DS.belongsTo;
const computed = Ember.computed;

export default DS.Model.extend({

  semver: attr('string'),
  channel: attr('string'),
  publishedAt: attr('date'),
  name: attr('string'),

  guides: hasMany('guide'),
  api: belongsTo('api'),

  displayName: computed('semver', 'channel', 'name', function() {
    let { semver, channel, name } = this.getProperties('semver', 'channel', 'name');
    let displayName = `v${ semver }`;
    if (name) {
      displayName += ` ${ name }`;
    }
    if (channel) {
      displayName += ` (${ channel })`;
    }
    return displayName;
  })

});
