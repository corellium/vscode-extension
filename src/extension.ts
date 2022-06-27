import * as vscode from 'vscode';
const corelliumClient = require('@corellium/client-api');
const ws = require('ws');

let apiInstance: any = null;

export default class CorelliumConsole implements vscode.Pseudoterminal {
	private writeEmitter: vscode.EventEmitter<string>;
	private consoleWebSocket: ws.WebSocket;

	onDidWrite: vscode.Event<string>;

	constructor(consoleWSUrl: string) {
		this.writeEmitter = new vscode.EventEmitter<string>();
		this.onDidWrite = this.writeEmitter.event;

		this.consoleWebSocket = new ws.WebSocket(consoleWSUrl);
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
};

export class VirtualDevicesProvider implements vscode.TreeDataProvider<CorelliumInstance> {
	constructor() {}
  
	getTreeItem(element: CorelliumInstance): vscode.TreeItem {
	  return element;
	}
  
	getChildren(element: CorelliumInstance): Thenable<CorelliumInstance[]> {
	  if (element) {
		if (element.projectUUID !== null && element.projectUUID !== undefined) {
			return apiInstance.v1GetProjectInstances(element.projectUUID, null).then((instances: []) => {
				var instanceItems = [];
				for (let instance of instances) {
					let name = null;
					if (!instance['name']) {
						if (instance['type'] === 'android') {
							name = "Generic Android";	
						} else {
							name = instance['flavor'];
						}
					} else {
						name = instance['name'];
					}

					let description = '(' + instance['flavor'] + ', ' + instance['os'] + ') - ' + instance['state'];
					let tooltip = 'Services: ' + instance['serviceIp'] + ', Wi-Fi: ' + instance['wifiIp'];

					let instanceItem = {
						"label": name,
						"collapsibleState": vscode.TreeItemCollapsibleState.None,
						"instanceUUID": instance["id"],
						"tooltip": tooltip,
						"description": description,
						"contextValue": instance['state']
					};
					instanceItems.push(instanceItem);
				}
				return Promise.resolve(instanceItems);
			}, (error: Error) => {
			  console.error(error);
			});
		} else {
			console.log("Device: " + element.label);
		}
		return Promise.resolve([]);
	  } else {
		return apiInstance.v1GetProjects(null).then((projects: []) => {
			var projectItems = [];
			for (let project of projects) {
				let usedCores = project['quotasUsed']['cores'];
				let totalCores = project['quotas']['cores'];
				let cores = usedCores + '/' + totalCores + ' cores used';
				let projectItem = {
					"label": project["name"],
					"collapsibleState": vscode.TreeItemCollapsibleState.Expanded,
					"projectUUID": project["id"],
					"description": cores
				};
				projectItems.push(projectItem);
			}
			return Promise.resolve(projectItems);
		}, (error: Error) => {
		  console.error(error);
		});
	  }
	}

	private _onDidChangeTreeData: vscode.EventEmitter<CorelliumInstance | undefined | null | void> = new vscode.EventEmitter<CorelliumInstance | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<CorelliumInstance | undefined | null | void> = this._onDidChangeTreeData.event;
  
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

class CorelliumInstance extends vscode.TreeItem {
	constructor(
	  public readonly label: string,
	  private version: string,
	  public projectUUID: string,
	  public instanceUUID: string,
	  public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
	  super(label, collapsibleState);
	  this.instanceUUID = instanceUUID;
	  this.projectUUID = projectUUID;
	  this.tooltip = `${this.label}-${this.version}`;
	  this.description = this.version;
	}
}

export function activate(context: vscode.ExtensionContext) {
	// Set up the API client object, note that apiInstance is global
	let configuration = vscode.workspace.getConfiguration('corellium');	
	let defaultClient = corelliumClient.ApiClient.instance;
	let endpoint = configuration.get('endpoint');
	defaultClient.basePath = endpoint + '/api';
	let bearerAuth = defaultClient.authentications['BearerAuth'];
	bearerAuth.accessToken = configuration.get('ApiKey');
	apiInstance = new corelliumClient.CorelliumApi();

	// Set up tree view for projects/devices
	let virtualDevicesProvider = new VirtualDevicesProvider();
	vscode.window.registerTreeDataProvider('virtualDevices', virtualDevicesProvider);

	// Command handlers
	let turnOnDeviceCommandHandler = (instance: CorelliumInstance) => {
		apiInstance.v1StartInstance(instance.instanceUUID, null).then(() => {
			vscode.window.showInformationMessage("Turning on " + instance.label);
		}, (error: Error) => {
			vscode.window.showErrorMessage("Failed to turn on device: " + error.message);
		});
	};

	let turnOffDeviceCommandHandler = (instance: CorelliumInstance) => {
		apiInstance.v1StopInstance(instance.instanceUUID, null).then(() => {
			vscode.window.showInformationMessage("Turning off " + instance.label);
		}, (error: Error) => {
			vscode.window.showErrorMessage("Failed to turn off device: " + error.message);
		});
	};

	let rebootDeviceCommandHandler = (instance: CorelliumInstance) => {
		apiInstance.v1RebootInstance(instance.instanceUUID).then(() => {
			vscode.window.showInformationMessage("Rebooting " + instance.label);
		}, (error: Error) => {
			vscode.window.showErrorMessage("Failed to reboot device: " + error.message);
		});
	};

	let openInBrowserCommandHandler = (instance: CorelliumInstance) => {
		let url = endpoint + '/devices/' + instance.instanceUUID + '/connect';
		vscode.env.openExternal(vscode.Uri.parse(url));
	};

	// const writeEmitter = new vscode.EventEmitter<string>();
	let openConsoleCommandHandler = async (instance: CorelliumInstance) => {
		let consoleResult = await apiInstance.v1GetInstanceConsole(instance.instanceUUID);
		let consoleWSUrl = consoleResult["url"];
		const pty = new CorelliumConsole(consoleWSUrl);
		const terminal = vscode.window.createTerminal({name: `Console: ${instance.label}`, pty: pty});
		terminal.show();
	};

	let refreshDevicesCommandHandler = () => {
		virtualDevicesProvider.refresh();
	};

	context.subscriptions.push(vscode.commands.registerCommand('corellium.startDevice', turnOnDeviceCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.stopDevice', turnOffDeviceCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.rebootDevice', rebootDeviceCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.openInBrowser', openInBrowserCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.openConsole', openConsoleCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.refreshDevices', refreshDevicesCommandHandler));
}

// this method is called when your extension is deactivated
export function deactivate() {}
