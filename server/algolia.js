
var client = new Algolia(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
var index = client.initIndex("PackagesTest");

algoliaReset = function () {
  index.clearIndex(function(error, content) {
    console.log(error, content);
  });
};


algoliaUpdate = function (force) {
//  console.log('Update Algolia index...');
  var array = [];
  var selector = { meteor: { $exists: true } };
  if(!force) selector.updateAlgolia = true;
  Packages.find(selector).forEach(function(p) {
    var score = 0;
    if(p.git)
      score = p.git.stargazers_count;
    if(p.meteor.version && p.meteor.version.git)
      score++;
    if(p.changelog)
      score = score * 1.5;

    if(p.meteor.version && p.meteor.version.unmigrated)
      score = -1;
    array.push({
      objectID: p._id,
      name: p.meteor.package && p.meteor.package.name || '[noname]',
      description: p.meteor.version && p.meteor.version.description || '[nodescription]',
      score: score,
      version: p.meteor.version && p.meteor.version.version || '0.0.0',
      lastUpdated: p.meteor.version && p.meteor.version.lastUpdated || new Date(1970),
      starCount: p.git && p.git.stargazers_count || 0,
      gitUrl: p.meteor.version && p.meteor.version.git || '',
      deleted: p.meteor.version && p.meteor.version.unmigrated || false,
    });
  });
  Packages.update({ updateAlgolia: true }, { $unset: { updateAlgolia: '' } }, { multi: true });

  if(array.length) {
    index.saveObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log('Updated ' + array.length + ' packages to Algolia');
    });
  }
//  console.log('Done, updated ' + array.length + ' packages.');
};

