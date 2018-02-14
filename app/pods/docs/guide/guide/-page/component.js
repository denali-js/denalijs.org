import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({

  router: service(),

  click(e) {
    if (this.$(e.target).is('.api-peek')) {
      e.preventDefault();
      this.get('router').transitionTo('docs.apis.api', 'stable', this.$(e.target).data('api-id'));
    }
  }

});
