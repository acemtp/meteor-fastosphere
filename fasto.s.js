
var changelog = function (packageName, currentVersion) {
  var p = Packages.findOne({ 'atmo.name': packageName });
  if (!p) return 'Package "'+packageName+'"" not found';
  if (!p.changelog) return 'Package "'+packageName+'"" doesn\'t have changelog';

  var tokens = marked.lexer(p.changelog, { gfm: true });


};


var getPackages = function () {
  var cnx = DDP.connect('https://atmospherejs.com');
  var p = new Mongo.Collection('packages', { connection: cnx });
  var array = [];
//  var client = new Algolia(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
//  var index = client.initIndex("Packages");
  cnx.subscribe('packages/search', '.', 4000, function () {
    p.find().forEach(function (p) {
      p.objectID = p._id;

      if(Packages.findOne({ 'atmo.name': p.name })) {
        Packages.update(p._id, { $set: { atmo: p } });
      } else {
        Packages.insert({ _id: p._id, atmo: p });
      }

      array.push(p);
    });

//    console.log('ff', array);
/*
    index.saveObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log(Date(), 'DONE', array.length, Packages.find().count());
    });
*/
    console.log('Done');
    cnx.disconnect();
  });
};

var updatePackages = function() {
    Packages.find().forEach(function (p) {
//  Packages.find({ 'atmo.name': 'iron:router' }, { limit: 10 }).forEach(function (p) {
    var git = p && p.atmo && p.atmo.latestVersion && p.atmo.latestVersion.git || '';
//    console.log('git', git);
    if(!git) return;

    var re = /^https?:\/\/github\.com\/([^\/]+)\/(.*?)(?:\.git)?$/gm; 
    var m = re.exec(git);
//    console.log('m', m);

    if(!m) return;

    var userAgent = "Meteor";
    if (Meteor.release) userAgent += "/" + Meteor.release;

    // get info on repo
    HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'?client_id=000dbbc3c779d4426d8e&client_secret=b57e2f9830282014280e426df412d5921a825be6', { headers: { Accept: 'application/json', "User-Agent": userAgent } }, function (err, res) {
      if(err) return console.error('a', m, err);
//      console.log('res', res);
      Packages.update(p._id, { $set: { git: res.data } });
    });

    // list files in root directory
    HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'/contents'+'?client_id=000dbbc3c779d4426d8e&client_secret=b57e2f9830282014280e426df412d5921a825be6', { headers: { Accept: 'application/json', "User-Agent": userAgent } }, function (err, res) {
      if(err) return console.error('b', m, err);

      res.data.forEach(function(f) {
        if(_.indexOf(['history.md', 'changelog.md'], f.name.toLowerCase()) != -1) {
          console.log('found', p.atmo.name, f.name);

          HTTP.get(f.download_url, function (err, res) {
            if(err) return console.error(err);
//            console.log('res', res);
            Packages.update(p._id, { $set: { changelog: res.content } });
          });
        }
      });

//      console.log('res', res);
//      Packages.update(p._id, { $set: { git: res.data } });
    });


  });
};

Meteor.startup(function () {
//  getPackages();
//  updatePackages();


//  console.log('res', JSON.stringify(packages));

/*
  Meteor.setInterval(function() {
    updatePackages();
  }, 1000*60*60*12);
*/
});
