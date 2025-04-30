import * as vscode from 'vscode';

export class TerminalManager {
    private terminal: vscode.Terminal | undefined;
    
    executeCommand(command: string) {
        const config = vscode.workspace.getConfiguration('bashRunner');
        const createNewTerminal = config.get<boolean>('createNewTerminal', false);
        
        if (createNewTerminal || !this.terminal) {
            // Create a new terminal
            this.terminal = vscode.window.createTerminal('Bash Runner');
        }
        
        // Show the terminal
        this.terminal.show();
        
        // Clean up the command and execute it
        const cleanCommand = command.replace(/\\\n/g, ' ').trim();
        this.terminal.sendText(cleanCommand);
    }
}