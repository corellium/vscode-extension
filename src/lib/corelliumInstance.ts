import type { TreeItemCollapsibleState } from 'vscode';
import { TreeItem } from 'vscode';

class CorelliumInstance extends TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public projectUUID: string,
    public instanceUUID: string,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.instanceUUID = instanceUUID;
    this.projectUUID = projectUUID;
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }
}

export default CorelliumInstance;
