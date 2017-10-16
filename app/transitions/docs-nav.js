import Ember from 'ember';
import { animate, stop, timeRemaining, isAnimating } from 'liquid-fire';

const RSVP = Ember.RSVP;

const duration = 0.2 * 1000;

const options = {
  duration,
  easing: 'easeInOutCubic'
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
  let animations = [];

  let $oldMenuBackground = this.oldElement.find('.menu-dropdown');
  let $newMenuContents = this.newElement.find('.menu-dropdown-content');
  let $newMenuBackground = this.newElement.find('.menu-dropdown');

  show(this.newElement);
  $newMenuContents.css({ width: $newMenuContents.outerWidth() });

  let newOffset = $newMenuBackground.offset();
  let oldOffset = $oldMenuBackground.offset();

  this.older.concat({ element: this.oldElement }).forEach(({ element }) => {
    let $oldMenuBackground = element.find('.menu-dropdown');
    let $oldMenuContents = element.find('.menu-dropdown-content');
    if (isAnimating($oldMenuBackground)) {
      options.duration = timeRemaining($oldMenuBackground);
    }
    // Stop any inflight animations
    stop($oldMenuBackground);
    stop($oldMenuContents);
    // Hide the old nav so we don't end up with double layered text for static
    // nav bar links
    hide(element);
    // But don't hide the menu's contents themselves - we need those to fade out
    show($oldMenuContents)
    // Force the width of the menu contents as we animate to avoid wrapping changes
    $oldMenuContents.css({ width: $oldMenuContents.outerWidth() });
    // Get rid of the old dropdown's background styling. We still need it around
    // to clip the old menu contents, but can't have it rendering on top of the
    // new menu contents and obscuring them.
    $oldMenuBackground.css({
      backgroundColor: 'transparent',
      boxShadow: 'none'
    });
    let oldOffset = $oldMenuBackground.offset();
    // This animates the old background (now invisible) along the same path as the new one.
    // At this point, the old background is acting as a clipping mask for the old menu contents
    animations.push(animate($oldMenuBackground, {
      translateX: [ -(oldOffset.left - newOffset.left) ],
      translateY: [ -(oldOffset.top - newOffset.top) ],
      outerWidth: [ $newMenuBackground.outerWidth() ],
      outerHeight: [ $newMenuBackground.outerHeight() ]
    }, options));
    // Just like the new menu contents - the exact reverse animation of the old menu's background,
    // resulting in the old menu appearing to stay in the same spot
    animations.push(animate($oldMenuContents, {
      opacity: [ 0 ],
      translateX: [ oldOffset.left - newOffset.left ],
      translateY: [ oldOffset.top - newOffset.top ],
    }, options));
  });

  // Animate the new menu dropdown background from the old menu's position to the new
  // one. This is what the user sees as the menu sliding over
  animations.push(animate($newMenuBackground, {
    translateX: [ 0, oldOffset.left - newOffset.left ],
    translateY: [ 0, oldOffset.top - newOffset.top ],
    outerWidth: [ $newMenuBackground.outerWidth(), $oldMenuBackground.outerWidth() ],
    outerHeight: [ $newMenuBackground.outerHeight(), $oldMenuBackground.outerHeight() ]
  }, options));

  // Because the menu contents are children of their background, the background animation
  // directly above would carry the new menu contents with it. So we perform the exact
  // opposite animation, resulting in the menu contents appearing to stay in the same place
  animations.push(animate($newMenuContents, {
    opacity: [ 1, 0 ],
    translateX: [ 0, -(oldOffset.left - newOffset.left) ],
    translateY: [ 0, -(oldOffset.top - newOffset.top) ]
  }, options));

  return RSVP.all(animations);
}


function show(element) {
  element.css({ visibility: 'visible' });
}
function hide(element) {
  element.css({ visibility: 'hidden' });
}