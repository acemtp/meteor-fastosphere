
const client = AlgoliaSearch(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
const index = client.initIndex(Meteor.settings.public.production ? 'Packages' : 'PackagesTest');

algoliaReset = () => {
  console.log('ALGOLIA: reset index');
  index.clearIndex((error, content) => { console.log('ALGOLIA: reset index result', error, content); });
};

let algoliaUpdateInProgress = false;

algoliaUpdate = (force) => {
  if (algoliaUpdateInProgress) return console.log('ALGOLIA: Update already in progress');
  algoliaUpdateInProgress = true;
  const before = moment();

  let array = [];
  let selector = { meteor: { $exists: true } };

  if (force) {
    algoliaReset();
  } else {
    selector.updateAlgolia = true;
  }

  Packages.find(selector).forEach(p => {
    // Discard meteor because they never follow semver!!!
    if (p.name === 'METEOR') return;

    let score = 0;
    if (p.atmo) score = p.atmo.score;
    // if (p.git && p.git.stargazers_count > score) score = p.git.stargazers_count;
    if (p.meteor.version && p.meteor.version.git) score++;

    // Tweak Atmosphere score

    // higher if has a git
    if (p.git) score *= 1.2;

    // higher if has a changelog
    if (p.changelog) score *= 1.4;

    // higher if lot of git stars
    if (p.git && p.git.stargazers_count > 10000) score *= 100;
    else if (p.git && p.git.stargazers_count > 1000) score *= 10;
    else if (p.git && p.git.stargazers_count > 100) score *= 2;

    // lower if MDG package
    if (p.name.indexOf(':') === -1) score /= 2;

    // negative if deleted package
    if (p.meteor.version && p.meteor.version.unmigrated) score = -1;

    let starCount = 0;
    if (p.git) starCount += p.git.stargazers_count;
    if (p.atmo) starCount += p.atmo.starCount;

    array.push({
      objectID: p._id,
      name: p.name,
      description: p.meteor.version && p.meteor.version.description || '[nodescription]',
      score: score,
      atmoScore: p.atmo && p.atmo.score || 0,
      version: p.meteor.version && p.meteor.version.version || '0.0.0',
      lastUpdated: p.meteor.version && p.meteor.version.lastUpdated || new Date(1970),
      starCount: starCount,
      gitStarCount: p.git && p.git.stargazers_count || 0,
      atmoStarCount: p.atmo && p.atmo.starCount || 0,
      gitUrl: p.meteor.version && p.meteor.version.git || '',
      deleted: p.meteor.version && p.meteor.version.unmigrated || false,
      badgit: p.meteor.version && (p.meteor.version.badgit || p.meteor.version.git === null || p.meteor.version.git === ''),
      downloadCounts: p.meteorstat || {},
      readme: p.readme && p.readme.substr(0, 90000) || '',
      changelogUrl: p.changelogUrl,
      changelog: p.changelog && p.changelog.substr(0, 10000) || '',
    });
  });
  Packages.update({ updateAlgolia: true }, { $unset: { updateAlgolia: '' } }, { multi: true });

  if (array.length) {
    // let s = 0;
    // _.each(array, p => {
    //   const ss = JSON.stringify(p).length;
    //   s += ss;
    //   if (ss > 100000) console.log(p.name, ss);
    // });
    // console.log('s', s);

    index.saveObjects(array, (err, res) => {
      if (err) console.error(Date(), 'ERROR:', err, res);
      else console.log('ALGOLIA: Updated ' + array.length + ' packages', moment().diff(before) / 1000, 'seconds');
      algoliaUpdateInProgress = false;
    });
  }
  algoliaUpdateInProgress = false;
};


Meteor.methods({
  algoliaUpdate() {
    if (!isAdmin(this.userId)) return;
    algoliaUpdate(true);
  },
});
