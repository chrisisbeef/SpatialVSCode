import * as vscode from 'vscode';
import * as Worker from './SpatialWorkerDef';

// Node Imports
import path = require('path');

export class SpatialProject extends vscode.Disposable {
    private projectConfig;
    private launchConfig;

    private workers: Worker.WorkerDef[] = [];

    private outputChannel: vscode.OutputChannel;

    private projectWatcher: vscode.FileSystemWatcher;
    private projectWatcherListener;

    public constructor(outputChannel: vscode.OutputChannel) {
        super(() => {
            this.projectWatcher.dispose();
            this.projectWatcherListener.dispose();
        });
        this.outputChannel = outputChannel;
    }

    public initializeProject(): void {
        vscode.workspace.findFiles("/spatialos.json")
            .then((_) => { 
                this.outputChannel.appendLine("Found SpatialOS Project - Initializing"); 
                this.readProjectConfig();
            });

        this.projectWatcher = vscode.workspace.createFileSystemWatcher("/spatialos*.json");
        this.projectWatcherListener = this.projectWatcher.onDidChange(this.readProjectConfig);
    }

    private readProjectConfig(): void {
        this.projectConfig = require(vscode.workspace.rootPath + "/spatialos.json");
        this.outputChannel.appendLine("Processing " + this.projectConfig.name + "...");

        this.launchConfig = require(vscode.workspace.rootPath + "/default_launch.json");
        this.outputChannel.appendLine("Found " + path.resolve(vscode.workspace.rootPath,"default_launch.json"));

        this.launchConfig.workers.forEach(w => {
            vscode.workspace.findFiles("**/spatialos." + w.worker_type + ".worker.json").then((workerDefs) => {
                if (workerDefs.length > 1) {
                    vscode.window.showErrorMessage("Found " + workerDefs.length + " definitions. Unable to handle this! I give up");
                }

                let workerConfigFile = workerDefs[0].fsPath;
                try {
                    let workerConfig = require(workerConfigFile);

                    let def: Worker.WorkerDef = new Worker.WorkerDef();
                    def.name = w["worker_type"];
                    def.config = workerConfig;
                    def.directory = path.dirname(workerConfigFile)
                    this.workers.push(def);

                    this.outputChannel.appendLine("Added Worker " + def.name + " at " + def.directory);
                } catch (e) {
                    this.outputChannel.appendLine("[ERR}: Unable to find worker definition for worker_type " + w.worker_type);
                }
            });
        });
    }

    public GetWorkerNames(): String[] {
        var workerNames: String[] = [];

        this.workers.forEach(worker => {
            workerNames.push(worker.name);
        });

        return workerNames;
    }

    public GetWorkerDef(name: String) {
        this.workers.forEach(worker => {
            if (name == worker.name) {
                return worker;
            }
        });
    }
}
