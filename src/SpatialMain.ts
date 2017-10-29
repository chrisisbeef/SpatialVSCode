'use strict';
import * as vscode from 'vscode';
import * as proc from 'child_process';

import fs = require('fs');

import { SpatialProject } from './SpatialProject';
import { SpatialCommandWrapper } from './SpatialCommandWrapper';
import { SchemaWatcher } from './SpatialSchemaWatcher';
import { WorkerDef } from './SpatialWorkerDef';

var outputChannel: vscode.OutputChannel = null;
var project: SpatialProject = null;

var schemaWatcher: SchemaWatcher;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("Spatial");
    outputChannel.show();

    project = new SpatialProject(outputChannel);
    project.initializeProject();

    var spatialCommandWrapper = new SpatialCommandWrapper(project, outputChannel, context);

    if (vscode.workspace.getConfiguration("spatial.schema").get<boolean>("generateOnSave")) {
        schemaWatcher = new SchemaWatcher(project, outputChannel, spatialCommandWrapper);
    }
    
    var unity: string = "C:\\Program Files\\Unity\\Editor\\Unity.exe"

    context.subscriptions.push(vscode.commands.registerCommand("spatial.unity.openScene", (_) => {
        proc.spawn(unity, [ "-projectPath", project.UnityProjectPath.toString() ], { detached: true, shell: false });
    }));
}

function GetUnityScenes(project: SpatialProject): Thenable<vscode.QuickPickItem[]> {
    var scenes: vscode.QuickPickItem[] = [];

    let workers: WorkerDef[] = project.GetWorkerDefs();
    workers.forEach((worker) => {
        if (worker.unity) {
            scenes.push({ label: worker.name.toString(), description: worker.directory.toString(), detail: worker.unityScene });
        }
    })

    return Promise.resolve(scenes);
}
