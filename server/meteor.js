// add a updatedAt and parse regularly oldest packages

/*
packages
{ name: 'lokvin:errors',
  maintainers: [Object],
  lastUpdated: Fri Dec 26 2014 15:33:06 GMT+0100 (CET),
  _id: 'Ew6dnvztFt7pk4BSq'
},

versions
{ _id: 'mbQKaSjpeXfSyim48',
  compilerVersion: 'meteor/15',
  containsPlugins: true,
  debugOnly: false,
  dependencies: { meteor: [Object] },
  description: 'just for test',
  earliestCompatibleVersion: '1.0.0',
  ecRecordFormat: '1.0',
  git: 'https://github.com/acemtp/meteor-csm.git',
  lastUpdated: Fri Dec 26 2014 15:41:41 GMT+0100 (CET),
  longDescription: null,
  packageName: 'acemtp:test',
  published: Fri Dec 26 2014 15:36:08 GMT+0100 (CET),
  publishedBy: { username: 'acemtp', id: 'oeMmRb6pC6n9H3DHL' },
  releaseName: 'METEOR@1.0.2.1',
  source:
   { url: 'https://warehouse.meteor.com/sources/oeMmRb6pC6n9H3DHL/1419604567309/2DC5kW2nBw/acemtp:test-1.0.3-source.tgz',
     tarballHash: 'FyF+5YFaoBce9Jv7IUlRirXDDhO9dsHPcI4VBcnvAao=',
     treeHash: '2c56EvdbXy9hjM3iAjHkM9msWVpWA8AWZ82mfevWpCI=' },
  unmigrated: true,
  version: '1.0.3'
}

builds
{ buildArchitectures: 'os+web.browser+web.cordova',
  builtBy: { username: 'acemtp', id: 'oeMmRb6pC6n9H3DHL' },
  build:
   { url: 'https://warehouse.meteor.com/builds/dBXwPW8deP8e78hY7/1419604568422/PAStFT5CzE/acemtp:test-1.0.3-os+web.browser+web.cordova.tgz',
     tarballHash: 'FUPcvllUqLpx39TsvoGx9sx/mhz6HByhRv/bbaNN84U=',
     treeHash: 'cCOzX35rgeZUNZ22GkjSIJPtHClWbyCbnySdXVQtzmw=' },
  versionId: 'mbQKaSjpeXfSyim48',
  lastUpdated: Fri Dec 26 2014 15:36:09 GMT+0100 (CET),
  _id: 'wWEokw6P2oZBYP9Da',
  buildPublished: Fri Dec 26 2014 15:36:09 GMT+0100 (CET)
}
*/

var SyncTokens = new Mongo.Collection('syncTokens');

//var MeteorLogs = new Mongo.Collection('meteorLogs');

var count = 1;
var remote;
/*
syncToken = { lastDeletion: 1409018311766,
  format: '1.0',
  packages: 1419604567187,
  versions: 1419604568239,
  builds: 1419604569035,
  releaseTracks: 1419141755611,
  releaseVersions: 1419298444109
};
*/

meteorResetSyncTokens = function () {
  SyncTokens.remove();
  console.log('SyncTokens removed, resync from the start.');
  meteorUpdate();
};


