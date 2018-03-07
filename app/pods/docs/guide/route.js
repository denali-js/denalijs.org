import Route from '@ember/routing/route';

export default Route.extend({

  model({ slug }) {
    let { docs, version } = this.modelFor('docs');
    return { docs, version, slug };
  }

})

