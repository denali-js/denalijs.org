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
    let filter;
    if (params.search) {
      filter = { search: params.search };
    } else if (params.category) {
      filter = { category: params.category };
    } else {
      filter = { featured: true };
    }
    return this.store.query('addon', { filter });
  }

})
