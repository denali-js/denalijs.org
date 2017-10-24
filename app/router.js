import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('marketing', { path: '/' }, function() {
    this.route('why-denali', { resetNamespace: true });
    this.route('community', { resetNamespace: true });
    this.route('roadmap', { resetNamespace: true });
    this.route('addons', { resetNamespace: true }, function() {});
  });

  this.route('docs', { path: '/docs/:version' }, function() {
    this.route('guides', function() {
      this.route('guide', { path: '/*slug' });
    });
    this.route('apis', { path: '/api' }, function() {
      this.route('api', { path: '/*slug' });
    });
  });

});

export default Router;
