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
    },
    "lodash": {
      "defaultExtension": "js",
      "main": "lodash.js"
    }
  },
  map: {
    "app": "tmp",
    "codemirror": "npm:codemirror",
    "lodash": "npm:lodash"
  },
  paths: {
    "npm:": "node_modules/"
  },
});
