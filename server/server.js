Meteor.startup(function () {
  Meteor.setInterval(function() {
    var cnx = DDP.connect('https://atmospherejs.com');
    var Packages = new Mongo.Collection('packages', { connection: cnx });
    var array = [];
    var client = new Algolia(Meteor.settings.public.algolia_application_id, Meteor.settings.algolia_private_id);
    var index = client.initIndex("Packages");
    cnx.subscribe('packages/search', '.', 4000, function() {
      Packages.find().forEach(function (p) {
        p.objectID = p._id;
        array.push(p);
      });
      index.saveObjects(array, function(error, content) {
        if (error) console.error(Date(), 'ERROR:', content.message);
        else console.log(Date(), 'DONE', array.length, Packages.find().count());
      });
    });
  }, 1000*60*60*12);
});
