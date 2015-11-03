
let hitsPerPageInc = Meteor.isMobile ? 10 : 50;
Session.setDefault('hitsPerPage', hitsPerPageInc);

// Init material design effect (ripple, etc)
Template.searchResults.onRendered(() => {
  $.material.init();
});

// Init clipboard with event delegation (only on parent)
Template.searchResults.onRendered(function searchResultsonRendered() {
  this.clipboard = new Clipboard('.clippy');
  this.clipboard.on('success', (e) => {
    $(e.trigger).attr('data-original-title', 'Copied!').tooltip('show');
  });
});

Template.searchResults.onDestroyed(function searchResultsonDestroyed() {
  this.clipboard.destroy();
});


Template.searchResults.helpers({
  hitsLength() {
    const c = Session.get('content');
    return c && c.hits && c.hits.length;
  },
  hasMore() {
    const c = Session.get('content');
    return c && c.hitsPerPage < c.nbHits;
  },
});

Template.searchResults.events({
  'click #loadMore'() {
    Session.set('hitsPerPage', Session.get('hitsPerPage') + hitsPerPageInc);
    return false;
  },
});
