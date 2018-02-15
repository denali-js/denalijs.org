import Component from '@ember/component';
import { notEmpty } from '@ember/object/computed';

export default Component.extend({

  classNames: [ 'addon' ],
  classNameBindings: [ 'skeleton' ],

  skeleton: notEmpty('addon')

});