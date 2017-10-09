import ENV from 'denali/config/environment';

export default function() {

  this.urlPrefix = ENV.api.host;
  this.namespace = ENV.api.namespace;

  this.get('/addons', function({ addons }, { queryParams }) {
    if (queryParams['filter[featured]']) {
      return addons.where((addon) => addon.featured); 
    }
    let query = queryParams.query;
    return addons.where((addon) => {
      return (addon.name.indexOf(query) > -1) ||
             (addon.description.indexOf(query) > -1);
    });
  });

  this.get('/addons/:name', function({ addons }, { params }) {
    return addons.findBy((addon) => addon.name === params.name);
  });

}
