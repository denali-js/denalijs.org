import Ember from 'ember';
import { groupBy } from 'lodash';

const computed = Ember.computed;

export default Ember.Component.extend({

  guidesByGroup: computed('guides', function() {
    let guides = this.get('guides');
    guides = guides.sortBy('order');
    return groupBy(guides.toArray(), (g) => g.get('group'));
  })

});

