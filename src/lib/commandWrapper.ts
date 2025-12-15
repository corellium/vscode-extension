import type CorelliumInstance from './corelliumInstance';
import { window } from 'vscode';

/**
 * Обёртка для команд, которые требуют CorelliumInstance
 */
export function withInstance(
    fn: (instance: CorelliumInstance, ...args: any[]) => Promise<void>
) {
    return async (instance?: CorelliumInstance, ...args: any[]) => {
        if (!instance) {
            console.warn('[Corellium] Command called but instance is undefined. Possibly during tree refresh.');
            return;
        }

        try {
            await fn(instance, ...args);
        } catch (error: any) {
            const message = error?.body?.error || error?.message || 'Unknown error';
            await window.showErrorMessage(`Command failed: ${message}`);
        }
    };
}
