import Controller from '@ember/controller';

export default Controller.extend({

  queryParams: [ 'search', 'category' ],

  search: null,
  category: 'all',

})