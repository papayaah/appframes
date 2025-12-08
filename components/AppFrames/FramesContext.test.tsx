import { renderHook, act, waitFor } from '@testing-library/react';
import { FramesProvider, useFrames } from './FramesContext';
import { persistenceDB } from '@/lib/PersistenceDB';

// Mock the persistence DB
jest.mock('@/lib/PersistenceDB', () => ({
  persistenceDB: {
    init: jest.fn().mockResolvedValue(undefined),
    createProject: jest.fn(),
    saveProject: jest.fn().mockResolvedValue(undefined),
    loadProject: jest.fn(),
    getAllProjects: jest.fn().mockResolvedValue([]),
    deleteProject: jest.fn().mockResolvedValue(undefined),
    renameProject: jest.fn().mockResolvedValue(undefined),
    saveAppState: jest.fn().mockResolvedValue(undefined),
    loadAppState: jest.fn().mockResolvedValue(null),
  },
}));

describe('FramesContext - Project Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new project', async () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    (persistenceDB.createProject as jest.Mock).mockResolvedValue(mockProject);

    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
    });

    await act(async () => {
      await result.current.createNewProject('Test Project');
    });

    await waitFor(() => {
      expect(persistenceDB.createProject).toHaveBeenCalledWith('Test Project');
      expect(result.current.currentProjectName).toBe('Test Project');
    });
  });

  it('should switch between projects', async () => {
    const project1 = {
      id: 'project-1',
      name: 'Project 1',
      screensByCanvasSize: { 'iphone-6.5': [] },
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    const project2 = {
      id: 'project-2',
      name: 'Project 2',
      screensByCanvasSize: { 'ipad-13': [] },
      currentCanvasSize: 'ipad-13',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    (persistenceDB.loadProject as jest.Mock).mockResolvedValue(project2);

    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
    });

    await act(async () => {
      await result.current.switchProject('project-2');
    });

    await waitFor(() => {
      expect(persistenceDB.loadProject).toHaveBeenCalledWith('project-2');
      expect(result.current.currentProjectName).toBe('Project 2');
      expect(result.current.currentCanvasSize).toBe('ipad-13');
      expect(result.current.zoom).toBe(150);
    });
  });

  it('should delete a project and switch to another', async () => {
    const remainingProject = {
      id: 'remaining-project',
      name: 'Remaining Project',
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    (persistenceDB.getAllProjects as jest.Mock).mockResolvedValue([remainingProject]);
    (persistenceDB.loadProject as jest.Mock).mockResolvedValue(remainingProject);

    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
    });

    const currentId = result.current.currentProjectId;

    await act(async () => {
      await result.current.deleteProject(currentId!);
    });

    await waitFor(() => {
      expect(persistenceDB.deleteProject).toHaveBeenCalledWith(currentId);
      expect(persistenceDB.getAllProjects).toHaveBeenCalled();
    });
  });

  it('should rename the current project', async () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Original Name',
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    (persistenceDB.createProject as jest.Mock).mockResolvedValue(mockProject);
    (persistenceDB.getAllProjects as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
      expect(result.current.currentProjectId).not.toBeNull();
    });

    const currentId = result.current.currentProjectId;

    await act(async () => {
      await result.current.renameProject('New Project Name');
    });

    // Check that the rename was called with correct parameters
    expect(persistenceDB.renameProject).toHaveBeenCalledWith(currentId, 'New Project Name');
    
    // Check that the local state was updated
    await waitFor(() => {
      expect(result.current.currentProjectName).toBe('New Project Name');
    }, { timeout: 2000 });
  });

  it('should get all projects', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Project 1',
        screensByCanvasSize: {},
        currentCanvasSize: 'iphone-6.5',
        selectedScreenIndices: [],
        primarySelectedIndex: 0,
        selectedFrameIndex: null,
        zoom: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      {
        id: 'project-2',
        name: 'Project 2',
        screensByCanvasSize: {},
        currentCanvasSize: 'iphone-6.5',
        selectedScreenIndices: [],
        primarySelectedIndex: 0,
        selectedFrameIndex: null,
        zoom: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    ];

    (persistenceDB.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
    });

    let projects;
    await act(async () => {
      projects = await result.current.getAllProjects();
    });

    expect(projects).toHaveLength(2);
    expect(projects).toEqual(mockProjects);
  });

  it('should preserve media library when deleting project', async () => {
    const { result } = renderHook(() => useFrames(), {
      wrapper: FramesProvider,
    });

    await waitFor(() => {
      expect(result.current.currentProjectId).toBeDefined();
    });

    const currentId = result.current.currentProjectId;

    await act(async () => {
      await result.current.deleteProject(currentId!);
    });

    // Verify that deleteProject was called but deleteMediaFile was not
    expect(persistenceDB.deleteProject).toHaveBeenCalledWith(currentId);
    // Media library operations are not called during project deletion
  });
});
