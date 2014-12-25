var semverClean = function (ver) {
  var re = /(\d+\.\d+(?:\.\d+)?)/gm; 
  var m = re.exec(ver);
  var semver;
  if(m) {
    console.log('m', m);
    semver = m[0];
    if(semver.split('.').length === 2) semver += '.0';
  }
  return semver;
};


changelog = function (packageName, currentVersion) {
  var p = Packages.findOne({ 'atmo.name': packageName });
  if (!p) { console.log('Package not found', packageName); return undefined; }
  if (!p.changelog) { console.log('Package without changelog', packageName); return undefined; }

  var tokens = marked.lexer(p.changelog, { gfm: true });

//  console.log('****************************');
//  console.log(tokens);
//  console.log('****************************');

  var semver = Meteor.npmRequire('semver');

  for(var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
//    console.log('token', t);
//    if(t.type === 'heading' && t.text.indexOf(currentVersion) !== -1) {
    if(t.type === 'heading') {
      var ver = semverClean(t.text);
      currentVersion = semverClean(currentVersion);

      console.log('eee', t.text, ver, currentVersion, semver.valid(ver), semver.valid(currentVersion));

      if(ver && currentVersion && semver.lte(ver, currentVersion)) {
        console.log('found', t);
        break;
      }
    }
  }

  if(i === 0 || i === tokens.length) { console.log('Version not found in changelog', packageName); return undefined; }

  var subtokens = tokens.slice(0, i);

console.log('subt', i, tokens.length, subtokens);

//  subtokens.links = tokens.links;
//  console.log('__-****************************');
//  console.log(subtokens);
//  console.log('****************************');
/*
  var str = '';
  subtokens.forEach(function(t) {
    if(t.type === 'heading')
      str += '\n\n' + Array(t.depth).join('#') + ' ' + t.text + '\n\n';
    else if(t.type === 'list_item_start')
      str += '- ';
    else if(t.type === 'text')
      str += t.text + '\n';
  });
*/
  return subtokens;
//  return str;
//  return marked.parser(subtokens);
};

//debug
//console.log('cl', changelog("iron:router", '0.5.4'));


var getPackages = function () {
  console.log('getPackages');
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

var updatePackage = function (p) {
  var giturl = p && p.atmo && p.atmo.latestVersion && p.atmo.latestVersion.git || '';
//    console.log('git', git);
  if(!giturl) return;

  var re = /^https?:\/\/github\.com\/([^\/]+)\/(.*?)(?:\.git)?$/gm; 
  var m = re.exec(giturl);
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
};

var updatePackages = function() {
  Packages.find().forEach(function (p) {
//  Packages.find({ 'atmo.name': 'iron:router' }, { limit: 10 }).forEach(function (p) {
    updatePackage(p);
  });
};

Meteor.startup(function () {
//  getPackages();
//  updatePackages();

  var m = Packages.findOne({ name: 'METEOR' });
  if(!m) {
    Packages.insert({ name: 'METEOR', atmo: { name: 'METEOR', latestVersion: { git: 'https://github.com/meteor/meteor' } } });
    updatePackage(Packages.findOne({ name: 'METEOR' }));
  }

//  console.log('res', JSON.stringify(packages));

/*
  Meteor.setInterval(function() {
    updatePackages();
  }, 1000*60*60*12);
*/
});
