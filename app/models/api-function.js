import Ember from 'ember';
import DS from 'ember-data';

const computed = Ember.computed;
const attr = DS.attr;
const belongsTo = DS.belongsTo;

const ApiClass = DS.Model.extend({

  name: attr('string'),
  pkg: attr('string'),
  description: attr('string'),
  file: attr('string'),
  line: attr('number'),
  deprecated: attr('boolean'),
  internal: attr('boolean'),
  since: attr('string'),
  methods: attr(),
  properties: attr(),

  api: belongsTo('api'),

  shortDisplayName: computed('name', function() {
    return this.get('name') + '()';
  })

});

ApiClass.reopenClass({
  idFor(version, pkg, name) {
    return `${ version.id || version }:${ pkg }:${ name }`;
  }
});

export default ApiClass;