import { computed } from '@ember/object';
import DS from 'ember-data';
import { truncate } from 'lodash';

const attr = DS.attr;

export default DS.Model.extend({

  name: attr('string'),
  description: attr('string'),
  featured: attr('boolean'),
  graphic: attr('string'),

  truncatedDescription: computed('description', function() {
    return truncate(this.get('description'), { length: 200 });
  })

});
