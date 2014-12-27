
atmosphereUpdate = function () {

//  Packages._ensureIndex('atmo.name', {sparse: 1});
//  Packages._ensureIndex('_id', {unique: 1, sparse: 1});

var start = new Date().getTime() / 1000;
//  console.log('Get packages from Atmosphere...');
  var cnx = DDP.connect('https://atmospherejs.com');
  var pcnx = new Mongo.Collection('packages', { connection: cnx });
  var array = [];
var start2 = new Date().getTime() / 1000;
  cnx.subscribe('packages/search', '.', 4000, function () {
    var middle = new Date().getTime() / 1000;

console.log('nb flag before', Packages.find({ flagDelete: { $exists: true } }).count());

    Packages.update({}, { $set: { flagDelete: true } }, { multi: true });

console.log('nb flag before2', Packages.find({ flagDelete: { $exists: true } }).count());

    pcnx.find().forEach(function (p) {
      p.objectID = p._id;
      p.deleted = true;
      if(Packages.findOne({ 'atmo.name': p.name })) {
        Packages.update(p._id, { $set: { atmo: p, flagDelete: false } });
        delete p.deleted;
      } else {
        console.log('  New package', p.name);
        Packages.insert({ _id: p._id, atmo: p });
        delete p.deleted;
      }
      array.push(p);
    });

console.log('nb flag d', Packages.find({ flagDelete: { $exists: true } }).count());
console.log('nb flag d true', Packages.find({ flagDelete: true }).count());
console.log('nb flag d false', Packages.find({ flagDelete: false }).count());

    Packages.update({ flagDelete: true }, { $set: { 'atmo.deleted': true } }, { multi: true });
    Packages.update({}, { $unset: { flagDelete: '' } }, { multi: true });

console.log('nb flag after', Packages.find({ flagDelete: { $exists: true } }).count());

//    console.log('ff', array);
/*
    var client = new Algolia(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
    var index = client.initIndex("Packages");

    index.clearIndex(function(error, content) {
      console.log(content);
    });

    index.saveObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log(Date(), 'DONE', array.length);
    });
*/
/*
    index.deleteObjects(array, function(error, content) {
      if (error) console.error(Date(), 'ERROR:', content.message);
      else console.log(Date(), 'DONE', array.length, Packages.find().count());
    });
*/
    cnx.disconnect();
    console.log('Done');
var end = new Date().getTime() / 1000;
console.log('co atmo time', start2-start);
console.log('get atmo time', middle-start2);
console.log('update db time', end-middle);
console.log('total time', end-start);
  });
};
