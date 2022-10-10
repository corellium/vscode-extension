/* eslint-disable import/unambiguous */

declare module '@corellium/client-api' {
  export const ApiClient: {
    instance: {
      authentications: {
        BearerAuth: {
          accessToken: string;
        };
      };
      basePath: string;
    };
  };
  export class CorelliumApi {
    public v1StartInstance(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<never>;
    public v1StopInstance(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<never>;
    public v1RebootInstance(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<never>;
    public v1GetInstanceConsole(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<{
      url?: string;
    }>;
    public v1CreateSnapshot(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<{
      id?: string;
    }>;
    public v1GetSnapshots(
      instanceUUID: string,
      opts?: Record<string, unknown>
    ): Promise<
      {
        name: string;
        id: string;
      }[]
    >;
    public v1RestoreSnapshot(
      instanceUUID: string,
      snapshotId: string,
      opts?: Record<string, unknown>
    ): Promise<never>;
  }
}
