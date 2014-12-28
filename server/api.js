Router.route('/api/changelog', { where: 'server' })
  .post(function () {
    if(!this.request.body || !this.request.body.versions)
      this.response.end('no body');

    var str = '';

    var packages = this.request.body.versions.split('\n');

    var verbose = this.request.body.verbose || false;
//console.log('ver', verbose);
//console.log('pac', packages);

    var tokens = [];

  	packages.forEach(function (p) {
      var pa = p.split('@');
      if(pa.length !== 2) return;
      var subtokens = changelog(pa[0], pa[1], verbose);
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

    if(!tokens.length) {
      tokens.push({ type: 'heading', depth: 1, text: 'Congrats, this project is up to date!' });
    }

//    console.log('tok', tokens);

//console.log('str', str);
    this.response.end(JSON.stringify(tokens));
  });
