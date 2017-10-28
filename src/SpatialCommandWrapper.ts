import * as vscode from 'vscode';
import * as proc from 'child_process';

import { SpatialProject } from './SpatialProject';

export class SpatialCommandWrapper {
    private project: SpatialProject;
    private outputChannel: vscode.OutputChannel;

    public constructor(project: SpatialProject, outputChannel: vscode.OutputChannel) {
        this.project = project;
        this.outputChannel = outputChannel;
    }

    public clean(): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine("Cleaning Project");

        var process = proc.exec(
            "spatial clean",
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