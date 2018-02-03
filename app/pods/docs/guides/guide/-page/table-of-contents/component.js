import Component from '@ember/component';
import { run } from '@ember/runloop';

export default Component.extend({

  tagName: 'nav',
  classNames: [ 'table-of-contents' ],

  didInsertElement() {
    run.next(() => {
      let headers = this.$(document).find('.guide-body h1,h2,h3,h4,h5,h6');
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
      $target.velocity('scroll', { duration: 1000, easing: [250, 30] });
    }
  }

})