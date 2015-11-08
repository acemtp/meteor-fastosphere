
// Focus the search bar input on render
Template.searchBar.onRendered(() => {
  $('#q').val(FlowRouter.getQueryParam('q') || '');
  $('#q').focus();
});

Template.searchBar.events({
  'keyup #q'(e) {
    FlowRouter.setQueryParams({ q: e.target.value || null });
  },
});
