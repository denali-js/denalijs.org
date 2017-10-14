import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('why-denali');
  this.route('community');
  this.route('roadmap');

  this.route('docs', { path: '/docs/:version' }, function() {
    this.route('quickstart');
    this.route('guides', function() {
      this.route('guide', { path: '/*slug' });
    });
    this.route('apis', { path: '/api' }, function() {
      this.route('api', { path: '/*slug' });
    });
  });

  this.route('addons', function() {});

});

export default Router;
