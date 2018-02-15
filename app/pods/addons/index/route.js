import RSVP from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({

  queryParams: {
    category: {
      refreshModel: true
    },
    search: {
      refreshModel: true
    }
  },

  model(params) {
    if (!params.search && !params.category) {
      let all = this.store.findAll('addon');
      return RSVP.hash({
        featured: all.then((addons) => addons.filterBy('featured')),
        query: all
      });
    }

    let filter = {};
    if (params.search) {
      filter.search = params.search;
    }
    if (params.category) {
      filter.category = params.category;
    }
    return RSVP.hash({
      featured: this.store.query('addon', { filter: { featured: true } }),
      query: this.store.query('addon', { filter })
    });
  }

})
