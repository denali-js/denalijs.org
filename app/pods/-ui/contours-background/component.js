/* global mapboxgl */
import Component from '@ember/component';

export default Component.extend({

  classNames: [ 'contours-background' ],

  didInsertElement() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZXdhc21lciIsImEiOiJVZ2FzMGc4In0.HAC3HhFlNYMmbj3ZBV8BWw';
    this.set('map', new mapboxgl.Map({
      container: this.$('.contour-map').get(0),
      style: 'mapbox://styles/davewasmer/cj6s69ue353832so3rtxqvjza',
      center: [ -150.92775335734382, 62.72646930353406 ],
      zoom: 11.16,
      scrollZoom: false
    }));
  }

});
