import showdown from 'showdown';

export function initialize(/* application */) {
  showdown.extension('create-sections-from-headers', function() {
    return [
      {
        type: 'output',
        filter: function (source) {
          let sectioned = source.replace(/(<h\d[^>]*>)/gi, function (match, header) {
            return `</div></section><section><div class="container">${ header }`;
          });
          return `<section><div class="container">${ sectioned }</div></section>`;
        }
      }
    ]
  })  
}

export default {
  initialize
};
