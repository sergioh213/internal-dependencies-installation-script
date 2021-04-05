# internal-dependencies-installation-script
A script to install your own repositories as `npm` packages interpolating variables (like your GitHub token), into the urls used to download the packages.

## Usage
An example of how your project's package.json needs to look:
```json
{
  "scripts": {
    "postinstall": "node internal-dependencies-installation-script.js --fileWithVariables=./secrets.json"
  },
  "internalDependencies": {
    "name-you-want-for-your-package": "git+https://${GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/username/repo-name.git",
    "another-package": "https://${PRIVATE_PACKAGE_KEY}:x-oauth-basic@github.com/username/repo-name.git"
  }
}
```

### Rules

* You need to add a property called `"postinstall"` in the `"scripts"` section of your project's `package.json` file. This tells npm to run this command everytime you install something.

<em>Alternatively you can add it under a property called `"preinstall"` and it will run before any use of the `npm install` command.</em>

* Add the private packages/repositories that want to install under a new section of your project's `package.json` file, that must be called `"internalDependencies"` with one property for every package.
The key will be the name of the package and the value must be the url where the package lives.

* All the private packages/repositories that you want to install need to have a `package.json` file in their root. With the usual `npm` `package.json` format.

* The variable names to interpolate in the urls must be preceded by `${` and followed by `}`. Without spaces.

* You can have the variables in your node enviroment, they will be read from there and take priority. But you can also add an option to the installation command to take the variables from a custom `json` file (as seen in the example snippet above).
Eg: `--fileWithVariables=./path-to/variables-file.json`.

* The variable names in the `json` file or node enviroment must match the variable names interpolated in the urls.

* You can use both at the same time. Eg: some variables stored in the node environment and some others in the custom `json` file.

