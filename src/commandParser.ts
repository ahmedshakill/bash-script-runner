import * as vscode from 'vscode';

export interface BashCommand {
    text: string;
    startOffset: number;
    endOffset: number;
    isMultiLine: boolean;
}

export class CommandParser {
    parseCommands(text: string): BashCommand[] {
        const commands: BashCommand[] = [];
        const lines = text.split('\n');
        
        let currentCommand: BashCommand | null = null;
        let offset = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                offset += line.length + 1; // +1 for newline
                continue;
            }
            
            // Check if this is a continuation of a multi-line command
            if (currentCommand && trimmedLine.endsWith('\\')) {
                // Continue the current command
                currentCommand.text += '\n' + line;
                currentCommand.endOffset = offset + line.length;
            } else if (currentCommand) {
                // Finish the current multi-line command
                currentCommand.text += '\n' + line;
                currentCommand.endOffset = offset + line.length;
                commands.push(currentCommand);
                currentCommand = null;
            } else if (trimmedLine.endsWith('\\')) {
                // Start a new multi-line command
                currentCommand = {
                    text: line,
                    startOffset: offset,
                    endOffset: offset + line.length,
                    isMultiLine: true
                };
            } else {
                // Single line command
                commands.push({
                    text: line,
                    startOffset: offset,
                    endOffset: offset + line.length,
                    isMultiLine: false
                });
            }
            
            offset += line.length + 1; // +1 for newline
        }
        
        // Add any unfinished command
        if (currentCommand) {
            commands.push(currentCommand);
        }
        
        return commands;
    }
}