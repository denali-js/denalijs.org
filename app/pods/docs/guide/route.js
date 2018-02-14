import Route from '@ember/routing/route';

export default Route.extend({

  model({ slug }) {
    let { doc, version } = this.modelFor('docs');
    return { doc, version, slug };
  }

})

