export default function(server) {

  server.loadFixtures('addons');
  server.loadFixtures('versions');
  server.loadFixtures('posts');

  let versions = server.schema.versions.all().models;
  server.schema.addons.all().models.forEach((addon) => {
    addon.version = versions.find((v) => v.addonId === addon.id);
    addon.save();
  });

}
