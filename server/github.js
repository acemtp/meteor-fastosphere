
// let gitRemaining = 9999999;

const githubBadGit = p => {
  if (!p) return;
  Packages.update(p._id, { $set: { 'meteor.version.badgit': true } });
  if (p.meteor && p.meteor.version && !p.meteor.version.badgit) console.log('  Bad github url', p.name, p.meteor.version.git);
};

githubUpdate = p => {
  if (!p) return undefined;

  const giturl = p.meteor && p.meteor.version && p.meteor.version.git || '';

  if (!giturl) return githubBadGit(p);

  const re = /^https?:\/\/github\.com\/([^\/]+)\/(.*?)(?:\.git)?$/gm;
  const m = re.exec(giturl);

  if (!m) return githubBadGit(p);

  const userAgent = 'Meteor' + (Meteor.release ? '/' + Meteor.release : '');

  try {
    let res;

    // Get github package info
    res = HTTP.get('https://api.github.com/repos/' + m[1] + '/' + m[2] + '?client_id=' + Meteor.settings.github_client_id + '&client_secret=' + Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', 'User-Agent': userAgent } });

    // gitRemaining = +res.headers['x-ratelimit-remaining'];

    Packages.update(p._id, { $set: { updateAlgolia: true, gitUpdatedAt: new Date(), git: res.data } });

    // Get the repo filenames
    res = HTTP.get('https://api.github.com/repos/' + m[1] + '/' + m[2] + '/contents' + '?client_id=' + Meteor.settings.github_client_id + '&client_secret=' + Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', 'User-Agent': userAgent } });
    // gitRemaining = +res.headers['x-ratelimit-remaining'];

    res.data.forEach(f => {
      if (_.indexOf(['history.md', 'changelog.md'], f.name.toLowerCase()) !== -1) {
        console.log('  Found changelog in', p.name, f.name);

        // Get the change log
        res = HTTP.get(f.download_url);
        Packages.update(p._id, { $set: { updateAlgolia: true, changelogUpdatedAt: new Date(), changelogUrl: f.download_url, changelog: res.content } });
      }
    });
  } catch (e) {
    if (e && e.response && e.response.headers && e.response.headers['x-ratelimit-remaining']) {
      // gitRemaining = +e.response.headers['x-ratelimit-remaining'];
    }

    if (e && e.response && e.response.statusCode === 404) {
      githubBadGit(p);
    } else {
      console.error('  Error getting info about git', m, e, e.response);
    }
    return undefined;
  }
};

let githubsUpdateInProgress = false;

const githubsUpdate = l => {
  if (githubsUpdateInProgress) return console.log('GITHUB: Update already in progress');
  githubsUpdateInProgress = true;
  const before = moment();

  let limit = l || 100;
  console.log('GITHUB: Updating ' + limit + '...');

  // Update those who are marked as need to update
  const markAsNeedUpdate = Packages.find({ updateGit: true });
  console.log('GITHUB:   marked as needUpdate', markAsNeedUpdate.count());
  markAsNeedUpdate.forEach(p => { githubUpdate(p); limit--; });
  Packages.update({ updateGit: true }, { $unset: { updateGit: '' } }, { multi: true });

  if (limit > 0) {
    // Update those who we never tried
    const needUpdate = Packages.find({ git: { $exists: false }, 'meteor.version.badgit': { $exists: false } }, { limit });
    console.log('GITHUB:   never tested git', needUpdate.count());
    needUpdate.forEach(p => { githubUpdate(p); limit--; });
  }

  if (limit > 0) {
    // If we have limit left, let's try to update oldest packages
    const oldUpdate = Packages.find({}, { limit, sort: { gitUpdatedAt: 1 } });
    console.log('GITHUB:   old git', oldUpdate.count());
    oldUpdate.forEach(p => { console.log('dd', limit); githubUpdate(p); limit--; });
  }

  console.log('GITHUB: Updated', moment().diff(before) / 1000, 'seconds');
  githubsUpdateInProgress = false;
};

Meteor.methods({
  githubUpdate(p) {
    check(p, String);
    if (!isAdmin(this.userId)) return;
    githubUpdate(Packages.findOne({ name: p }));
    algoliaUpdate();
  },
  githubsUpdate(limit) {
    check(limit, Number);
    if (!isAdmin(this.userId)) return;
    githubsUpdate(limit);
    algoliaUpdate();
  },
});

SyncedCron.add({
  name: 'GIT: Update',
  schedule(parser) { return parser.text('every 10 minutes'); },
  job() { githubsUpdate(); },
});

// githubsUpdate(10);
