Template.searchResult.onRendered(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

Template.searchResult.helpers({
  date() {
    return moment(this.lastUpdated).fromNow();
  },
  errors() {
    let err = [];
    if (this.badgit) err.push('bad github url.');
    if (!this.changelogUrl) err.push('no changelog.');
    return err.length > 0 ? err.join(' ') : undefined;
  },
});

Template.searchResult.events({
  'click .refresh'() {
    Meteor.call('refresh', this.name);
    return false;
  },
});
