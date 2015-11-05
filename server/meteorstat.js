/*
{"name":"255kb:meteor-status","version":"1.2.0","totalAdds":1,"directAdds":1}
*/

MeteorStats = new Mongo.Collection('meteorStats');

let meteorstatUpdateInProgress = false;

// Recompute packages stats based on MeteorStats data
const meteorstatUpdate = () => {
  if (meteorstatUpdateInProgress) return console.log('METEORSTAT: Update already in progress');
  meteorstatUpdateInProgress = true;
  const before = moment();

  console.log('METEORSTAT: Updating packages with Meteor stats...');

  let stats = {};
  console.log('METEORSTAT: Compute all downloads...');
  MeteorStats.find().forEach(s => {
    _.each(s.stats, (p, n) => {
      if (!stats[n]) stats[n] = { totalAdds: 0, directAdds: 0, lastWeekTotalAdds: 0, lastWeekDirectAdds: 0, lastMonthTotalAdds: 0, lastMonthDirectAdds: 0 };
      stats[n].totalAdds += p.totalAdds;
      stats[n].directAdds += p.directAdds;
    });
  });
  console.log('METEORSTAT: Compute last month downloads...');
  MeteorStats.find({ date: { $gt: moment().add(-30, 'days').toDate() } }).forEach(s => {
    _.each(s.stats, (p, n) => {
      stats[n].lastMonthTotalAdds += p.totalAdds;
      stats[n].lastMonthDirectAdds += p.directAdds;
    });
  });
  console.log('METEORSTAT: Compute last week downloads...');
  MeteorStats.find({ date: { $gt: moment().add(-7, 'days').toDate() } }).forEach(s => {
    _.each(s.stats, (p, n) => {
      stats[n].lastWeekTotalAdds += p.totalAdds;
      stats[n].lastWeekDirectAdds += p.directAdds;
    });
  });

  console.log('METEORSTAT: Clearing all stats...');
  Packages.update({}, { $unset: { meteorstat: '' } }, { multi: true });

  console.log('METEORSTAT: Filling new stats...');
  _.each(stats, (p, n) => {
    const name = n.replace(/#/g, '.');
//    const cp = Packages.findOne({ name: pname });
//    if (cp) {
//      Packages.update(cp._id, { $set: { updateAlgolia: true, meteorstat: p } });
    Packages.update({ name }, { $set: { updateAlgolia: true, meteorstat: p } });
//    } else {
//      console.error('METEORSTAT: Package is in meteorstat but not in my collection ignore it', p.name);
//    }
  });

  console.log('METEORSTAT: Updated', moment().diff(before) / 1000, 'seconds');
  meteorstatUpdateInProgress = false;
  algoliaUpdate(false);
};

// Get all files from Meteor stats since the beginning but skip those we already have in db
const meteorstatGet = () => {
  let date = moment('2014-08-20');

  console.log('METEORSTATGET: Updating packages with Meteor stats get...');

  while (true) {
    if (!MeteorStats.findOne({ date: date.toDate() })) {
      console.log('Try to get', date.format('YYYY-MM-DD'));
      HTTP.get('http://packages.meteor.com/stats/v1/' + date.format('YYYY-MM-DD'), (date, err, res) => {
        console.log(date.format('YYYY-MM-DD'), err);
        if (!err && res.statusCode === 200) {
          let stats = {};

          const jsons = res.content.split('\n');
          _.each(jsons, json => {
            if (json.length < 1) return;
            const p = JSON.parse(json);
            p.name = p.name.replace(/\./g, '#');
            if (!stats[p.name]) stats[p.name] = { totalAdds: p.totalAdds, directAdds: p.directAdds };
            else {
              stats[p.name].totalAdds += p.totalAdds;
              stats[p.name].directAdds += p.directAdds;
            }
          });

          MeteorStats.upsert({ date: date.toDate() }, { $set: {
            dateStr: date.format('YYYY-MM-DD'),
            yearStr: date.format('YYYY'),
            monthStr: date.format('MM'),
            dayStr: date.format('DD'),
            stats,
          } });
        }
      }.bind(null, date.clone()));
    }
    date = date.add(1, 'days');
    if (moment().diff(date) < 0) break;
  }
  console.log('METEORSTATGET: Updated');
};

SyncedCron.add({
  name: 'METEORSTAT: Get',
  schedule(parser) { return parser.text('at 1:00 am'); },
  job() { meteorstatGet(); },
});

SyncedCron.add({
  name: 'METEORSTAT: Update',
  schedule(parser) { return parser.text('at 2:00 am'); },
  job() { meteorstatUpdate(); },
});

Meteor.methods({
  meteorstatUpdate() {
    if (!isAdmin(this.userId)) return;
    meteorstatUpdate();
  },
  meteorstatGet() {
    if (!isAdmin(this.userId)) return;
    meteorstatGet();
  },
  meteorstatReset() {
    if (!isAdmin(this.userId)) return;
    MeteorStats.remove({});
  },
});

// meteorstatUpdate();
