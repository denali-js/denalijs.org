import Component from '@ember/component';
import { or, empty } from '@ember/object/computed';

export default Component.extend({

  searchTermEmpty: empty('searchTerm'),
  hasResults: or('category', 'searchTerm'),

});
