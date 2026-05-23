import { createContext, useContext } from 'react';

const EditorContext = createContext(null);

export function useEditor() {
  return useContext(EditorContext);
}

export default EditorContext;
