import Ember from 'ember';
import Guide from 'denali/models/guide';

export default Ember.Route.extend({

  model({ slug }) {
    let version = this.modelFor('docs');
    return this.store.findRecord('guide', Guide.idFor(version, slug));
  }

})

