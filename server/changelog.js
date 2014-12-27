
// try to extract a basic semver (X.X or X.X.X) from the string
var semverClean = function (string) {
  var re = /(\d+\.\d+(?:\.\d+)?)/gm; 
  var m = re.exec(string);
  var semver;
  if(m) {
    semver = m[0];
    if(semver.split('.').length === 2) semver += '.0';
  }
  return semver;
};


changelog = function (packageName, currentVersion, verbose) {
  var msg;
  var p = Packages.findOne({ 'meteor.package.name': packageName });
  if (!p) {
    msg = 'Package "' + packageName + '" not found';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }
  if (!p.changelog) {
    msg = 'Package "' + packageName + '" doesn\'t have changelog';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  var tokens = marked.lexer(p.changelog, { gfm: true });

  var semver = Meteor.npmRequire('semver');

  currentVersion = semverClean(currentVersion);

  for(var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if(t.type === 'heading') {
      var ver = semverClean(t.text);

      if(ver && currentVersion && semver.lte(ver, currentVersion)) {
        console.log('found', packageName, t);
        break;
      }
    }
  }

  if(i <= 1 || i === tokens.length) {
    msg = 'Version "' + currentVersion + '" is not found in the changelog of package "' + packageName + '"';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  var subtokens = tokens.slice(0, i);

  // main title is always the package name so we change title depth if needed
  if(_.find(subtokens, function(st) { return st.type === 'heading' && st.depth === 1; })) {
    subtokens.forEach(function (st) {
      if(st.type === 'heading') st.depth++;
    });
  }
  return subtokens;
};
