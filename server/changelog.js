
changelog = (packageName, currentVersion, verbose) => {
  let msg;
  const p = Packages.findOne({ name: packageName });
  if (!p) {
    msg = 'Package "' + packageName + '" not found';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }
  if (p.meteor && p.meteor.version && p.meteor.version.unmigrated) {
    msg = '**`Package "' + packageName + '" WAS DELETED. YOU SHOULD NOT USE IT ANYMORE`**';
    console.log(msg);
    return { type: 'text', text: msg };
  }
  if (!p.changelog) {
    msg = 'Package "' + packageName + '" doesn\'t have changelog';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  const tokens = marked.lexer(p.changelog, { gfm: true });

  let i;
  for (i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading') {
      const ver = semverExtract(t.text);
      if (ver && currentVersion) {
        const comp = semverCompare(ver, currentVersion);
        if (ver === currentVersion || (comp !== undefined && comp <= 0)) {
          console.log('Found a changelog version', packageName, t);
          break;
        }
      }
    }
  }

  if (i <= 1 || i === tokens.length) {
    msg = 'Version "' + currentVersion + '" is not found in the changelog of package "' + packageName + '"';
    console.log(msg);
    return verbose ? { type: 'heading', depth: 2, text: msg } : undefined;
  }

  const subtokens = tokens.slice(0, i);

  // main title is always the package name so we change title depth if needed
  if (_.find(subtokens, st => { return st.type === 'heading' && st.depth === 1; })) {
    subtokens.forEach(st => {
      if (st.type === 'heading') st.depth++;
    });
  }
  return subtokens;
};
