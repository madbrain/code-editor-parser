System.config({
  defaultExtensions: true,
  packages: {
    "app": {
      "defaultExtension": "js",
      "main": "app.js"
    },
    "codemirror": {
      "defaultExtension": "js",
      "main": "lib/codemirror.js"
    }
  },
  map: {
    "app": "tmp",
    "codemirror": "npm:codemirror"
  },
  paths: {
    "npm:": "node_modules/"
  },
});
