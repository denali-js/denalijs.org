import Ember from 'ember';
import DS from 'ember-data';

const attr = DS.attr;
const belongsTo = DS.belongsTo;
const computed = Ember.computed;
const { alias } = Ember.computed;

const ApiClass = DS.Model.extend({

  name: attr('string'),
  pkg: attr('string'),
  description: attr('string'),
  file: attr('string'),
  line: attr('number'),
  deprecated: attr('boolean'),
  internal: attr('boolean'),
  since: attr('string'),
  parentClass: attr('string'),

  staticMethods: attr(),
  staticProperties: attr(),
  methods: attr(),
  properties: attr(),

  api: belongsTo('api'),

  shortDisplayName: alias('name'),

  slug: computed(function() {
    let pkg = this.get('pkg');
    let name = this.get('name');
    return [ 'class', pkg, name ].join('/');
  })

});

ApiClass.reopenClass({
  idFor(version, pkg, name) {
    return `${ version.id || version }:${ pkg }:${ name }`;
  }
});

export default ApiClass;