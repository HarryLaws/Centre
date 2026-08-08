import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

type ContentMap = Record<string, string>;

type ContentState = {
  content: ContentMap;
  loaded: boolean;
  editMode: boolean;
  toggleEditMode: () => void;
  getText: (key: string, fallback: string) => string;
  getImage: (key: string, fallback: string) => string;
  saveContent: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  resetContent: (key: string) => Promise<{ success: boolean; error?: string }>;
};

const ContentContext = createContext<ContentState | undefined>(undefined);

const EDIT_MODE_STORAGE_KEY = 'siteEditMode';

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentMap>({});
  const [loaded, setLoaded] = useState(false);
  const [editMode, setEditMode] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(EDIT_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        const response = await fetch('/api/content');
        const data = await response.json().catch(() => null);
        if (!cancelled && data?.content && typeof data.content === 'object') {
          setContent(data.content);
        }
      } catch {
        // Keep defaults if content can't be loaded.
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((current) => {
      const next = !current;
      try {
        window.sessionStorage.setItem(EDIT_MODE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors (private browsing, etc).
      }
      return next;
    });
  }, []);

  const getText = useCallback(
    (key: string, fallback: string) => {
      const value = content[key];
      return typeof value === 'string' && value.length > 0 ? value : fallback;
    },
    [content],
  );

  const getImage = useCallback(
    (key: string, fallback: string) => {
      const value = content[key];
      return typeof value === 'string' && value.length > 0 ? value : fallback;
    },
    [content],
  );

  const saveContent = useCallback(async (key: string, value: string) => {
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [key]: value } }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to save changes.' };
      }
      if (data?.content && typeof data.content === 'object') {
        setContent(data.content);
      } else {
        setContent((current) => ({ ...current, [key]: value }));
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to save changes.' };
    }
  }, []);

  const resetContent = useCallback(async (key: string) => {
    try {
      const response = await fetch(`/api/content/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to reset content.' };
      }
      setContent(data?.content && typeof data.content === 'object' ? data.content : {});
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to reset content.' };
    }
  }, []);

  return (
    <ContentContext.Provider
      value={{ content, loaded, editMode, toggleEditMode, getText, getImage, saveContent, resetContent }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContentState() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContentState must be used within ContentProvider');
  }
  return context;
}
