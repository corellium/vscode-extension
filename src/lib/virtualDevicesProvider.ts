import { EventEmitter, TreeItemCollapsibleState } from 'vscode';
import type { Event, TreeDataProvider, TreeItem } from 'vscode';
import type { CorelliumApi } from '@corellium/client-api';
import type CorelliumInstance from './corelliumInstance';

class VirtualDevicesProvider implements TreeDataProvider<CorelliumInstance> {
  private apiInstance: CorelliumApi;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _onDidChangeTreeData: EventEmitter<
    CorelliumInstance | undefined | null
  > = new EventEmitter<CorelliumInstance | undefined | null>();

  public constructor(apiInstance: CorelliumApi) {
    this.apiInstance = apiInstance;
  }

  // eslint-disable-next-line class-methods-use-this
  public getTreeItem(element: CorelliumInstance): TreeItem {
    return element;
  }

  public async getChildren(
    element?: CorelliumInstance
  ): Promise<CorelliumInstance[]> {
    if (!element) {
      const projects = await this.apiInstance.v1GetProjects();

      const projectItems = projects.map((project) => {
        const usedCores = project.quotasUsed.cores;
        const totalCores = project.quotas.cores;
        const cores = `${usedCores}/${totalCores} cores used`;

        return {
          label: project.name,
          collapsibleState: TreeItemCollapsibleState.Expanded,
          projectUUID: project.id,
          description: cores,
        };
      });

      return projectItems as CorelliumInstance[];
    }

    if (!element.projectUUID) {
      return [];
    }

    const instances = await this.apiInstance.v1GetProjectInstances(
      element.projectUUID
    );

    const instanceItems = instances.map((instance) => {
      let { name } = instance;

      if (!name) {
        name =
          instance.type === 'android' ? 'Generic Android' : instance.flavor;
      }

      const description = `(${instance.flavor}, ${instance.os}) - ${instance.state}`;
      const tooltip = `Services: ${instance.serviceIp}, Wi-Fi: ${instance.wifiIp}`;

      return {
        label: name,
        collapsibleState: TreeItemCollapsibleState.None,
        instanceUUID: instance.id,
        tooltip,
        description,
        contextValue: instance.state,
      };
    });

    return instanceItems as CorelliumInstance[];
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly onDidChangeTreeData: Event<
    CorelliumInstance | undefined | null
    // eslint-disable-next-line no-underscore-dangle
  > = this._onDidChangeTreeData.event;

  public refresh(): void {
    // eslint-disable-next-line no-underscore-dangle
    this._onDidChangeTreeData.fire(null);
  }
}

export default VirtualDevicesProvider;
