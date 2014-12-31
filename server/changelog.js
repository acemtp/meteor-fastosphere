

changelog = function (packageName, currentVersion, verbose) {
  var msg;
  var p = Packages.findOne({ name: packageName });
  if (!p) {
    msg = 'Package "' + packageName + '" not found';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }
  if(p.meteor && p.meteor.version && p.meteor.version.unmigrated) {
    msg = '**`Package "' + packageName + '" WAS DELETED. YOU SHOULD NOT USE IT ANYMORE`**';
    console.log(msg);
    return { type: 'text', text: msg };
  }
  if (!p.changelog) {
    msg = 'Package "' + packageName + '" doesn\'t have changelog';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  var tokens = marked.lexer(p.changelog, { gfm: true });

  for(var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if(t.type === 'heading') {
      var ver = semverExtract(t.text);
      if(ver && currentVersion) {
        var comp = semverCompare(ver, currentVersion);
        if(ver === currentVersion || (comp !== undefined && comp <= 0)) {
          console.log('Found a changelog version', packageName, t);
          break;
        }
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
