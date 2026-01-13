declare module 'react-dom/client' {
  // Minimal shim so TypeScript can compile in environments where @types/react-dom
  // isn't included (tsconfig.json has an explicit `types` list).
  export const createRoot: any;
  export const hydrateRoot: any;
}


