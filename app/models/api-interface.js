import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import DS from 'ember-data';

const attr = DS.attr;
const belongsTo = DS.belongsTo;

const ApiInterface = DS.Model.extend({

  name: attr('string'),
  pkg: attr('string'),
  description: attr('string'),
  file: attr('string'),
  line: attr('number'),
  deprecated: attr('boolean'),
  internal: attr('boolean'),
  since: attr('string'),
  parentClass: attr('string'),
  parentInterface: attr('string'),

  api: belongsTo('api'),

  shortDisplayName: alias('name'),

  slug: computed(function() {
    let pkg = this.get('pkg');
    let name = this.get('name');
    return [ 'interface', pkg, name ].join('/');
  })

});

ApiInterface.reopenClass({
  idFor(version, pkg, name) {
    return `${ version.id || version }:${ pkg }:${ name }`;
  }
});

export default ApiInterface;