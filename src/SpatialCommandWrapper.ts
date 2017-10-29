import * as vscode from 'vscode';
import * as proc from 'child_process';

import { SpatialProject } from './SpatialProject';
import { WorkerDef } from './SpatialWorkerDef';

const SPATIAL_SIMPLE_BUILD: string = "Improbable.Unity.EditorTools.Build.SimpleBuildSystem.Build";

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
        this.runSpatialCommand(
            SpatialCommandSpec.Create()
                .withCommand("clean")
        );
    }

    public unityClean(): void {
        this.runSpatialCommand(
            SpatialCommandSpec.Create()
                .withCommand("invoke unity")
                .withCommand(SPATIAL_SIMPLE_BUILD)
                .withFlag("--allow-fail")
        )
    }

    public buildAll(): void {
        this.runSpatialCommand(SpatialCommandSpec.Create().withCommand("unity build"));
    }

    public unityBuildAll(): void {
        this.runSpatialCommand(
            SpatialCommandSpec.Create()
                .withCommand("invoke unity")
                .withCommand(SPATIAL_SIMPLE_BUILD)
                .withWorkingDirectory(this.project.UnityProjectPath)
        );
    }

    public buildWorker(): void {
        vscode.window.showQuickPick(this.listWorkers(false)).then((worker: vscode.QuickPickItem) => {
            this.runSpatialCommand(SpatialCommandSpec.Create().withCommand("worker build").withCommand(worker.label));
        });
    }

    public unityBuildWorker(): void {
        vscode.window.showQuickPick(this.listWorkers(true)).then((worker: vscode.QuickPickItem) => {
            this.runSpatialCommand(
                SpatialCommandSpec.Create()
                    .withCommand("invoke unity")
                    .withCommand(SPATIAL_SIMPLE_BUILD)
                    .withFlag("+buildWorkerTypes", worker.label)
                    .withWorkingDirectory(this.project.UnityProjectPath)
            );
        })
    }

    public launchLocal(): void {
        this.runSpatialCommand(
            SpatialCommandSpec.Create()
                .withCommand("local launch")
        );
    }

    public runSpatialCommands(specs: SpatialCommandSpec[]) {
        this.outputChannel.clear();
        this.recurseAndRunSpatialCommand(specs, 0);
    }

    private recurseAndRunSpatialCommand(specs: SpatialCommandSpec[], current_idx: number) {
        this.running_process = proc.exec(
            specs[current_idx].toString(),
            { cwd: specs[current_idx].workingDir },
            (err, stdout, stderr) => {
                if (err) {
                    this.outputChannel.appendLine("[ERR] Build Error on Step #${current_idx}: " + err);
                    this.outputChannel.append(stderr);
                    return;
                } else {
                    this.outputChannel.append(stdout);
                    if (current_idx >= specs.length) {
                        this.running_process = null;
                    } else {
                        this.running_process = null;
                        this.recurseAndRunSpatialCommand(specs, current_idx++);
                    }
                }
            }
        );

        this.running_process.stdout.on("data", data => this.outputChannel.append(data.toString()));
        this.running_process.stderr.on("data", data => this.outputChannel.append("[ERR]: " + data.toString()));
    }

    public runSpatialCommand(spec: SpatialCommandSpec, taskDescription: string = "Running " + spec.toString() + " from " + spec.workingDir) {
        if (this.running_process != null) {
            // TODO: This may cause problems for starting up additional workers (external)
            vscode.window.showErrorMessage("Please stop running SpatialOS Process before starting another one");
        }

        this.outputChannel.clear();
        this.outputChannel.appendLine(taskDescription);

        this.running_process = proc.exec(
            spec.toString(),
            { cwd: spec.workingDir },
            (err, stdout, stderr) => {
                if (err) {
                    this.outputChannel.appendLine("[ERR]: " + err);
                    vscode.window.showErrorMessage("An error occured while running spatial; check the Spatial output panel");
                    this.running_process = null;
                } else {
                    this.outputChannel.append(stdout);
                    this.running_process = null;
                }

                this.outputChannel.appendLine("Process Completed");
            }
        );

        this.running_process.stdout.on("data", data => this.outputChannel.append(data.toString()));
        this.running_process.stderr.on("data", data => this.outputChannel.append("[ERR]: " + data.toString()));
    }

    public stopSpatial(): void {
        if (this.running_process == null) {
            vscode.window.showErrorMessage("No SpatialOS Processes Running");
            return;
        }

        this.running_process.kill();
    }

    public listWorkers(onlyUnity: boolean): Thenable<vscode.QuickPickItem[]> {
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

export class SpatialCommandSpec {
    public workingDir: string;
    public command: String[] = [];
    public commandFlags: SpatialOS.Internal._CommandFlag[] = [];

    private spatialBinary: string = "spatial";

    private constructor() {
        this.setSpatialBinary();
        this.addGlobalCommandFlags();
        this.workingDir = vscode.workspace.rootPath;
    }

    public static Create(): SpatialCommandSpec {
        return new SpatialCommandSpec();
    }

    private setSpatialBinary(): void {
        // TODO: Read from config
    }

    private addGlobalCommandFlags(): void {
        if (vscode.workspace.getConfiguration("spatial").get<boolean>("debug")) {
            this.commandFlags.push(new SpatialOS.Internal._CommandFlag("--log_level", "debug"));
        }
    }

    public withCommand(cmd: string): SpatialCommandSpec {
        this.command.push(cmd);
        return this;
    }

    public withFlag(flag: string, value?: string): SpatialCommandSpec {
        this.commandFlags.push(new SpatialOS.Internal._CommandFlag(flag, value));
        return this;
    }

    public withWorkingDirectory(cwd: String): SpatialCommandSpec {
        this.workingDir = cwd.toString();
        return this;
    }

    public toString(): string {
        return this.spatialBinary + " " + this.command.join(" ") + this.commandFlags.join(" ");
    }
}

namespace SpatialOS.Internal {
    export class _CommandFlag {
        public flag: string;
        public value: string;

        public constructor(flag: string, value?: string) {
            this.flag = flag;
            if (this.value) {
                this.value = value;
            }
        }

        public toString(): string {
            return this.flag + (this.value != null ? "=" + this.value : "");
        }
    }
}