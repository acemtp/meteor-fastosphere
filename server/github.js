
var gitRemaining = 9999999;

var githubBadGit = function (p) {
  if(!p) return;
  Packages.update(p._id, { $set: { 'meteor.version.badgit': true } });
  if(p.meteor && p.meteor.version && !p.meteor.version.badgit)
    console.log('  Bad github url', p.name, p.meteor.version.git);
};


githubUpdate = function (p) {
  if(!p) return;

  var giturl = p.meteor && p.meteor.version && p.meteor.version.git || '';
//  console.log('git', giturl);

  if(!giturl) return githubBadGit(p);

  var re = /^https?:\/\/github\.com\/([^\/]+)\/(.*?)(?:\.git)?$/gm; 
  var m = re.exec(giturl);
//    console.log('m', m);

  if(!m) return githubBadGit(p);

//  console.log('g', gitRemaining);
//  if(gitRemaining < 500) return console.log('Not enough git remaining to try', gitRemaining);

  var userAgent = "Meteor";
  if (Meteor.release) userAgent += "/" + Meteor.release;

  try {
    // get github info
    var res = HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'?client_id='+Meteor.settings.github_client_id+'&client_secret='+Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', "User-Agent": userAgent } });

    gitRemaining = +res.headers['x-ratelimit-remaining'];
    //console.log('res', res);
    Packages.update(p._id, { $set: { updateAlgolia: true, git: res.data } });

    // try to get changelog
    res = HTTP.get('https://api.github.com/repos/'+m[1]+'/'+m[2]+'/contents'+'?client_id='+Meteor.settings.github_client_id+'&client_secret='+Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', "User-Agent": userAgent } });
    gitRemaining = +res.headers['x-ratelimit-remaining'];

    res.data.forEach(function(f) {
      if(_.indexOf(['history.md', 'changelog.md'], f.name.toLowerCase()) != -1) {
        console.log('  Found changelog in', p.name, f.name);

        res = HTTP.get(f.download_url);
        Packages.update(p._id, { $set: { updateAlgolia: true, changelogUrl: f.download_url, changelog: res.content } });
      }
    });

  } catch(e) {
    if(e && e.response && e.response.headers && e.response.headers['x-ratelimit-remaining'])
      gitRemaining = +e.response.headers['x-ratelimit-remaining'];
    if(e && e.response && e.response.statusCode === 404) {
      githubBadGit(p);
    } else {
      console.error('  Error getting info about git', m, e, e.response);
    }
    return;
  }
};

var githubsUpdateInProgress = false;
githubsUpdate = function(limit) {
  console.log('Get Github...');
  if(githubsUpdateInProgress) return console.log('githubsUpdate already in progress');

  githubsUpdateInProgress = true;

  // Update those who are marked as need to update
  Packages.find({ updateGit: true }).forEach(function (p) { githubUpdate(p); });
  Packages.update({ updateGit: true }, { $unset: { updateGit: '' } }, { multi: true });

  // Update those who we never tried
  var needUpdate = Packages.find({ git: { $exists: false }, 'meteor.version.badgit': { $exists: false } }, { limit: limit||100 });
  console.log(' needUpdate', needUpdate.count());
  needUpdate.forEach(function (p) {
    githubUpdate(p);
  });

  githubsUpdateInProgress = false;
  console.log('Done');
};

//updateGits();
