
Packages._ensureIndex('name', { unique: 1, sparse: 1 });

console.log(Meteor.settings.public.production?'Prod':'Dev');

Meteor.startup(function() {
/*
add this to packages.json to profile with nodetime
  "nodetime": "0.8.15"

  Meteor.npmRequire('nodetime').profile({
    accountKey: 'ac6b81e20388c2e79361f9ce6f546a54f51cf5c8',
    appName: 'Node.js Application'
  });
*/
});

isAdmin = function (uid) {
  return uid && Meteor.users.findOne(uid).services.github.id === 103561;
};

Meteor.publish('packages', function () {
  if(isAdmin(this.userId))
    return Packages.find();
});

Meteor.startup(function () {
  SyncedCron.start();
});

Meteor.methods({
  refresh: function (package) {
    check(package, String);
    if(this.userId) {
      githubUpdate(Packages.findOne({ name: package }));
      algoliaUpdate();
    }
  },
  delete: function () {
    if(isAdmin(this.userId)) {
      Packages.remove();
    }
  },
  deleteEmptyNames: function () {
    if(isAdmin(this.userId)) {
      Packages.remove({name: {$exists: false}});
    }
  },
});
