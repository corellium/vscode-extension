import type { TreeDataProvider } from 'vscode';
import type CorelliumInstance from './corelliumInstance';

class VirtualDevicesProvider implements TreeDataProvider<CorelliumInstance> {
  constructor() {}

  getTreeItem(element: CorelliumInstance): vscode.TreeItem {
    return element;
  }

  getChildren(element: CorelliumInstance): Thenable<CorelliumInstance[]> {
    if (element) {
      if (element.projectUUID !== null && element.projectUUID !== undefined) {
        return apiInstance
          .v1GetProjectInstances(element.projectUUID, null)
          .then(
            async (instances: []) => {
              const instanceItems = [];
              for (const instance of instances) {
                let name = null;
                if (!instance.name) {
                  if (instance.type === 'android') {
                    name = 'Generic Android';
                  } else {
                    name = instance.flavor;
                  }
                } else {
                  name = instance.name;
                }

                const description = `(${instance.flavor}, ${instance.os}) - ${instance.state}`;
                const tooltip = `Services: ${instance.serviceIp}, Wi-Fi: ${instance.wifiIp}`;

                const instanceItem = {
                  label: name,
                  collapsibleState: vscode.TreeItemCollapsibleState.None,
                  instanceUUID: instance.id,
                  tooltip,
                  description,
                  contextValue: instance.state,
                };
                instanceItems.push(instanceItem);
              }
              return Promise.resolve(instanceItems);
            },
            (error: Error) => {
              console.error(error);
            }
          );
      }
      console.log(`Device: ${element.label}`);

      return Promise.resolve([]);
    }
    return apiInstance.v1GetProjects(null).then(
      async (projects: []) => {
        const projectItems = [];
        for (const project of projects) {
          const usedCores = project.quotasUsed.cores;
          const totalCores = project.quotas.cores;
          const cores = `${usedCores}/${totalCores} cores used`;
          const projectItem = {
            label: project.name,
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            projectUUID: project.id,
            description: cores,
          };
          projectItems.push(projectItem);
        }
        return Promise.resolve(projectItems);
      },
      (error: Error) => {
        console.error(error);
      }
    );
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    CorelliumInstance | undefined | null | void
  > = new vscode.EventEmitter<CorelliumInstance | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<
    CorelliumInstance | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export default VirtualDevicesProvider;
