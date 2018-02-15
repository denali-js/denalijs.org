export default function(server) {

  server.loadFixtures('addons');
  server.loadFixtures('docs');
  server.loadFixtures('versions');

  let docs = server.schema.docs.all().models;
  server.schema.versions.all().models.forEach((version) => {
    version.doc = docs.find((d) => d.versionId === version.id);
    version.save();
  });

  let versions = server.schema.docs.all().models;
  server.schema.addons.all().models.forEach((addon) => {
    addon.version = versions.find((d) => d.addonId === addon.id);
    addon.save();
  });

}
