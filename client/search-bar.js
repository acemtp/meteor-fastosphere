
Session.setDefault('q', '');

// Focus the search bar input on render
Template.searchBar.onRendered(() => {
  $('#q').val(Session.get('q'));
  $('#q').focus();
});

Template.searchBar.events({
  'keyup #q'(e) {
    Session.set('q', e.target.value);
  },
});
