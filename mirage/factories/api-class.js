import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  id() { return `${ this._versionId }:${ this.pkg }:${ this.name }`; },
  name: null,
  pkg: null,
  description: null,
  file: null,
  line: null,
  deprecated: null,
  internal: null,
  since: null,
  parentClass: null,

  staticMethods: null,
  staticProperties: null,
  methods: null,
  properties: null
});