packageRequest = function (cb) {
  remote.call('syncNewPackageData', SyncTokens.findOne() ? _.omit(SyncTokens.findOne(), '_id') : { format: '1.1' }, {/* shortPagesForTest: true */}, function (err, res) {
    //console.log('  Page', count++);
    if (err) return console.log('error', err);
    if (!res) return console.log('no result');
/*
console.log('res', res);
console.log('col', res.collections);
console.log('pa', res.collections.packages);
console.log('ver', res.collections.versions);
console.log('build', res.collections.builds);
console.log('ret', res.collections.releaseTracks);
console.log('rev', res.collections.releaseVersions);
*/

//    MeteorLogs.insert({ data: JSON.stringify(res) });

    if(res.resetData) {
      console.log('  Meteor asks me to reset data');
//      Packages.update({}, { $unset: { meteor: '' } }, { multi: true });
///      MeteorLogs.remove();
//      algoliaReset();
    } else {
//      console.log('no reset data');
    }

    _.each(res.collections.packages, function(p) {
//      console.log('  package', p._id, p.name);
      var cp = Packages.findOne({ 'name': p.name });
      if(cp) {
///        console.log('Update package', p.name);
        try {
          Packages.update(cp._id, { $set: { updateAlgolia: true, name: p.name, 'meteor.package': p } });
        } catch(e) {
          console.error('ERROR update package', cp, p, e);
        }
      } else {
///        console.log('New package', p.name);
        try {
          Packages.insert({ updateAlgolia: true, name: p.name, meteor: { package: p } });
        } catch(e) {
          console.error('ERROR insert package', p, e);
        }
      }
    });

    _.each(res.collections.versions, function(v) {
///      console.log('New version', v.packageName, v.version);

      var cp = Packages.findOne({ 'name': v.packageName });

      // remove dependencies because we don't need it and it generates error with stevezhu:velocity.js
      delete v.dependencies;
      if(cp) {
        if(!cp.meteor || !cp.meteor.version || semverCompare(v.version, cp.meteor.version.version) >= 0) {
///          console.log('  Update version', v.packageName, (cp.meteor && cp.meteor.version) ? cp.meteor.version.version : '0.0.0', '<', v.version);
          try {
            if(cp.meteor && cp.meteor.version && cp.meteor.version.git !== v.git)
              Packages.update(cp._id, { $set: { updateGit: true } });

            Packages.update(cp._id, { $set: { updateAlgolia: true, name: v.packageName, 'meteor.version': v } });
          } catch(e) {
            console.error('ERROR update version', cp, v, e);
          }
        } else {
///          console.log('  Ignore version ', v.packageName, (cp.meteor && cp.meteor.version) ? cp.meteor.version.version : '0.0.0', '>', v.version);
        }
      } else {
//        console.log('  No package for this version', v);
        try {
          Packages.insert({ updateAlgolia: true, name: v.packageName, meteor: { version: v } });
        } catch(e) {
          console.error('ERROR insert version', v, e);
        }
      }
    });

    if(res.syncToken) {
      SyncTokens.update('syncTokens', _.extend(res.syncToken || {}, { _id: 'syncTokens'} ), { upsert: true });
    }

    // Using setImmediate to allow GC to run each time in case there are a LOT of pages
    if (!res.upToDate) setImmediate(Meteor.bindEnvironment(packageRequest.bind(this, cb)));
    else cb();
  });
};

var meteorUpdateInProgress = false;

meteorUpdate = function () {
  if(meteorUpdateInProgress) return console.log('METEOR: Update already in progress');
  meteorUpdateInProgress = true;

  //console.log('METEOR: Updating packages from Meteor...');
  count = 1;
  remote = remote || DDP.connect('http://packages.meteor.com');
  packageRequest(function () {
    //console.log('METEOR: Updated');
    algoliaUpdate(false);
    meteorUpdateInProgress = false;
  });
};

// create METEOR special package to be able to get changelog
meteorCreateMeteorPackage = function () {
  Packages.remove({ name: 'METEOR' });
  var id = Packages.insert({ name: 'METEOR', meteor: { version: { git: 'https://github.com/meteor/meteor' } } });
  githubUpdate(Packages.findOne(id));
};

Meteor.startup(function () {
  meteorCreateMeteorPackage();
});

Meteor.methods({
  meteorUpdate: function () {
    if(isAdmin(this.userId)) {
      meteorUpdate();
    }
  },
  meteorResetSyncTokens: function () {
    if(isAdmin(this.userId))
      meteorResetSyncTokens();
  },
  meteorCreateMeteorPackage : function () {
    if(isAdmin(this.userId))
      meteorCreateMeteorPackage();
  }
});


SyncedCron.add({
  name: 'METEOR: Update',
  schedule: function(parser) {
    return parser.text('every 10 seconds');
  },
  job: function() {
    var before = moment();
    meteorUpdate();
    return 'METEOR: Took' + moment().diff(before)/1000 + ' seconds';
  }
});

//meteorUpdate();
