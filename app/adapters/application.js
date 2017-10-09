import DS from 'ember-data';
import ENV from 'denali/config/environment';

export default DS.JSONAPIAdapter.extend({

  host: ENV.api.host,
  namespace: ENV.api.namespace

});
