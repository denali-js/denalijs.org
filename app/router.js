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
  this.route('addons', function() {});

});

export default Router;
