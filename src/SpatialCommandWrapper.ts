import * as vscode from 'vscode';
import * as proc from 'child_process';

import { SpatialProject } from './SpatialProject';
import { WorkerDef } from './SpatialWorkerDef';

const SPATIAL_COMMAND: String = "spatial";
const SPATIAL_CLEAN: String = "clean";

export class SpatialCommandWrapper {
    private project: SpatialProject;
    private outputChannel: vscode.OutputChannel;

    private running_process: proc.ChildProcess;

    private cmd_clean: vscode.Disposable;
    private cmd_buildall: vscode.Disposable;
    private cmd_launchlocal: vscode.Disposable;
    private cmd_stopspatial: vscode.Disposable;
    private cmd_buildworker: vscode.Disposable;

    private cmd_unity_buildall: vscode.Disposable;
    private cmd_unity_buildworker: vscode.Disposable;
    private cmd_unity_clean: vscode.Disposable;

    public constructor(project: SpatialProject, outputChannel: vscode.OutputChannel, context: vscode.ExtensionContext) {
        this.project = project;
        this.outputChannel = outputChannel;

        // Create standard commands
        this.cmd_clean          = vscode.commands.registerCommand("spatial.clean", (_) => { this.clean() });
        this.cmd_buildall       = (vscode.commands.registerCommand("spatial.buildall", (_) => { this.buildAll(); }));
        this.cmd_launchlocal    = (vscode.commands.registerCommand("spatial.launchlocal", (_) => { this.launchLocal(); }));
        this.cmd_stopspatial    = (vscode.commands.registerCommand("spatial.stopspatial", (_) => { this.stopSpatial(); }));
        this.cmd_buildworker    = (vscode.commands.registerCommand("spatial.buildworker", (_) => { this.buildWorker(); }));

        context.subscriptions.push(this.cmd_buildall);
        context.subscriptions.push(this.cmd_buildworker);
        context.subscriptions.push(this.cmd_clean);
        context.subscriptions.push(this.cmd_launchlocal);
        context.subscriptions.push(this.cmd_stopspatial);
        
        // Create UnityMode Commands
        this.cmd_unity_buildall = (vscode.commands.registerCommand("spatial.unity.buildworkers", (_) => { this.unityBuildAll(); }));
        this.cmd_unity_buildworker = (vscode.commands.registerCommand("spatial.unity.buildworker", (_) => { this.unityBuildWorker(); }));
        this.cmd_unity_clean = (vscode.commands.registerCommand("spatial.unity.clean", (_) => { this.unityClean(); }));

        context.subscriptions.push(this.cmd_unity_buildall);
        context.subscriptions.push(this.cmd_unity_buildworker);
        context.subscriptions.push(this.cmd_unity_clean);
    }

    private unityRunning(): boolean {
        let isRunning = false;
        vscode.workspace.findFiles("**/Temp/UnityLockfile").then((_) => {
            isRunning = true;
        });
        return isRunning;
    }

    public clean(): void {
        this.runSpatial([SPATIAL_CLEAN], "Cleaning Project Workspace");
    }

    public unityClean(): void {
        this.runSpatial(["invoke", "unity", "Improbable.Unity.EditorTools.Build.SimpleBuildSystem.Clean", "--allow_fail"], "Cleaning Unity Workers", this.project.UnityProjectPath);
    }

    public buildAll(): void {
        this.runSpatial([ "worker", "build"], "Building All Workers");
    }

    public unityBuildAll(): void {
        this.runSpatial(["invoke", "unity", "Improbable.Unity.EditorTools.Build.SimpleBuildSystem.Build"], "Building Unity Workers", this.project.UnityProjectPath);
    }

    public buildWorker(): void {
        vscode.window.showQuickPick(this.listWorkers(false)).then((worker: vscode.QuickPickItem) => {
            this.runSpatial(["worker", "build", worker.label], "Building " + worker.label);
        });
    }

    public unityBuildWorker(): void {
        vscode.window.showQuickPick(this.listWorkers(true)).then((worker: vscode.QuickPickItem) => {
            this.runSpatial(["invoke", "unity", "Improbable.Unity.EditorTools.Build.SimpleBuildSystem.Build", "+buildWorkerTypes", worker.label], "Building " + worker.label, this.project.UnityProjectPath);
        })
    }

    public launchLocal(): void {
        this.runSpatial([ "local", "launch"], "Launching SpatialOS (Local)");
    }

    private runSpatial(command: String[], taskDescription: string, root: String = vscode.workspace.rootPath): void {
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

    private listWorkers(onlyUnity: boolean): Thenable<vscode.QuickPickItem[]> {
        var items: vscode.QuickPickItem[] = [];

        this.project.GetWorkerNames().forEach(worker => {
            let wd: WorkerDef = this.project.GetWorkerDef(worker);
            if ((!onlyUnity) || (onlyUnity && wd.unity)) {
                items.push({ label: worker.toString(), description: "" });
            }
        });

        return Promise.resolve(items);
    }
}
