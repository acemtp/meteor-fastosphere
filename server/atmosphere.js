
var atmosphereUpdateInProgress = false;

atmosphereUpdate = function () {
  if(atmosphereUpdateInProgress) return console.log('ATMO: Update already in progress');
  atmosphereUpdateInProgress = true;

  console.log('ATMO: Updating packages...');

  var cnx = DDP.connect('https://atmospherejs.com');
  if(!cnx) return console.error('ATMO: Cannot connect to atmosphere');

  try {
    var page = 0, size = 100;
    while(true) {
      console.log('ATMO:   getting', page, size);
      var res = cnx.call('Search.query', '', page, size);

      _.each(res.packages, function (p) {
        var cp = Packages.findOne({ name: p.name });
        if(cp) {
          Packages.update(cp._id, { $set: { updateAlgolia: true, atmo: p } });
        } else {
          console.error('ATMO:  Package is in Atmosphere but not in my collection ignore it', p.name);
        }
      });

      // stop if we have all packages
      if(res.packages.length < size) break;
      else page += size;
    }
  } catch (e) {
    console.error('ATMO: Exception while getting packages', e);
  }

  cnx.disconnect();
  console.log('ATMO: Updated');

  algoliaUpdate(false);
  atmosphereUpdateInProgress = false;

/* old way to get atmosphere packages info, deprecated
  var cnx = DDP.connect('https://atmospherejs.com');
  var pcnx = new Mongo.Collection('packages', { connection: cnx });
  var array = [];

  cnx.subscribe('packages/search', '.', 4000, function () {
    pcnx.find().forEach(function (p) {
      var cp = Packages.findOne({ name: p.name });
      if(cp) {
        Packages.update(cp._id, { $set: { updateAlgolia: true, atmo: p } });
      } else {
        console.error('ATMO:  Package in Atmosphere but not in my collection ignore it', p.name);
//        Packages.insert({ _id: p._id, updateAlgolia: true, atmo: p });
      }
    });

    cnx.disconnect();
    console.log('ATMO: Done');

    algoliaUpdate(false);
    atmosphereUpdateInProgress = false;
  });
*/
};


Meteor.methods({
  atmosphereUpdate: function () {
    if(isAdmin(this.userId))
      atmosphereUpdate();
  },
});


SyncedCron.add({
  name: 'ATMO: Update',
  schedule: function(parser) {
    return parser.text('every 12 hours');
  },
  job: function() {
    var before = moment();
    atmosphereUpdate();
    return 'ATMO: Took' + moment().diff(before)/1000 + ' seconds';
  }
});

//atmosphereUpdate();
