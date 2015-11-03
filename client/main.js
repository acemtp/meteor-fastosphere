// Setup Algolia
client = AlgoliaSearch(Meteor.settings.public.algolia_application_id, Meteor.settings.public.algolia_public_id, { dsn: true });
index = client.initIndex(Meteor.settings.public.production ? 'Packages' : 'PackagesTest');

// Do a new Algolia search if the search query changed
Tracker.autorun(function () {
  var q = Session.get('q');
  index.search(q, { hitsPerPage: Session.get('hitsPerPage') }, function (error, content) {
    if(error) return console.error('Error during Algolia search: ', error);
    Session.set('content', content);
  });
});
