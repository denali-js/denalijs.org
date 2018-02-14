import { kebabCase } from 'lodash';
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { computed } from '@ember/object';

export default Component.extend({

  tagName: 'nav',
  classNames: [ 'table-of-contents' ],

  entries: computed('text', function() {
    let headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let text = this.get('text');
    let results;
    let headers = [];
    // eslint-disable-next-line no-cond-assign
    while((results = headerRegex.exec(text)) !== null) {
      let [ , headerLevel, headerText ] = results;
      headers.push({
        level: headerLevel.length,
        text: headerText,
        slug: kebabCase(headerText).replace(/[^A-z0-9]/g, '')
      });
    }
    return headers
  }),

  didInsertElement() {
    run.next(() => {
      let headers = this.$(document).find('.page-body h1,h2,h3,h4,h5,h6');
      this.$(document).on('scroll.toc-scrollspy', () => {
        let scroll = this.$(document).scrollTop();
        let height = window.innerHeight;
        let threshold = scroll + (height / 4);
        let candidate;
        headers.each((i, el) => {
          let position = this.$(el).offset().top;
          if (position < threshold) {
            candidate = el;
          } else {
            return false;
          }
        });
        if (!candidate) {
          return;
        }
        this.set('tocPosition', candidate.id);
      });

      if (window.location.hash) {
        this.send('scrollToTarget', window.location.hash.slice(1));
      }
    });
  },

  willDestroyElement() {
    this.$(document).off('scroll.toc-scrollspy');
  },

  actions: {
    scrollToTarget(slug) {
      let $target = this.$(document).find(`#${ slug }`);
      $target.velocity('scroll', { duration: 400, easing: [250, 30] });
    }
  }

})