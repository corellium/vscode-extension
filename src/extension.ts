import * as vscode from 'vscode';
const corelliumClient = require('@corellium/client-api');

let apiInstance: any = null;

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
		apiInstance.v1StartInstance(instance.instanceUUID, null);
	};

	let turnOffDeviceCommandHandler = (instance: CorelliumInstance) => {
		apiInstance.v1StopInstance(instance.instanceUUID, null);
	};

	let openInBrowserCommandHandler = (instance: CorelliumInstance) => {
		let url = endpoint + '/devices/' + instance.instanceUUID + '/connect';
		vscode.env.openExternal(vscode.Uri.parse(url));
	};

	let refreshDevicesCommandHandler = () => {
		virtualDevicesProvider.refresh();
	};

	context.subscriptions.push(vscode.commands.registerCommand('corellium.startDevice', turnOnDeviceCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.stopDevice', turnOffDeviceCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.openInBrowser', openInBrowserCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand('corellium.refreshDevices', refreshDevicesCommandHandler));
}

// this method is called when your extension is deactivated
export function deactivate() {}
