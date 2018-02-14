import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('features');
  this.route('community');
  this.route('roadmap');
  this.route('addons', function() {
    this.route('addon', { path: '/:addon' }, function() {
      this.route('docs', { path: '/docs/*slug' });
      this.route('api', { path: '/api/*slug'});
    });
  });
  this.route('docs', { path: '/:version_id' }, function() {
    this.route('quickstart');
    this.route('tutorial', function() {});
    this.route('guide', { path: 'guides/*slug' });
    this.route('api', { path: 'api/*slug' });
  });
  this.route('blog', function() {
    this.route('post', { path: '/:slug' });
  });

});

export default Router;
