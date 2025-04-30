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
    
    // Register the command to run bash commands
    let disposable = vscode.commands.registerCommand('bash-runner.runCommand', (command: string) => {
        terminalManager.executeCommand(command);
    });
    
    context.subscriptions.push(disposable);
    
    // Initial decoration for active editor
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
    
    // Update decorations when active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);
    
    // Update decorations when document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);
}

function updateDecorations(editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const commands = commandParser.parseCommands(text);
    
    // Clear previous decorations
    Object.values(decorationTypes).forEach(type => {
        editor.setDecorations(type, []);
    });
    
    // Create new decorations for each command
    commands.forEach((command, index) => {
        const decorationType = getOrCreateDecorationType(index.toString());
        
        const startPos = editor.document.positionAt(command.startOffset);
        const endPos = editor.document.positionAt(command.endOffset);
        const range = new vscode.Range(startPos, endPos);
        
        editor.setDecorations(decorationType, [{
            range,
            renderOptions: {
                before: {
                    contentText: '▶️',
                    backgroundColor: '#2979FF',
                    color: 'white',
                    width: '16px',
                    height: '16px',
                    border: '4px',
                    margin: '0 5px 0 0'
                }
            },
            hoverMessage: `Click to run: ${command.text.trim()}`
        }]);
    });
}

function getOrCreateDecorationType(id: string): vscode.TextEditorDecorationType {
    if (!decorationTypes[id]) {
        decorationTypes[id] = vscode.window.createTextEditorDecorationType({
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
            textDecoration: 'none; cursor: pointer;',
        });
        
        // Add click handler for this decoration
        vscode.window.onDidChangeTextEditorSelection(event => {
            const clickedPosition = event.selections[0].start;
            const editor = vscode.window.activeTextEditor;
            
            if (editor) {
                const text = editor.document.getText();
                const commands = commandParser.parseCommands(text);
                
                commands.forEach(command => {
                    const startPos = editor.document.positionAt(command.startOffset);
                    const buttonEndPos = new vscode.Position(startPos.line, startPos.character + 1);
                    
                    if (clickedPosition.line === startPos.line && 
                        clickedPosition.character >= startPos.character - 2 && 
                        clickedPosition.character <= buttonEndPos.character) {
                        vscode.commands.executeCommand('bash-runner.runCommand', command.text);
                    }
                });
            }
        });
    }
    
    return decorationTypes[id];
}

export function deactivate() {
    // Clean up decorations
    Object.values(decorationTypes).forEach(type => type.dispose());
    decorationTypes = {};
}