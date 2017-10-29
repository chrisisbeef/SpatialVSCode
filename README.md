# Spatial 4 VS-Code

An integrated development environment tailored to work on SpatialOS powered Unity Projects.

## Getting Started

Once you've installed the extension, it will automatically activate upon opening a project folder that contains the `spatialos.json` file in it's root directory. You can access the extension commands by using `Ctrl+Shift+P` then typing `SpatialOS` to select from a list of provided commands. 

## Commands

`SpatialOS: Clean Project Workspace` - Runs the `spatial clean` task to clean the entire project workspace.

`SpatialOS: Clean Unity Project` - Runs the clean task for the Unity project

`SpatialOS: Build all Workers` - Runs `spatial worker build` to build all the configured workers in `default_launch.json`.

`SpatialOS: Build Unity Workers` - Builds `UnityClient` and `UnityWorker` workers while Unity is open

`SpatialOS: Build Worker (select)` - Allows you to select a configured worker to build

`SpatialOS: Build Unity Worker (select)` - Builds the selected worker while Unity is open

`SpatialOS: Launch Spatial (Local)` - Run SpatialOS locally (will deploy any managed workers)

`SpatialOS: Stop Spatial` - Stops a running SpatialOS process.

`SpatialOS: Open Unity Project` - Opens the Unity project in the Unity Editor for this project. (Windows only)

## Changelog

### v0.0.2 - 29 Oct 2017
* Added configuration options 
  * `spatial.home` - describes where the spatial command is installed, value of `none` will use spatial on the system path
  * `spatial.debug` - if `true`, will add the flag `--log_level=debug` to all spatial commands
  * `spatial.schema.generateOnSave` - will enable the `SpatialSchemaWatcher` component which will re-generate code from schema on file-save, create, or delete (experimental)
* Fixed bug in Worker Builder commands which wasn't appending build output to the output panel until the process completed
* Added support to run Unity-Mode builds for Unity workers (UnityClient, UnityWorker) while Unity is open
  * `spatial.unity.buildWorkers` - Builds all Unity Workers
  * `spatial.unity.buildWorker` - Builds a selected worker (from QuickPickList)
  * `spatial.unity.clean` - Cleans the Unity project workspace
* Added new command to open the Unity project for the SpatialOS Project
  * `spatial.unity.openScene` - Will open the Unity editor project to it's default scene
  * Currently only works in Windows 
* Implemented an experimental FileSystemWatcher for `.schema` files.

## TODO
* ~~Add a configuration options for configuring spatial environment options (debug mode for runtime, perform runtime updates, etc.)~~ (v0.0.2)
* ~~Unity Mode - perform custom build actions on workers that work when Unity is open (like the editor extensions in Unity)~~ (v0.0.2)
* Add menu items to Start/Stop Spatial, Open Unity Project, Run Unity Client
* Add config option to automatically open a browser window to the inspector when spatial starts
* Deploy to Spatial cloud
* Code snippets for common things and templates for new workers
* Watcher for FS changes to automatically build workers (In progress)
* Add commands for schema stuff
* Port the schema lang support 