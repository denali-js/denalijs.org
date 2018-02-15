import ENV from 'denali/config/environment';
import { startCase } from 'lodash';

export default function() {

  this.logging = true;
  this.urlPrefix = ENV.api.host;
  this.namespace = ENV.api.namespace;

  this.get('/addons', function({ addons }, { queryParams }) {
    return addons.where((addon) => {
      let matches = true;
      if (queryParams['filter[featured]']) {
        matches = matches && addon.featured;
      }
      if (queryParams['filter[category]']) {
        let category = queryParams['filter[category]'];
        matches = matches && (
          addon.category === category ||
          category === 'all'
        );
      }
      if (queryParams['filter[search]']) {
        let search = queryParams['filter[search]'];
        matches = matches && (
          addon.name.includes(search) ||
          addon.description.includes(search)
        );
      }
      return matches;
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

  this.get('/posts');
  this.get('/posts/:id');

  this.passthrough('https://api.mapbox.com/**');

}
