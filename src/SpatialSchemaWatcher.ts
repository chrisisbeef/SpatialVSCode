//#region Imports
import * as vscode from 'vscode';

import path = require('path');

import {SpatialProject} from './SpatialProject';
import {SpatialCommandWrapper, SpatialCommandSpec} from './SpatialCommandWrapper';
//#endregion

const SCHEMA_GLOB_PATTERN = "schema/**/*.schema"

export class SchemaWatcher {
    private fsWatcher: vscode.FileSystemWatcher;
    private outputChannel: vscode.OutputChannel;
    private project: SpatialProject;
    private commandWrapper: SpatialCommandWrapper;

    private config: CodeGenConfig = new CodeGenConfig();

    private readonly CodeGenTask: SpatialCommandSpec[] = [
        SpatialCommandSpec.Create()
            .withCommand("worker_package unpack"),
        // TODO: Make all these paths relative to the project root, and make the hard-coded paths configurable
        SpatialCommandSpec.Create()
            .withCommand("process_schema generate")
            .withFlag("--cachePath", this.config.BuildCachePath("csharp/std"))
            .withFlag("--output", this.config.BuildOutputPath("csharp/std"))
            .withFlag("--language","csharp")
            .withFlag("--input",this.config.BuildRepoPath("schema/standard_library")),
        SpatialCommandSpec.Create()
            .withCommand("process_schema generate")
            .withFlag("--cachePath",this.config.BuildCachePath("csharp/usr"))
            .withFlag("--output",this.config.BuildOutputPath("csharp/usr"))
            .withFlag("--language","csharp")
            .withFlag("--input","../../schema")
            .withFlag("--repository",this.config.BuildRepoPath("schema")),
        SpatialCommandSpec.Create()
            .withCommand("process_schema generate")
            .withFlag("--cachePath",this.config.BuildCachePath("json/std"))
            .withFlag("--output",this.config.BuildOutputPath("json/std"))
            .withFlag("--language","ast_json")
            .withFlag("--input",this.config.BuildRepoPath("schema/standard_library")),
        SpatialCommandSpec.Create()
            .withCommand("process_schema generate")
            .withFlag("--cachePath",this.config.BuildCachePath("json/usr"))
            .withFlag("--output",this.config.BuildOutputPath("json/usr"))
            .withFlag("--language","ast_json")
            .withFlag("--input","../../schema")
            .withFlag("--repository",this.config.BuildRepoPath("schema")),
        SpatialCommandSpec.Create()
            .withCommand("invoke unity-mono")
            .withCommand(".spatialos/bin/CodeGenerator.exe")
            .withFlag("--")
            .withFlag("--json-dir", ".spatialos/json")
            .withFlag("--unity-component-output-dir", "Assets/Plugins/Improbable/Generated/Components")
            .withFlag("--unity-editor-component-output-dir", "Assets/Plugins/Improbable/Editor/Generated/Components")
            .withFlag("--reader-writer-output-dir", ".spatialos/generated/readers_writers"),
        SpatialCommandSpec.Create()
            .withCommand("invoke unity-csharp-compiler")
            .withFlag("--unity-reference", "UnityEngine.dll")
            .withFlag("--")
            .withFlag("-lib:Assets/Plugins/Improbable/Sdk/Dll")
            .withFlag("-reference:Improbable.WorkerSdkCsharp.dll,Improbable.WorkerSdkCsharp.Framework.dll")
            .withFlag("-target:library")
            .withFlag("-debug")
            .withFlag("-unsafe")
            .withFlag("-nowarn:1591")
            .withFlag("-recurse:.spatialos/generated/csharp/*.cs")
            .withFlag("-out:Assets/Plugins/Improbable/Sdk/Dll/Generated.Code.dll")
            .withFlag("-doc:Assets/Plugnis/Improbable/Sdk/Dll/Generated.Code.xml")
    ]

    public constructor(project: SpatialProject, outputChannel: vscode.OutputChannel, commandWrapper: SpatialCommandWrapper) {
        this.outputChannel = outputChannel;
        this.project = project;
        this.commandWrapper = commandWrapper;

        this.config = new CodeGenConfig();
        this.config.cacheBasePath = project.UnityProjectPath + "/.spatialos/schema_codegen_cache";
        this.config.outputBasePath = project.UnityProjectPath + "/.spatialos/generated";
        this.config.repoBasePath = "build/dependencies";
    }

    private initializeWatcher(): void {
        this.fsWatcher = vscode.workspace.createFileSystemWatcher(SCHEMA_GLOB_PATTERN);
        this.fsWatcher.onDidChange(this.recompileSchema);
        this.fsWatcher.onDidCreate(this.recompileSchema);
        this.fsWatcher.onDidDelete(this.recompileSchema);
    }

    private recompileSchema(): void {
        this.commandWrapper.runSpatialCommands(this.CodeGenTask);
    }
}

export class CodeGenConfig {
    public cacheBasePath: string;
    public outputBasePath: string;
    public repoBasePath: string;

    public BuildCachePath(p: string): string {
        return this.resolvePath(this.cacheBasePath, p);
    }

    public BuildOutputPath(p: string): string {
        return this.resolvePath(this.outputBasePath, p);
    }

    public BuildRepoPath(p: string): string {
        return this.resolvePath(this.repoBasePath, p);
    }

    private resolvePath(base: string, p: string) {
        return path.resolve(vscode.workspace.rootPath, base, p);
    }
}