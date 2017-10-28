'use strict';
import {window, workspace, commands, ExtensionContext, QuickPickItem, OutputChannel, Disposable} from 'vscode';
import fs = require('fs');

import { SpatialProject } from './SpatialProject';
import { SpatialCommandWrapper } from './SpatialCommandWrapper';

var outputChannel: OutputChannel = null;
var project: SpatialProject = null;

export function activate(context: ExtensionContext) {
    outputChannel = window.createOutputChannel("Spatial");
    outputChannel.show();

    project = new SpatialProject(outputChannel);
    project.initializeProject();

    var spatialCommandWrapper = new SpatialCommandWrapper(project, outputChannel);

    context.subscriptions.push(commands.registerCommand("spatial.clean", (args) => { spatialCommandWrapper.clean() }));
}
