import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly storagePrefix = 'letZCricket';

  private getStorageKey(name: string): string {
    return `${this.storagePrefix}:${name}`;
  }

  getObject<T>(name: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const value = window.localStorage.getItem(this.getStorageKey(name));
    return value ? (JSON.parse(value) as T) : null;
  }

  setObject<T>(name: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.getStorageKey(name), JSON.stringify(value));
  }

  updateObject<T extends Record<string, unknown>>(name: string, updates: Partial<T>): void {
    const current = this.getObject<T>(name) ?? ({} as T);
    this.setObject(name, { ...current, ...updates });
  }

  deleteObject(name: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(this.getStorageKey(name));
  }

  clearAll(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(`${this.storagePrefix}:`));
    keys.forEach((key) => window.localStorage.removeItem(key));
  }
}
