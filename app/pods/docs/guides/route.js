import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({

  model() {
    let version = this.modelFor('docs');
    return hash({
      version,
      guides: version.get('guides')
    });
  }

});
