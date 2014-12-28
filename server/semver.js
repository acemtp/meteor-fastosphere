
var semver = Meteor.npmRequire('semver');

// try to extract a basic semver (X.X or X.X.X) from a string
semverExtract = function (string) {
  var re = /(\d+\.\d+(?:\.\d+)*)(?:-[a-zA-Z0-9-\.]*)?(?:_[0-9]*)?(?:\+[a-zA-Z0-9-]*)?/gm;
  var m = re.exec(string);
  var semver;
  if(m) {
    semver = m[0];
    if(semver.split('.').length === 2) semver += '.0';
  }
  return semver;
};

// from https://github.com/meteor/meteor/blob/44563f13b4a3b394f9c87bc2a38a9ce4b0fc4766/tools/package-version-parser.js

var extractSemverPart = function (versionString) {
  if (!versionString) return { semver: "", wrapNum: -1 };
  var noBuild = versionString.split('+');
  var splitVersion = noBuild[0].split('_');
  var wrapNum = 0;
  // If we find two +s, or two _, that's super invalid.
  if (noBuild.length > 2 || splitVersion.length > 2) {
    throwVersionParserError(
      "Version string must look like semver (eg '1.2.3'), not '"
        + versionString + "'.");
  } else if (splitVersion.length > 1) {
    wrapNum = splitVersion[1];
    if (!/^\d+$/.test(wrapNum)) {
      throwVersionParserError(
        "The wrap number (after _) must contain only digits, so " +
          versionString + " is invalid.");
    } else if (wrapNum[0] === "0") {
      throwVersionParserError(
        "The wrap number (after _) must not have a leading zero, so " +
          versionString + " is invalid.");
    }
  }
  return {
    semver: (noBuild.length > 1) ?
      splitVersion[0] + "+" + noBuild[1] :
      splitVersion[0],
    wrapNum: parseInt(wrapNum, 10)
  };
};

semverCompare = function (versionOne, versionTwo) {
  var meteorVOne = extractSemverPart(versionOne);
  var meteorVTwo = extractSemverPart(versionTwo);

  // Wrap numbers only matter if the semver is equal, so if they don't even have
  // wrap numbers, or if their semver is not equal, then we should let the
  // semver library resolve this one.
  if (meteorVOne.semver !== meteorVTwo.semver) {
    try {
      return semver.compare(meteorVOne.semver, meteorVTwo.semver);
    } catch(e) {
      console.error('semver compare error', e, versionOne, versionTwo, meteorVOne.semver, meteorVTwo.semver);
      return undefined;
    }
  }

  // If their semver components are equal, then the one with the smaller wrap
  // numbers is smaller.
  return meteorVOne.wrapNum - meteorVTwo.wrapNum;
};
