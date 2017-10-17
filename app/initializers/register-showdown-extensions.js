import showdown from 'showdown';

export function initialize(/* application */) {
  showdown.extension('create-sections-from-headers', function() {
    return [
      {
        type: 'output',
        filter: function (source) {
          let sectioned = source.replace(/(<h\d[^>]*>)/gi, function (match, header) {
            return `</section><section>${ header }`;
          });
          return `<section>${ sectioned }</section>`;
        }
      }
    ]
  })  
}

export default {
  initialize
};
