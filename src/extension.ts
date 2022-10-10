import * as vscode from 'vscode';
import * as corelliumClient from '@corellium/client-api';

let apiInstance: any = null;

export const activate = (context: vscode.ExtensionContext) => {
  // Set up the API client object, note that apiInstance is global
  const configuration = vscode.workspace.getConfiguration('corellium');
  const defaultClient = corelliumClient.ApiClient.instance;
  const endpoint = configuration.get('endpoint');
  defaultClient.basePath = `${endpoint}/api`;
  const bearerAuth = defaultClient.authentications.BearerAuth;
  bearerAuth.accessToken = configuration.get('ApiKey');
  apiInstance = new corelliumClient.CorelliumApi();

  // Set up tree view for projects/devices
  const virtualDevicesProvider = new VirtualDevicesProvider();
  vscode.window.registerTreeDataProvider(
    'virtualDevices',
    virtualDevicesProvider
  );

  // Command handlers
  const turnOnDeviceCommandHandler = (instance: CorelliumInstance) => {
    apiInstance.v1StartInstance(instance.instanceUUID, null).then(
      () => {
        vscode.window.showInformationMessage(`Turning on ${instance.label}`);
      },
      (error: Error) => {
        vscode.window.showErrorMessage(
          `Failed to turn on device: ${error.message}`
        );
      }
    );
  };

  const turnOffDeviceCommandHandler = (instance: CorelliumInstance) => {
    apiInstance.v1StopInstance(instance.instanceUUID, null).then(
      () => {
        vscode.window.showInformationMessage(`Turning off ${instance.label}`);
      },
      (error: Error) => {
        vscode.window.showErrorMessage(
          `Failed to turn off device: ${error.message}`
        );
      }
    );
  };

  const rebootDeviceCommandHandler = (instance: CorelliumInstance) => {
    apiInstance.v1RebootInstance(instance.instanceUUID).then(
      () => {
        vscode.window.showInformationMessage(`Rebooting ${instance.label}`);
      },
      (error: Error) => {
        vscode.window.showErrorMessage(
          `Failed to reboot device: ${error.message}`
        );
      }
    );
  };

  const openInBrowserCommandHandler = (instance: CorelliumInstance) => {
    const url = `${endpoint}/devices/${instance.instanceUUID}/connect`;
    vscode.env.openExternal(vscode.Uri.parse(url));
  };

  // const writeEmitter = new vscode.EventEmitter<string>();
  const openConsoleCommandHandler = async (instance: CorelliumInstance) => {
    const consoleResult = await apiInstance.v1GetInstanceConsole(
      instance.instanceUUID
    );
    const consoleWSUrl = consoleResult.url;
    const pty = new CorelliumConsole(consoleWSUrl);
    const terminal = vscode.window.createTerminal({
      name: `Console: ${instance.label}`,
      pty,
    });
    terminal.show();
  };

  const takeSnapshotCommandHandler = async (instance: CorelliumInstance) => {
    const snapshotName = await vscode.window.showInputBox({
      placeHolder: 'My New Snapshot',
      prompt: 'Snapshot Name:',
      value: 'My New Snapshot',
    });
    const snapshotCreationOptions = {
      name: snapshotName,
    };
    apiInstance
      .v1CreateSnapshot(instance.instanceUUID, snapshotCreationOptions)
      .then(
        (data: { id: string }) => {
          vscode.window.showInformationMessage(
            `Snapshotting ${instance.label}: ${data.id}`
          );
        },
        (error: Error) => {
          vscode.window.showErrorMessage(
            `Failed to take snapshot: ${error.message}`
          );
        }
      );
  };

  const restoreSnapshotCommandHandler = async (instance: CorelliumInstance) => {
    const items: vscode.QuickPickItem[] = [];
    let snapshots = null;

    try {
      snapshots = await apiInstance.v1GetSnapshots(instance.instanceUUID);
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to fetch snapshots: ${error.message}`
      );
      return;
    }

    for (let index = 0; index < snapshots.length; index++) {
      const item = snapshots[index];
      items.push({
        label: item.name,
        description: item.id,
      });
    }

    const selection = await vscode.window.showQuickPick(items);
    if (!selection) {
      // User cancelled
      return;
    }

    try {
      await apiInstance.v1RestoreSnapshot(
        instance.instanceUUID,
        selection.description
      );
      vscode.window.showInformationMessage(
        `Restoring snapshot ${selection.label} on ${instance.label}`
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to restore snapshot: ${error.message}`
      );
    }
  };

  const refreshDevicesCommandHandler = () => {
    virtualDevicesProvider.refresh();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.startDevice',
      turnOnDeviceCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.stopDevice',
      turnOffDeviceCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.rebootDevice',
      rebootDeviceCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.openInBrowser',
      openInBrowserCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.openConsole',
      openConsoleCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.takeSnapshot',
      takeSnapshotCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.restoreSnapshot',
      restoreSnapshotCommandHandler
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'corellium.refreshDevices',
      refreshDevicesCommandHandler
    )
  );
};

// this method is called when your extension is deactivated
export const deactivate = () => {};
