# Spatial 4 VS-Code

This extension provides hooks for spatial commands

## Commands

`SpatialOS: Clean Project Workspace` - Runs the `spatial clean` task to clean the entire project workspace.

`SpatialOS: Build all Workers` - Runs `spatial worker build` to build all the configured workers in `default_launch.json`.

`SpatialOS: Build Worker (select)` - Allows you to select a configured worker to build

`SpatialOS: Launch Spatial (Local)` - Run SpatialOS locally (will deploy any managed workers)

`SpatialOS: Stop Spatial` - Stops a running SpatialOS process.

## TODO
* Add a configuration options for configuring spatial environment options (debug mode for runtime, perform runtime updates, etc.)
* Unity Mode - perform custom build actions on workers that work when Unity is open (like the editor extensions in Unity)
* Add menu items to Start/Stop Spatial, Open Unity Project, Run Unity Client
* Add config option to automatically open a browser window to the inspector when spatial starts
* Deploy to Spatial cloud
* Code snippets for common things and templates for new workers
* Watcher for FS changes to automatically build workers
* Add commands for schema stuff
* Port the schema lang support 