Router.route('/api/changelog', { where: 'server' })
  .post(function () {
    // POST /webhooks/stripe
//    console.log(this.request.body.release);
    console.log(this.request.body.versions);

    var str = '';

    var packages = this.request.body.versions.split('\n');

//console.log('pac', packages);

    var tokens = [];

  	packages.forEach(function (p) {
      var pa = p.split('@');
      if(pa.length !== 2) return;
      var subtokens = changelog(pa[0], pa[1]);
      if(subtokens) {
        var title = pa[0] + ' (local ' +  pa[1] + ')';
        tokens.push({ type: 'heading', depth: 1, text: title });
        tokens = tokens.concat(subtokens);
/*
        var title = pa[0] + ' (local ' +  pa[1] + ')';
        str += '\n\n# ' + title + '\n\n';
        str += cl;
*/
      }
  	});

//    console.log('tok', tokens);

//console.log('str', str);
    this.response.end(JSON.stringify(tokens));
  });
