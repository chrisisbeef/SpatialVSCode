import * as vscode from 'vscode';
import * as proc from 'child_process';

import { SpatialProject } from './SpatialProject';

const SPATIAL_COMMAND: String = "spatial";
const SPATIAL_CLEAN: String = "clean";

export class SpatialCommandWrapper {
    private project: SpatialProject;
    private outputChannel: vscode.OutputChannel;

    public constructor(project: SpatialProject, outputChannel: vscode.OutputChannel, context: vscode.ExtensionContext) {
        this.project = project;
        this.outputChannel = outputChannel;

        context.subscriptions.push(vscode.commands.registerCommand("spatial.clean", (args) => { this.clean() }));
    }

    public clean(): void {
        this.runSpatial([SPATIAL_CLEAN], "Cleaning Project Workspace");
    }

    private runSpatial(command: String[], taskDescription: string): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine(taskDescription);

        var process = proc.exec(
            SPATIAL_COMMAND + " " + command.join(" "),
            { cwd: vscode.workspace.rootPath }, 
            (err, stdout, stderr) => {
                if (err) {
                    this.outputChannel.appendLine("[ERR]: " + err);
                } else {
                    this.outputChannel.append(stdout);
                }
            }
        );

        process.stdout.on("data", data => this.outputChannel.append(data.toString()));
        process.stderr.on("data", data => this.outputChannel.append("[ERR]: " + data.toString()));
    }
}
/*
function runSpatial() {
    return window.showQuickPick(listTasks()).then((task: QuickPickItem) => {
        var statusbar: Disposable = window.setStatusBarMessage("Running " + task.label);
        var process = proc.exec(
            cmd() + " " + task.label,
            { cwd: workspace.rootPath },
            (err, stdout, stderr) => {
                if (err) window.showErrorMessage("An Error Occured");
                else window.showInformationMessage("Success!");
                outputChannel.append(stdout);
            }
        );

        process.stdout.on("data", data => outputChannel.append(data.toString()));
        process.stderr.on("data", data => outputChannel.append("[ERR] " + data.toString()));
        statusbar.dispose();
    });
}

function cmd(): string { return workspace.getConfiguration().get("spatial.useCommand", "spatial"); }

function listTasks(): Thenable<QuickPickItem[]> {
    var items: QuickPickItem[] = [];
    items.push({ label: "clean", description: "Clean all workers", detail: "worker clean" });
    return Promise.resolve(items);
}
*/