import Ember from 'ember';

const { notEmpty } = Ember.computed;

export default Ember.Component.extend({

  classNames: [ 'addon' ],
  classNameBindings: [ 'skeleton' ],

  skeleton: notEmpty('addon')

});