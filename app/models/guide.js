import Ember from 'ember';
import DS from 'ember-data';

const attr = DS.attr;
const computed = Ember.computed;

const GRAF_MARKER = '\n\n';

export default DS.Model.extend({

  title: attr('string'),
  body: attr('string'),
  group: attr('string'),
  slug: attr('string'),
  updatedAt: attr('date'),
  tableOfContents: attr(),

  lede: computed('body', function() {
    let body = this.get('body');
    let grafs = body.trim().split(GRAF_MARKER);
    return grafs.shift();
  }),

  formattedBody: computed('body', function() {
    let body = this.get('body');
    let grafs = body.trim().split(GRAF_MARKER);
    grafs.shift();
    return grafs.join('\n');
  })

});
