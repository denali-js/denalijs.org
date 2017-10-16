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

  this.get('/versions', function({ versions }, { queryParams }) {
    let id = queryParams.version;
    if (!id) {
      return versions.all();
    }
    if (id.includes('.')) {
      return versions.find(id);
    }
    return versions.findBy((version) => {
      return version.channel === id || version.name === id;
    });
  });

  this.get('/versions/:id', function({ versions }, { params }) {
    let id = params.id;
    if (id.includes('.')) {
      return versions.find(id);
    }
    return versions.findBy((version) => {
      return version.channel === id || version.name === id;
    });
  });

  this.get('/guides/:id', function({ guides }, { params }) {
    let [ version, slug ] = params.id.split(':');
    return guides.findBy((guide) => {
      return guide.versionId === version && guide.slug === slug;
    });
  });

}
