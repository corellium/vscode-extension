import type { Pseudoterminal, Event, EventEmitter } from 'vscode';
import { WebSocket } from 'ws';

class CorelliumConsole implements Pseudoterminal {
  private writeEmitter: EventEmitter<string>;

  private consoleWebSocket: WebSocket;

  onDidWrite: Event<string>;

  constructor(consoleWSUrl: string) {
    this.writeEmitter = new vscode.EventEmitter<string>();
    this.onDidWrite = this.writeEmitter.event;

    this.consoleWebSocket = new WebSocket(consoleWSUrl);
    this.consoleWebSocket.on('message', (data: any) => {
      this.writeEmitter.fire(data.toString());
    });
  }

  open(): void {}

  close(): void {
    this.consoleWebSocket.close();
  }

  handleInput(data: string): void {
    this.consoleWebSocket.send(data);
  }
}

export default CorelliumConsole;
