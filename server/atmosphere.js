
let atmosphereUpdateInProgress = false;

const atmosphereUpdate = () => {
  if (atmosphereUpdateInProgress) return console.log('ATMO: Update already in progress');
  atmosphereUpdateInProgress = true;
  const before = moment();

  console.log('ATMO: Updating packages...');

  const cnx = DDP.connect('https://atmospherejs.com');
  if (!cnx) return console.error('ATMO: Cannot connect to atmosphere');

  try {
    let page = 0;
    const size = 100;
    while (true) {
      console.log('ATMO:   getting', page, size);
      const res = cnx.call('Search.query', '', page, size);

      _.each(res.packages, p => {
        const cp = Packages.findOne({ name: p.name });
        if (cp) {
          Packages.update(cp._id, { $set: { updateAlgolia: true, atmoUpdatedAt: new Date(), atmo: p } });
        } else {
          console.error('ATMO:  Package is in Atmosphere but not in my collection ignore it', p.name);
        }
      });

      // stop if we have all packages
      if (res.packages.length < size) break;
      else page += size;
    }
  } catch (e) {
    console.error('ATMO: Exception while getting packages', e);
  }

  cnx.disconnect();

  console.log('ATMO: Updated', moment().diff(before) / 1000, 'seconds');
  atmosphereUpdateInProgress = false;

  algoliaUpdate(false);

/* old way to get atmosphere packages info, deprecated
  var cnx = DDP.connect('https://atmospherejs.com');
  var pcnx = new Mongo.Collection('packages', { connection: cnx });
  var array = [];

  cnx.subscribe('packages/search', '.', 4000, function () {
    pcnx.find().forEach(function (p) {
      var cp = Packages.findOne({ name: p.name });
      if (cp) {
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
  atmosphereUpdate() {
    if (!isAdmin(this.userId)) return;
    atmosphereUpdate();
  },
});


SyncedCron.add({
  name: 'ATMO: Update',
  schedule(parser) { return parser.text('every 12 hours'); },
  job() { atmosphereUpdate(); },
});

// atmosphereUpdate();
