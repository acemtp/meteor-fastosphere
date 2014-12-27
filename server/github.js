
var gitRemaining = 9999999;

githubUpdate = function (p) {
  var giturl = p && p.meteor && p.meteor.version && p.meteor.version.git || '';
//  console.log('git', giturl);
  if(!giturl) return;

  var re = /^https?:\/\/github\.com\/([^\/]+)\/(.*?)(?:\.git)?$/gm; 
  var m = re.exec(giturl);
//    console.log('m', m);

  if(!m) return;

  console.log('g', gitRemaining);
  if(gitRemaining < 500) return console.log('Not enough git remaining to try', gitRemaining);

  var userAgent = "Meteor";
  if (Meteor.release) userAgent += "/" + Meteor.release;

  try {
    // get github info
    var res = HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'?client_id=000dbbc3c779d4426d8e&client_secret=b57e2f9830282014280e426df412d5921a825be6', { headers: { Accept: 'application/json', "User-Agent": userAgent } });

    gitRemaining = +res.headers['x-ratelimit-remaining'];
    //console.log('res', res);
    Packages.update(p._id, { $set: { updateAlgolia: true, git: res.data } });

    // try to get changelog
    res = HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'/contents'+'?client_id=000dbbc3c779d4426d8e&client_secret=b57e2f9830282014280e426df412d5921a825be6', { headers: { Accept: 'application/json', "User-Agent": userAgent } });
    gitRemaining = +res.headers['x-ratelimit-remaining'];

    res.data.forEach(function(f) {
      if(_.indexOf(['history.md', 'changelog.md'], f.name.toLowerCase()) != -1) {
        console.log('found', p.meteor.package.name, f.name);

        res = HTTP.get(f.download_url);
        Packages.update(p._id, { $set: { changelog: res.content } });
      }
    });

  } catch(e) {
    gitRemaining = +e.response.headers['x-ratelimit-remaining'];
    Packages.update(p._id, { $set: { 'meteor.version.badgit': true } });
    return console.error('Error getting info about git', m, e);
  }

//      console.log('res', res);
//      Packages.update(p._id, { $set: { git: res.data } });
};

var githubsUpdateInProgress = false;
githubsUpdate = function() {
  if(githubsUpdateInProgress) return console.log('githubsUpdate already in progress');

  githubsUpdateInProgress = true;

  Packages.find({
    updateGit: true,
    'meteor.version.git': { $exists: true, $nin: ['', null] } }).forEach(function (p) {
    githubUpdate(p);
  });
  Packages.update({ updateGit: true }, { $unset: { updateGit: '' } }, { multi: true });

  Packages.find({
    git: { $exists: false }, 
    'meteor.version.badgit': { $exists: false },
    'meteor.version.git': { $exists: true, $nin: ['', null] } },
    { limit: 20 }).forEach(function (p) {
    githubUpdate(p);
  });

  githubsUpdateInProgress = false;
};

//updateGits();
