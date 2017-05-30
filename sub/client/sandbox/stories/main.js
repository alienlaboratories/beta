/*
 * (c) 2016, Alien Laboratories.
 */

"use strict";

let META = {

  VERSION: '0.0.1'

};

class App {

  constructor() {
    this.meta = META;
  }

  start() {
    let self = this;

    $('#meta').text(JSON.stringify(self.meta));

    $('#notes').on('click', function(ev) {
      $('#notes').hide();
    });

    $('.cards').on('click', '.card .panel .header', function(ev) {
      if ($(ev.target).hasClass('map-button')) {
        $(ev.target).closest('.panel').find('.map-panel').toggle(100);
      } else {
        $(ev.target).closest('.header').next().toggle(100);
      }
    });

    $('.cards').on('click', '.card .panel .section .row .detail-button', function(ev) {
      $(ev.target).closest('.row').next().toggle(100);
    });

    $('.cards').on('click', '.card .panel .section .row .open-button', function(ev) {
      let card = $($(ev.target).attr('card'));
      card.show(200);
    });

    $('.cards').on('click', '.card .header .menu', function(ev) {
      let card = $(ev.target).closest('.card');
      let hidden = card.attr('_hidden') == 'true';
      if (hidden) {
        card.find('.section').show(100);
      } else {
        card.find('.section').hide(100);
      }
      card.attr('_hidden', !hidden);
    });

    $('#add i').on('click', function(ev) {
      $('#new').show(100);
      $('#new > .header input').focus();
    });
    $('#new select').on('change', function(ev) {
      let type = $(ev.target).val();
      switch (type) {
        case 'trip':
          $('#new-project').hide(100);
          $('#new-trip').show(100);
          break;
        case 'project':
          $('#new-trip').hide(100);
          $('#new-project').show(100);
          break;
      }
    });

    $('input.person').autocomplete({
      source: ['Adam Berenzweig', 'Alex Khesin', 'Alex Lloyd', 'Daniel Dulitz']
    });
    $('input.person').on('change', function(ev) {
      // TODO(burdon): remove input.
    });
  }

}

$(document).ready(function() {
  new App().start();
});
