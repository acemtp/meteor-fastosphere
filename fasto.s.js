var semverClean = function (ver) {
  var re = /(\d+\.\d+(?:\.\d+)?)/gm; 
  var m = re.exec(ver);
  var semver;
  if(m) {
    semver = m[0];
    if(semver.split('.').length === 2) semver += '.0';
  }
  return semver;
};


changelog = function (packageName, currentVersion, verbose) {
  var msg;
  var p = Packages.findOne({ 'atmo.name': packageName });
  if (!p) {
    msg = 'Package "' + packageName + '" not found';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }
  if (!p.changelog) {
    msg = 'Package "' + packageName + '" doesn\'t have changelog';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

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

      if(ver && currentVersion && semver.lte(ver, currentVersion)) {
        console.log('found', packageName, t);
        break;
      }
    }
  }

  if(i <= 1 || i === tokens.length) {
    msg = 'Version "' + currentVersion + '" is not found in the changelog of package "' + packageName + '"';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  var subtokens = tokens.slice(0, i);

  // main title is always the package name so we change title depth if needed
  if(_.find(subtokens, function(st) { return st.type === 'heading' && st.depth === 1; })) {
    subtokens.forEach(function (st) {
      if(st.type === 'heading') st.depth++;
    });
  }

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
  console.log('Get packages from Atmosphere...');
  var cnx = DDP.connect('https://atmospherejs.com');
  var pcnx = new Mongo.Collection('packages', { connection: cnx });
  var array = [];
  cnx.subscribe('packages/search', '.', 4000, function () {

console.log('nb flag before', Packages.find({ flagDelete: { $exists: true } }).count());

    Packages.update({}, { $set: { flagDelete: true } }, { multi: true });

console.log('nb flag before2', Packages.find({ flagDelete: { $exists: true } }).count());

    pcnx.find().forEach(function (p) {
      p.objectID = p._id;
      p.deleted = true;
      if(Packages.findOne({ 'atmo.name': p.name })) {
        Packages.update(p._id, { $set: { atmo: p, flagDelete: false } });
        delete p.deleted;
      } else {
        console.log('  New package', p.name);
        Packages.insert({ _id: p._id, atmo: p });
        delete p.deleted;
      }
      array.push(p);
    });

console.log('nb flag d', Packages.find({ flagDelete: { $exists: true } }).count());
console.log('nb flag d true', Packages.find({ flagDelete: true }).count());
console.log('nb flag d false', Packages.find({ flagDelete: false }).count());

    Packages.update({ flagDelete: true }, { $set: { 'atmo.deleted': true } }, { multi: true });
    Packages.update({}, { $unset: { flagDelete: '' } }, { multi: true });

console.log('nb flag after', Packages.find({ flagDelete: { $exists: true } }).count());

//    console.log('ff', array);

    var client = new Algolia(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
    var index = client.initIndex("Packages");
    index.saveObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log(Date(), 'DONE', array.length, Packages.find().count());
    });
/*
    index.deleteObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log(Date(), 'DONE', array.length, Packages.find().count());
    });
*/
    cnx.disconnect();
    console.log('Done');
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

Meteor.methods({
  atmo: function() {
    getPackages();
  }
});


Meteor.startup(function () {
//  getPackages();
//  updatePackages();

  var m = Packages.findOne({ name: 'METEOR' });
  if(!m) {
    Packages.insert({ name: 'METEOR', atmo: { name: 'METEOR', latestVersion: { git: 'https://github.com/meteor/meteor' } } });
    updatePackage(Packages.findOne({ name: 'METEOR' }));
  }

//  console.log('res', JSON.stringify(packages));

  Meteor.setInterval(function() {
    getPackages();
  }, 1000*60*60*12);

});
