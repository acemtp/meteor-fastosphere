
let gitRemaining = 9999999;

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
    // Get github info
    let res;

    res = HTTP.get('https://api.github.com/repos/' + m[1] + '/' + m[2] + '?client_id=' + Meteor.settings.github_client_id + '&client_secret=' + Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', 'User-Agent': userAgent } });

    gitRemaining = +res.headers['x-ratelimit-remaining'];

    Packages.update(p._id, { $set: { updateAlgolia: true, git: res.data } });

    // Try to get changelog
    res = HTTP.get('https://api.github.com/repos/' + m[1] + '/' + m[2] + '/contents' + '?client_id=' + Meteor.settings.github_client_id + '&client_secret='+Meteor.settings.github_client_secret, { headers: { Accept: 'application/json', 'User-Agent': userAgent } });
    gitRemaining = +res.headers['x-ratelimit-remaining'];

    res.data.forEach(f => {
      if (_.indexOf(['history.md', 'changelog.md'], f.name.toLowerCase()) !== -1) {
        console.log('  Found changelog in', p.name, f.name);

        res = HTTP.get(f.download_url);
        Packages.update(p._id, { $set: { updateAlgolia: true, changelogUrl: f.download_url, changelog: res.content } });
      }
    });
  } catch (e) {
    if (e && e.response && e.response.headers && e.response.headers['x-ratelimit-remaining']) {
      gitRemaining = +e.response.headers['x-ratelimit-remaining'];
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

const githubsUpdate = limit => {
  console.log('GITHUB: Updating...');
  if (githubsUpdateInProgress) return console.log('GITHUB: Update already in progress');

  githubsUpdateInProgress = true;

  // Update those who are marked as need to update
  Packages.find({ updateGit: true }).forEach(p => { githubUpdate(p); });
  Packages.update({ updateGit: true }, { $unset: { updateGit: '' } }, { multi: true });

  // Update those who we never tried
  const needUpdate = Packages.find({ git: { $exists: false }, 'meteor.version.badgit': { $exists: false } }, { limit: limit || 100 });
  console.log(' needUpdate', needUpdate.count());
  needUpdate.forEach(p => {
    githubUpdate(p);
  });

  githubsUpdateInProgress = false;
  console.log('GITHUB: Updated');
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
  schedule(parser) {
    return parser.text('every 10 minutes');
  },
  job() {
    const before = moment();
    githubsUpdate();
    return 'GIT: Took' + moment().diff(before) / 1000 + ' seconds';
  },
});

// githubsUpdate();
