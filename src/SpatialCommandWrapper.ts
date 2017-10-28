import * as vscode from 'vscode';
import * as proc from 'child_process';

import { SpatialProject } from './SpatialProject';

const SPATIAL_COMMAND: String = "spatial";
const SPATIAL_CLEAN: String = "clean";

export class SpatialCommandWrapper {
    private project: SpatialProject;
    private outputChannel: vscode.OutputChannel;

    private running_process: proc.ChildProcess;

    public constructor(project: SpatialProject, outputChannel: vscode.OutputChannel, context: vscode.ExtensionContext) {
        this.project = project;
        this.outputChannel = outputChannel;

        context.subscriptions.push(vscode.commands.registerCommand("spatial.clean", (_) => { this.clean() }));
        context.subscriptions.push(vscode.commands.registerCommand("spatial.buildall", (_) => { this.buildAll(); }));
        context.subscriptions.push(vscode.commands.registerCommand("spatial.launchlocal", (_) => { this.launchLocal(); }));
        context.subscriptions.push(vscode.commands.registerCommand("spatial.stopspatial", (_) => { this.stopSpatial(); }));
        context.subscriptions.push(vscode.commands.registerCommand("spatial.buildworker", (_) => { this.buildWorker(); }));
    }

    public clean(): void {
        this.runSpatial([SPATIAL_CLEAN], "Cleaning Project Workspace");
    }

    public buildAll(): void {
        this.runSpatial([ "worker", "build"], "Building All Workers");
    }

    public buildWorker(): void {
        vscode.window.showQuickPick(this.listWorkers()).then((worker: vscode.QuickPickItem) => {
            this.runSpatial(["worker", "build", worker.label], "Building " + worker.label);
        });
    }

    public launchLocal(): void {
        this.runSpatial([ "local", "launch"], "Launching SpatialOS (Local)");
    }

    private runSpatial(command: String[], taskDescription: string): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine(taskDescription);

        this.running_process = proc.exec(
            SPATIAL_COMMAND + " " + command.join(" "),
            { cwd: vscode.workspace.rootPath }, 
            (err, stdout, stderr) => {
                if (err) {
                    this.outputChannel.appendLine("[ERR]: " + err);
                } else {
                    this.outputChannel.append(stdout);
                    this.running_process = null;
                }

                this.outputChannel.appendLine("Process Completed");
            }
        );

        process.stdout.on("data", data => this.outputChannel.append(data.toString()));
        process.stderr.on("data", data => this.outputChannel.append("[ERR]: " + data.toString()));
    }

    public stopSpatial(): void {
        if (this.running_process == null) {
            vscode.window.showErrorMessage("No SpatialOS Processes Running");
            return;
        }

        this.running_process.kill();
    }

    private listWorkers(): Thenable<vscode.QuickPickItem[]> {
        var items: vscode.QuickPickItem[] = [];

        this.project.GetWorkerNames().forEach(worker => {
            items.push({ label: worker.toString(), description: "" });
        });

        return Promise.resolve(items);
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

*/