const majorNodeVersion = Number(process.versions.node.split(".")[0]);

if (majorNodeVersion !== 20) {
  console.error(
    [
      `Ampla Uganda's current Create React App build is validated on Node 20.`,
      `Detected Node ${process.versions.node}.`,
      "",
      "Use Node 20 before building, or run:",
      "  npm run build:node20",
    ].join("\n")
  );
  process.exit(1);
}

process.env.GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP || "false";
process.env.DISABLE_ESLINT_PLUGIN =
  process.env.DISABLE_ESLINT_PLUGIN || "true";
process.env.CI = process.env.CI || "false";

require("react-scripts/scripts/build");
