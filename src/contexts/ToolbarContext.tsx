import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ToolbarContextType {
    toolbarContent: ReactNode | null;
    setToolbarContent: (content: ReactNode | null) => void;
    pageTitle: string | null;
    setPageTitle: (title: string | null) => void;
    backPath: string | null;
    setBackPath: (path: string | null) => void;
}

const ToolbarContext = createContext<ToolbarContextType>({
    toolbarContent: null,
    setToolbarContent: () => { },
    pageTitle: null,
    setPageTitle: () => { },
    backPath: null,
    setBackPath: () => { },
});

export function ToolbarProvider({ children }: { children: ReactNode }) {
    const [toolbarContent, setToolbarContent] = useState<ReactNode | null>(null);
    const [pageTitle, setPageTitle] = useState<string | null>(null);
    const [backPath, setBackPath] = useState<string | null>(null);

    return (
        <ToolbarContext.Provider value={{
            toolbarContent, setToolbarContent,
            pageTitle, setPageTitle,
            backPath, setBackPath
        }}>
            {children}
        </ToolbarContext.Provider>
    );
}

export function useToolbar() {
    return useContext(ToolbarContext);
}

// Hook to set toolbar content on mount and clear on unmount
export function usePageToolbar(content: ReactNode, title?: string) {
    const { setToolbarContent, setPageTitle } = useToolbar();

    React.useEffect(() => {
        setToolbarContent(content);
        if (title) setPageTitle(title);
        return () => {
            setToolbarContent(null);
            setPageTitle(null);
        };
    }, [content, title, setToolbarContent, setPageTitle]);
}
