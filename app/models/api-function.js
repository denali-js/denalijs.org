import { computed } from '@ember/object';
import DS from 'ember-data';

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
  signatures: attr(),

  api: belongsTo('api'),

  shortDisplayName: computed('name', function() {
    return this.get('name') + '()';
  }),

  slug: computed(function() {
    let pkg = this.get('pkg');
    let name = this.get('name');
    return [ 'function', pkg, name ].join('/');
  })

});

ApiClass.reopenClass({
  idFor(version, pkg, name) {
    return `${ version.id || version }:${ pkg }:${ name }`;
  }
});

export default ApiClass;