const TOKIMO_GIT_SPECS = {
  "@tokimo/ui": "github:tokimo-lab/tokimo-ui#0d09afd6d88365fa40dfe729fedf9fb30331eb5e",
  "@tokimo/viewers": "github:tokimo-lab/tokimo-viewers#e0caf1fad80486cde8a4682695c73298c1401945",
};

module.exports = {
  hooks: {
    readPackage(pkg) {
      for (const sectionName of [
        "dependencies",
        "devDependencies",
        "peerDependencies",
      ]) {
        const section = pkg[sectionName];
        if (!section) continue;
        for (const [name, spec] of Object.entries(section)) {
          if (spec === "workspace:*" && TOKIMO_GIT_SPECS[name]) {
            section[name] = TOKIMO_GIT_SPECS[name];
          }
        }
      }
      return pkg;
    },
  },
};
