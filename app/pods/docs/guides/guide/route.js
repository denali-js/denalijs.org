import Ember from 'ember';

export default Ember.Route.extend({

  model({ slug }) {
    let version = this.modelFor('docs');
    return version.get('guides').then((guides) => {
      return guides.findBy('slug', slug);
    });
  }

})

