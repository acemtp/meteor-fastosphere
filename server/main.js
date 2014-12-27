// autoform prend 4.0.0 comme plus recente au lieu de 4.2.1
// noname car version sans packages et package trouve pas le truc avec deja une version
// -> virer les noname
// -> requet a la main pour ajouter name:
// -> retirer le updateGit: true
// -> force reload meteor pour recup les ver
// verifier que le package METEOR est bien crafté et changelog le recupere bien)
// mettre API key de github dans settings

semver = Meteor.npmRequire('semver');

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
    return Packages.find({});
});


Meteor.methods({
  algoliaUpdate: function() {
    if(isAdmin(this.userId))
      algoliaUpdate(true);
  },
  githubUpdate: function(package) {
    check(package, String);
    if(isAdmin(this.userId)) {
      githubUpdate(Packages.findOne({ 'meteor.package.name': package }));
      algoliaUpdate();
    }
  },
  githubsUpdate: function() {
    if(isAdmin(this.userId)) {
      githubsUpdate();
      algoliaUpdate();
    }
  },
});

Meteor.startup(function () {

  var m = Packages.findOne({ name: 'METEOR' });
  if(!m) {
    Packages.insert({ name: 'METEOR', meteor: { package: { name: 'METEOR' }, version: { packageName: 'METEOR', git: 'https://github.com/meteor/meteor' } } });
    updateGit(Packages.findOne({ name: 'METEOR' }));
  }

  Meteor.setInterval(function() {
    meteorUpdate();
  }, 1000 * 10);

  Meteor.setInterval(function() {
    githubsUpdate();
  }, 1000 * 60 * 10);

});
