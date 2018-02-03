import RSVP from 'rsvp';
import { animate } from 'liquid-fire';

const duration = 300;
const easing = 'easeOutExp';
const newListDelay = 200;
const travelDistance = 20;
const stagger = 50;

export default function () {
  let oldList = this.oldElement;
  let oldListAnimation = animate(oldList, {
    translateX: [ -travelDistance, 0 ],
    opacity: [ 0, 1 ]
  }, { duration, easing });

  let oldListPoints = oldList.find('li').toArray();
  let oldListPointsStagger = oldListPoints.map((point, i) => {
    return animate([ point ], {
      translateX: [ -20, 0 ],
      opacity: [ 0, 1 ]
    }, {
      delay: stagger * i,
      duration: duration + (stagger * i),
      easing
    });
  });

  let newList = this.newElement;
  let newListAnimation = animate(newList, {
    translateX: [ 0, -travelDistance ],
    opacity: [ 1, 0 ]
  }, { duration, easing, delay: newListDelay });

  let newListPoints = newList.find('li').toArray();
  let newListPointsStagger = newListPoints.map((point, i) => {
    let $point = newList.find(point);
    $point.css({ visibility: 'hidden' });
    return animate([ point ], {
      translateX: [ 0, -20 ],
      opacity: [ 1, 0 ],
      visibility: 'auto'
    }, {
      delay: newListDelay + (stagger * i),
      duration: duration + (stagger * i),
      easing
    });
  });

  return RSVP.all([ oldListAnimation, newListAnimation ].concat(newListPointsStagger).concat(oldListPointsStagger));
}
