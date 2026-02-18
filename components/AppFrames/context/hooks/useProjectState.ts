
import { useState, useCallback, useRef, useMemo } from 'react';
import { usePatchHistory } from '@/hooks/usePatchHistory';
import { persistenceDB } from '@/lib/PersistenceDB';
import { Screen, TextElement } from '../../types';
import { UndoableDoc } from '../types';
import { getDefaultDIYOptions } from '../../diy-frames/types';
import { getDefaultScreenSettings, createDefaultTextElement } from '../utils';

export function useProjectState() {
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const projectCreatedAt = useRef<Date>(new Date());
    const projectPristine = useRef<boolean>(true);
    const hasCompletedFirstContentSave = useRef<boolean>(false);

    const createInitialDoc = useCallback((): UndoableDoc => {
        const defaultTextElements: TextElement[] = [createDefaultTextElement([])];
        const initialScreen: Screen = {
            id: `screen-0`,
            name: 'Screen 1',
            images: [{ diyOptions: getDefaultDIYOptions('phone') }],
            settings: getDefaultScreenSettings(),
            textElements: defaultTextElements,
        };
        return {
            name: 'My Project',
            screensByCanvasSize: { 'iphone-6.9': [initialScreen] },
        };
    }, []);

    const {
        state: doc,
        commit: commitDoc,
        mutate: mutateDoc,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetDocWithHistory,
        past,
        future,
        goTo,
        position,
    } = usePatchHistory<UndoableDoc>(() => createInitialDoc(), { maxHistory: 100 });

    const historyEntries = useMemo(() => [...past, ...future], [past, future]);
    const historyPosition = position;
    const goToHistory = useCallback((p: number) => goTo(p), [goTo]);

    // Project management actions
    const createNewProject = useCallback(async (name: string) => {
        // initialize new project in DB
        const newProject = await persistenceDB.createProject(name);

        // Update state to match new project
        setCurrentProjectId(newProject.id);
        resetDocWithHistory({
            name: newProject.name,
            screensByCanvasSize: newProject.screensByCanvasSize,
            sharedBackgrounds: newProject.sharedBackgrounds
        });

        projectCreatedAt.current = newProject.createdAt;
        projectPristine.current = true;
        hasCompletedFirstContentSave.current = false;
    }, [resetDocWithHistory]);

    const loadProject = useCallback(async (projectId: string) => {
        const project = await persistenceDB.loadProject(projectId);
        if (!project) return null;

        // Reset doc state
        resetDocWithHistory({
            name: project.name,
            screensByCanvasSize: project.screensByCanvasSize,
            sharedBackgrounds: project.sharedBackgrounds
        });

        // Update meta
        setCurrentProjectId(project.id);
        projectCreatedAt.current = project.createdAt;
        projectPristine.current = project.pristine;
        hasCompletedFirstContentSave.current = false;

        return project;
    }, [resetDocWithHistory]);

    const initializeDefaultProject = useCallback(async () => {
        const newProject = await persistenceDB.createProject('My Project');
        const seed = createInitialDoc();
        newProject.screensByCanvasSize = seed.screensByCanvasSize;
        // Set initial canvas size if possible, though defaults to iphone-6.9
        const firstSize = Object.keys(seed.screensByCanvasSize)[0];
        if (firstSize) {
            newProject.currentCanvasSize = firstSize;
        }

        await persistenceDB.saveProject(newProject);

        // Load it into state
        resetDocWithHistory({
            name: newProject.name,
            screensByCanvasSize: newProject.screensByCanvasSize,
            sharedBackgrounds: newProject.sharedBackgrounds
        });
        setCurrentProjectId(newProject.id);
        projectCreatedAt.current = newProject.createdAt;
        projectPristine.current = newProject.pristine;
        hasCompletedFirstContentSave.current = false;

        return newProject;
    }, [createInitialDoc, resetDocWithHistory]);

    const renameProject = useCallback(async (newName: string) => {
        commitDoc('Rename project', (draft) => {
            draft.name = newName;
        });
    }, [commitDoc]);

    const deleteProject = useCallback(async (projectId: string) => {
        await persistenceDB.deleteProject(projectId);
    }, []);

    const getAllProjects = useCallback(async () => {
        return await persistenceDB.getAllProjects();
    }, []);

    return {
        doc,
        commitDoc,
        mutateDoc,
        undo,
        redo,
        canUndo,
        canRedo,
        historyEntries,
        historyPosition,
        goToHistory,
        resetDocWithHistory,
        currentProjectId,
        setCurrentProjectId,
        projectCreatedAt,
        projectPristine,
        hasCompletedFirstContentSave,
        createNewProject,
        loadProject,
        initializeDefaultProject,
        renameProject,
        deleteProject,
        getAllProjects,
    };
}
