// Setup Algolia
const client = AlgoliaSearch(Meteor.settings.public.algolia_application_id, Meteor.settings.public.algolia_public_id, { dsn: true });
const index = client.initIndex(Meteor.settings.public.production ? 'Packages' : 'PackagesTest');

// Do a new Algolia search if the search query changed
Tracker.autorun(() => {
  const q = FlowRouter.getQueryParam('q');
  index.search(q, { hitsPerPage: Session.get('hitsPerPage') }, (error, content) => {
    if (error) return console.error('Error during Algolia search: ', error);
    Session.set('content', content);
  });
});
