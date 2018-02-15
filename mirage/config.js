import ENV from 'denali/config/environment';
import { startCase } from 'lodash';

export default function() {

  this.logging = true;
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
  this.get('/addons/:id');
  this.get('/addons/:id/versions', function({ addons }, { params }) {
    let addon = addons.find(params.id);
    return addon.versions;
  });
  this.get('/versions/:id');
  this.get('/versions/:id/doc', function({ versions }, { params }) {
    let version = versions.find(params.id);
    return version.doc;
  });

  this.get('/categories', function({ addons }) {
    let allCategories = addons.all().models.map((a) => a.category);
    let uniqueCategories = [ ...new Set(allCategories) ];
    return {
      data: uniqueCategories.map((category) => {
        return {
          type: 'category',
          id: category,
          attributes: { name: startCase(category) }
        };
      })
    };
  });

  this.passthrough('https://api.mapbox.com/**');

}
