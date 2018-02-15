import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({

  search: task(function * (searchTerm) {
    if (searchTerm && searchTerm.trim().length > 0 && searchTerm !== this.get('searchTerm')) {
      yield timeout(200);
      searchTerm = searchTerm.trim();
      this.set('searchTerm', searchTerm);
    } else {
      this.set('searchTerm', null);
    }
  }).restartable()

});
