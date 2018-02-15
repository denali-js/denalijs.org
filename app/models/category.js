import Model from 'ember-data/model';
import DS from 'ember-data';

const attr = DS.attr;

export default Model.extend({

  name: attr('string')

});
