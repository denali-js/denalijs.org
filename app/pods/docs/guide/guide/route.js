import Route from '@ember/routing/route';
import Guide from 'denali/models/guide';

export default Route.extend({

  model({ slug }) {
    let version = this.modelFor('docs');
    return this.store.findRecord('guide', Guide.idFor(version, slug));
  }

})

