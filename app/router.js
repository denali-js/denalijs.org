import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('features', { resetNamespace: true });
  this.route('community', { resetNamespace: true });
  this.route('addons', { resetNamespace: true }, function() {});
  this.route('docs', { path: '/docs/:version' }, function() {
    this.route('quickstart');
    this.route('tutorial', function() {
    });
    this.route('guides', function() {
      this.route('guide', { path: '/*slug' });
    });
    this.route('apis', { path: '/api' }, function() {
      this.route('api', { path: '/*slug' });
    });
  });
  this.route('blog', function() {

  });

});

export default Router;
