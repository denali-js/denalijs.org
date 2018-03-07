import DS from 'ember-data';
import fetch from 'fetch';

const attr = DS.attr;
const belongsTo = DS.belongsTo;

export default DS.Model.extend({

  version: attr('string'),
  displayName: attr('string'),
  compiledAt: attr('date'),
  docsUrl: attr('string'),

  addon: belongsTo('addon'),

  getDocs() {
    return fetch(this.get('docsUrl')).then((result) =>  result.json());
  }

});
