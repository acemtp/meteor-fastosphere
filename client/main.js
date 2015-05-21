Router.route('/', function () {
  this.render('home', {
    data: function () { return Session.get('content'); }
  });
});

hitsPerPageInc = Meteor.isMobile ? 10 : 50;

Session.setDefault('hitsPerPage', hitsPerPageInc);
Session.setDefault('q', '');

client = AlgoliaSearch(Meteor.settings.public.algolia_application_id, Meteor.settings.public.algolia_public_id, { dsn: true });
index = client.initIndex(Meteor.settings.public.production ? 'Packages' : 'PackagesTest');

Tracker.autorun(function () {
  var q = Session.get('q');
  index.search(q, { hitsPerPage: Session.get('hitsPerPage') }, function (error, content) {
    if (error) {
      console.log('Error: ' + content.message);
      return;
    }
    Session.set('content', content);
  });
});

Template.searchBar.rendered = function () {
  $('#q').val(Session.get('q'));
  $('#q').focus();
};

Template.searchBar.events({
  'keyup #q': function (e) {
    Session.set('q', e.target.value);
  },
});

Template.searchResult.rendered = function () {
  $('[data-toggle="tooltip"]').tooltip();
};

Template.searchResults.helpers({
  packageCount: function () {
    return Packages.find().count();
  },


/*
  content: function() {
    return Session.get('content');
  },
*/
  hitsLength: function() {
    var c = Session.get('content');
    return c && c.hits && c.hits.length;
  },
  hasMore: function () {
    var c = Session.get('content');
    return c && c.hitsPerPage < c.nbHits;
  },
});

Template.searchResults.events({
  'click #loadMore': function() {
    Session.set('hitsPerPage', Session.get('hitsPerPage') + hitsPerPageInc);
    return false;
  },
});

Template.searchResult.helpers({
  date: function () {
    return moment(this.lastUpdated).fromNow();
  },
  errors: function () {
    var err = [];
    if(this.badgit) err.push('bad github url.');
    if(!this.changelogUrl) err.push('no changelog.');
    return err.length > 0 ? 'For the maintainer: ' + err.join(' ') : undefined;
  },
});

Template.searchResult.events({
  'click .refresh': function() {
    Meteor.call('refresh', this.name);
    return false;
  },
});
