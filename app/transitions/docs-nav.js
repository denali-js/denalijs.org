import Ember from 'ember';
import { animate } from 'liquid-fire';

const RSVP = Ember.RSVP;

const duration = 20 * 1000;

const options = {
  duration,
  easing: 'ease-out'
};

export default function () {
  if (this.oldValue) {
    if (this.newValue) {
      return switchMenu.call(this);
    } else {
      return closeMenu.call(this);
    }
  } else if (this.newValue) {
    return openMenu.call(this);
  } else {
    throw new Error('This should not be possible');
  }
}

function openMenu() {
  hide(this.oldElement);
  show(this.newElement);
  let $newMenuBackground = this.newElement.find('.menu-dropdown');
  let $newMenuContents = this.newElement.find('.menu-dropdown-content');
  return RSVP.all([
    animate($newMenuBackground, { opacity: [ 1, 0 ] }, options),
    animate($newMenuContents, { opacity: [ 1, 0 ] }, options)
  ]);
}

function closeMenu() {
  hide(this.oldElement);
  show(this.newElement);
  let $oldMenuBackground = this.oldElement.find('.menu-dropdown');
  let $oldMenuContents = this.oldElement.find('.menu-dropdown-content');
  show($oldMenuBackground);
  show($oldMenuContents);
  return RSVP.all([
    animate($oldMenuBackground, { opacity: [ 0, 1 ] }, options),
    animate($oldMenuContents, { opacity: [ 0, 1 ] }, options)
  ]);
}

function switchMenu() {
  let $oldMenuContents = this.oldElement.find('.menu-dropdown-content');
  let $oldMenuBackground = this.oldElement.find('.menu-dropdown');
  let $newMenuContents = this.newElement.find('.menu-dropdown-content');
  let $newMenuBackground = this.newElement.find('.menu-dropdown');

  let oldOffset = $oldMenuBackground.offset();
  let newOffset = $newMenuBackground.offset();

  // Hide the old menu dropdown - we'll animate the new one from the old one's position
  // to the new position
  hide(this.oldElement);
  hide($oldMenuBackground);
  // But don't hide the menu's contents themselves - we need those to fade out
  show($oldMenuContents)
  // Show the new dropdown menu
  show(this.newElement);

  // $oldMenuBackground.css({
  //   backgroundColor: 'transparent',
  //   boxShadow: 'none'
  // });

  $newMenuContents.css({ width: $newMenuContents.outerWidth() });
  $oldMenuContents.css({ width: $oldMenuContents.outerWidth() });

  let backgroundAnimation = animate($newMenuBackground, {
    translateX: [ 0, oldOffset.left - newOffset.left ],
    translateY: [ 0, oldOffset.top - newOffset.top ],
    outerWidth: [ $newMenuBackground.outerWidth(), $oldMenuBackground.outerWidth() ],
    outerHeight: [ $newMenuBackground.outerHeight(), $oldMenuBackground.outerHeight() ]
  }, options);
  let newContentOffset = animate($newMenuContents, {
    opacity: [ 1, 0 ],
    translateX: [ 0, -(oldOffset.left - newOffset.left) ],
    translateY: [ 0, -(oldOffset.top - newOffset.top) ]
  }, options);
  let oldBg = animate($oldMenuBackground, {
    translateX: [ -(oldOffset.left - newOffset.left), 0 ],
    translateY: [ -(oldOffset.top - newOffset.top), 0 ],
    outerWidth: [ $newMenuBackground.outerWidth(), $oldMenuBackground.outerWidth() ],
    outerHeight: [ $newMenuBackground.outerHeight(), $oldMenuBackground.outerHeight() ]
  }, options);
  let oldContent = animate($oldMenuContents, {
    opacity: [ 0, 1 ],
    translateX: [ oldOffset.left - newOffset.left, 0 ],
    translateY: [ oldOffset.top - newOffset.top, 0 ],
  }, options);

  return RSVP.all([ backgroundAnimation, newContentOffset, oldBg, oldContent ]);
}


function show(element) {
  element.css({ visibility: 'visible' });
}
function hide(element) {
  element.css({ visibility: 'hidden' });
}