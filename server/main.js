console.log(Meteor.settings.public.production ? 'Prod' : 'Dev');

Meteor.startup(() => {
/*
add this to packages.json to profile with nodetime
  "nodetime": "0.8.15"

  Meteor.npmRequire('nodetime').profile({
    accountKey: 'ac6b81e20388c2e79361f9ce6f546a54f51cf5c8',
    appName: 'Node.js Application'
  });
*/
});

isAdmin = uid => {
  return uid && Meteor.users.findOne(uid).services.github.id === 103561;
};

Meteor.startup(() => {
  SyncedCron.start();
});

Meteor.methods({
  refresh(p) {
    check(p, String);
    if (!this.userId) return;
    githubUpdate(Packages.findOne({ name: p }));
    algoliaUpdate();
  },
  delete() {
    if (!isAdmin(this.userId)) return;
    Packages.remove();
  },
  deleteEmptyNames() {
    if (!isAdmin(this.userId)) return;
    Packages.remove({ name: { $exists: false } });
  },
});
