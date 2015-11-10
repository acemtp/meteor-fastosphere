Template.searchResult.onRendered(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

Template.searchResult.helpers({
  errors() {
    let err = [];
    if (this.badgit) err.push('bad github url.');
    if (!this.readme.length) err.push('no readme.');
    if (!this.changelogUrl) err.push('no changelog.');
    return err.length > 0 ? err.join(' ') : undefined;
  },
  packageSelectedActive() {
    const name = FlowRouter.getParam('packageSelected');
    return name === this.name;
  },
});

Template.searchResult.events({
  'click .refresh'() {
    Meteor.call('refresh', this.name);
    return false;
  },
  'click .js-package-select'() {
    const name = FlowRouter.getParam('packageSelected');
    FlowRouter.setParams({ packageSelected: name === this.name ? undefined : this.name });
  },
});
