Packages = new Mongo.Collection('packages');
Packages._ensureIndex('name', { unique: 1, sparse: 1 });
