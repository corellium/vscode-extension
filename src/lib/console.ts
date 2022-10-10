import { EventEmitter } from 'vscode';
import type { Pseudoterminal, Event } from 'vscode';
import { WebSocket } from 'ws';

class CorelliumConsole implements Pseudoterminal {
  public onDidWrite: Event<string>;

  private writeEmitter: EventEmitter<string>;

  private consoleWebSocket: WebSocket;

  public constructor(consoleWSUrl: string) {
    this.writeEmitter = new EventEmitter<string>();
    this.onDidWrite = this.writeEmitter.event;

    this.consoleWebSocket = new WebSocket(consoleWSUrl);
    this.consoleWebSocket.on('message', (data) => {
      const message =
        typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      this.writeEmitter.fire(message);
    });
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public open(): void {}

  public close(): void {
    this.consoleWebSocket.close();
  }

  public handleInput(data: string): void {
    this.consoleWebSocket.send(data);
  }
}

export default CorelliumConsole;
