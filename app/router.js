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

  this.route('docs');
  this.route('addons', function() {
    this.route('addon', { path: '/:addonName' }, function() {
      this.route('quickstart');
      this.route('guide/*guideName');
      this.route('api/*referenceId');
    });
  });

});

export default Router;
