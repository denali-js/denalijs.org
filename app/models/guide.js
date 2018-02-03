import { computed } from '@ember/object';
import DS from 'ember-data';

const attr = DS.attr;
const belongsTo = DS.belongsTo;

const GRAF_MARKER = '\n\n';

const Guide = DS.Model.extend({

  title: attr('string'),
  body: attr('string'),
  group: attr('string'),
  slug: attr('string'),
  order: attr('number'),
  updatedAt: attr('date'),

  version: belongsTo('version'),

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
  }),

  tableOfContents: computed('body', function() {
    const HEADER_REGEX = /^[ \t]*(#{1,5})[ \t]*(.+)/gm;
    let body = this.get('body');
    let headers = [];
    let results;
    while ((results = HEADER_REGEX.exec(body)) !== null) {
      let [ , prefix, title ] = results;
      let level = prefix.length;
      let slug = title.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
      headers.push({ title, level, slug });
    }
    return headers;
  })

});

Guide.reopenClass({
  idFor(version, slug) {
    return `${ version.id || version }:${ slug }`;
  }
});

export default Guide;