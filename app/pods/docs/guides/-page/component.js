import Component from '@ember/component';
import { computed } from '@ember/object';
import { groupBy } from 'lodash';

export default Component.extend({

  guidesByGroup: computed('guides', function() {
    let guides = this.get('guides');
    guides = guides.sortBy('order');
    return groupBy(guides.toArray(), (g) => g.get('group'));
  })

});

