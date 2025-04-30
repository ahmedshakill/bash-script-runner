// Updated extension.ts with gutter-only button implementation

import * as vscode from 'vscode';
import { CommandParser } from './commandParser';
import { TerminalManager } from './terminalManager';

let decorationTypes: { [key: string]: vscode.TextEditorDecorationType } = {};
let commandParser: CommandParser;
let terminalManager: TerminalManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Bash Runner extension is now active');
    
    commandParser = new CommandParser();
    terminalManager = new TerminalManager();
    
    // Register command to run bash commands from decoration click
    let runCommandDisposable = vscode.commands.registerCommand('bash-runner.runCommand', (command: string) => {
        terminalManager.executeCommand(command);
    });
    
    // Register command for Ctrl+Enter keyboard shortcut
    let runSelectedCommandDisposable = vscode.commands.registerCommand('bash-runner.runSelectedCommand', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            
            // Find and run the command at the current cursor position
            const commands = commandParser.parseCommands(document.getText());
            for (const command of commands) {
                const startPos = document.positionAt(command.startOffset);
                const endPos = document.positionAt(command.endOffset);
                const commandRange = new vscode.Range(startPos, endPos);
                
                if (commandRange.contains(selection)) {
                    terminalManager.executeCommand(command.text);
                    break;
                }
            }
        }
    });
    
    // Register a command to handle gutter clicks
    let handleGutterClickDisposable = vscode.commands.registerCommand('bash-runner.handleGutterClick', (line: number) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const commands = commandParser.parseCommands(document.getText());
            
            for (const command of commands) {
                const startPos = document.positionAt(command.startOffset);
                
                if (startPos.line === line) {
                    terminalManager.executeCommand(command.text);
                    break;
                }
            }
        }
    });
    
    context.subscriptions.push(runCommandDisposable, runSelectedCommandDisposable, handleGutterClickDisposable);
    
    // Initial decoration for active editor if it's a shell script
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'shellscript') {
        updateDecorations(context, vscode.window.activeTextEditor);
    }
    
    // Update decorations when active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'shellscript') {
            updateDecorations(context, editor);
        }
    }, null, context.subscriptions);
    
    // Update decorations when document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && editor.document.languageId === 'shellscript') {
            updateDecorations(context, editor);
        }
    }, null, context.subscriptions);

    // Listen for mouse clicks in the gutter area
    vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'shellscript') {
            const clickedPosition = event.selections[0].start;
            
            // Check if clicked in gutter area (character position 0)
            if (clickedPosition.character === 0) {
                vscode.commands.executeCommand('bash-runner.handleGutterClick', clickedPosition.line);
            }
        }
    }, null, context.subscriptions);
}

function updateDecorations(context: vscode.ExtensionContext, editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const commands = commandParser.parseCommands(text);
    
    // Clear previous decorations
    Object.values(decorationTypes).forEach(type => {
        editor.setDecorations(type, []);
    });
    
    // Create new decorations for each command
    commands.forEach((command, index) => {
        const decorationType = getOrCreateDecorationType(context, index.toString());
        
        const startPos = editor.document.positionAt(command.startOffset);
        const endPos = editor.document.positionAt(command.endOffset);
        const range = new vscode.Range(startPos, startPos.with(undefined, startPos.character + 1));
        
        editor.setDecorations(decorationType, [{
            range,
            hoverMessage: `Click to run: ${command.text.trim()}`
        }]);
    });
}

function getOrCreateDecorationType(context: vscode.ExtensionContext, id: string): vscode.TextEditorDecorationType {
    if (!decorationTypes[id]) {
        try {
            decorationTypes[id] = vscode.window.createTextEditorDecorationType({
                gutterIconPath: context.asAbsolutePath('resources/play-button.svg'),
                gutterIconSize: '75%'
            });
        } catch (error) {
            console.error('Error creating decoration type:', error);
            // Fallback decoration type without gutter icon
            decorationTypes[id] = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(41, 121, 255, 0.1)',
                isWholeLine: true
            });
        }
    }
    
    return decorationTypes[id];
}

export function deactivate() {
    // Clean up decorations
    Object.values(decorationTypes).forEach(type => type.dispose());
    decorationTypes = {};
}

// Also ensure package.json has these entries:
/*
"contributes": {
  "commands": [
    {
      "command": "bash-runner.runCommand",
      "title": "Run Bash Command"
    },
    {
      "command": "bash-runner.handleGutterClick",
      "title": "Handle Gutter Click"
    }
  ],
  ...
}
*/