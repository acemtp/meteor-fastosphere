
var atmosphereUpdateInProgress = false;

atmosphereUpdate = function () {
  if(atmosphereUpdateInProgress) return console.log('atmosphereUpdate already in progress');
  atmosphereUpdateInProgress = true;

  console.log('Get packages from Atmosphere...');
  var cnx = DDP.connect('https://atmospherejs.com');
  var pcnx = new Mongo.Collection('packages', { connection: cnx });
  var array = [];

  cnx.subscribe('packages/search', '.', 4000, function () {

    pcnx.find().forEach(function (p) {
      var cp = Packages.findOne({ name: p.name });
      if(cp) {
        Packages.update(cp._id, { $set: { updateAlgolia: true, atmo: p } });
      } else {
        console.error('  Package in Atmosphere but not in my collection ignore it', p.name);
//        Packages.insert({ _id: p._id, updateAlgolia: true, atmo: p });
      }
    });

    cnx.disconnect();
    console.log('Done');

    algoliaUpdate(false);
    atmosphereUpdateInProgress = false;
  });
};
