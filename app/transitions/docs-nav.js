import Ember from 'ember';
import { animate, stop } from 'liquid-fire';

const RSVP = Ember.RSVP;

const duration = 2 * 1000;

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
  if (this.older.length > 0) {
    debugger;
  }
  let $oldMenuContents = this.oldElement.find('.menu-dropdown-content');
  let $oldMenuBackground = this.oldElement.find('.menu-dropdown');
  let $newMenuContents = this.newElement.find('.menu-dropdown-content');
  let $newMenuBackground = this.newElement.find('.menu-dropdown');

  let oldOffset = $oldMenuBackground.offset();
  let newOffset = $newMenuBackground.offset();

  // Hide the old nav so we don't end up with double layered text for static
  // nav bar links
  hide(this.oldElement);
  // But don't hide the menu's contents themselves - we need those to fade out
  show($oldMenuContents)
  // Show the new dropdown menu
  show(this.newElement);

  // Get rid of the old dropdown's background styling. We still need it around
  // to clip the old menu contents, but can't have it rendering on top of the
  // new menu contents and obscuring them.
  $oldMenuBackground.css({
    backgroundColor: 'transparent',
    boxShadow: 'none'
  });

  // Force the width of the menu contents as we animate to avoid wrapping changes
  $newMenuContents.css({ width: $newMenuContents.outerWidth() });
  $oldMenuContents.css({ width: $oldMenuContents.outerWidth() });

  // Stop any inflight animations
  stop($newMenuBackground);
  stop($newMenuContents);
  stop($oldMenuBackground);
  stop($oldMenuContents);

  return RSVP.all([

    // Animate the new menu dropdown background from the old menu's position to the new
    // one. This is what the user sees as the menu sliding over
    animate($newMenuBackground, {
      translateX: [ 0, oldOffset.left - newOffset.left ],
      translateY: [ 0, oldOffset.top - newOffset.top ],
      outerWidth: [ $newMenuBackground.outerWidth(), $oldMenuBackground.outerWidth() ],
      outerHeight: [ $newMenuBackground.outerHeight(), $oldMenuBackground.outerHeight() ]
    }, options),

    // Because the menu contents are children of their background, the background animation
    // directly above would carry the new menu contents with it. So we perform the exact
    // opposite animation, resulting in the menu contents appearing to stay in the same place
    animate($newMenuContents, {
      opacity: [ 1, 0 ],
      translateX: [ 0, -(oldOffset.left - newOffset.left) ],
      translateY: [ 0, -(oldOffset.top - newOffset.top) ]
    }, options),

    // This animates the old background (now invisible) along the same path as the new one.
    // At this point, the old background is acting as a clipping mask for the old menu contents
    animate($oldMenuBackground, {
      translateX: [ -(oldOffset.left - newOffset.left), 0 ],
      translateY: [ -(oldOffset.top - newOffset.top), 0 ],
      outerWidth: [ $newMenuBackground.outerWidth(), $oldMenuBackground.outerWidth() ],
      outerHeight: [ $newMenuBackground.outerHeight(), $oldMenuBackground.outerHeight() ]
    }, options),

    // Just like the new menu contents - the exact reverse animation of the old menu's background,
    // resulting in the old menu appearing to stay in the same spot
    animate($oldMenuContents, {
      opacity: [ 0, 1 ],
      translateX: [ oldOffset.left - newOffset.left, 0 ],
      translateY: [ oldOffset.top - newOffset.top, 0 ],
    }, options)

  ]);
}


function show(element) {
  element.css({ visibility: 'visible' });
}
function hide(element) {
  element.css({ visibility: 'hidden' });
}