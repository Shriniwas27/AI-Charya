// src/global.d.ts

declare global {
  interface Window {
    cv: any;
  }
}

// Adding this export makes the file a module, which is good practice.
export {};