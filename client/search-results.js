
let hitsPerPageInc = Meteor.isMobile ? 10 : 50;
Session.setDefault('hitsPerPage', hitsPerPageInc);
Session.setDefault('packageSelected', undefined);

// Init material design effect (ripple, etc)
Template.searchResults.onRendered(() => {
  $.material.init();
});

// Init clipboard with event delegation (only on parent)
Template.searchResults.onRendered(function searchResultsonRendered() {
  this.clipboard = new Clipboard('.js-clippy');
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


Template.packageSelected.helpers({
  changelogAnchor() {
    return Session.get('packageSelected').name.replace(/:/g, '');
  },
});

Template.searchResults.events({
  'click #loadMore'() {
    Session.set('hitsPerPage', Session.get('hitsPerPage') + hitsPerPageInc);
    return false;
  },
});

Template.registerHelper('packageSelected', () => {
  return Session.get('packageSelected');
});

Template.registerHelper('fromNow', (date) => {
  return moment(date).fromNow();
});

Template.registerHelper('shortUrl', (url) => {
  if (!url) return '';
  return url.substr(url.indexOf('/') + 2);
});
