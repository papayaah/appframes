import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Screen, TextElement } from '@/components/AppFrames/types';

// Project interface - represents a complete project with all its screens
export interface Project {
  id: string; // Unique project identifier (UUID)
  name: string; // User-defined project name
  screensByCanvasSize: Record<string, Screen[]>; // Screens organized by canvas size key
  currentCanvasSize: string; // Currently active canvas size
  selectedScreenIndices: number[]; // Currently selected screens (for current canvas size)
  primarySelectedIndex: number; // Primary selection (for current canvas size)
  selectedFrameIndex: number | null; // Selected frame within screen
  zoom: number; // Canvas zoom level (10-400)
  createdAt: Date; // Project creation time
  updatedAt: Date; // Last modification time
  lastAccessedAt: Date; // Last time project was opened
}

// AppState interface - tracks app-level state
export interface AppState {
  id: string; // Always 'current' for single app state
  currentProjectId: string | null; // ID of currently open project
  sidebarTab: string; // Selected tab: 'layout' | 'device' | 'media' | 'text'
  sidebarPanelOpen: boolean; // Panel expanded/collapsed
  navWidth: number; // Sidebar width in pixels
  downloadFormat?: 'png' | 'jpg';
  downloadJpegQuality?: number; // 0-100
  updatedAt: Date; // Last modification time
}

// MediaFile interface - stored in IndexedDB
export interface MediaFile {
  id?: number;
  name: string;
  fileHandle: string; // OPFS file path
  thumbnail: string; // Base64 thumbnail for quick display
  width: number;
  height: number;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database schema definition for idb
interface AppFramesDBSchema extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { updatedAt: Date; lastAccessedAt: Date; name: string };
  };
  appState: {
    key: string;
    value: AppState;
  };
  mediaFiles: {
    key: number;
    value: MediaFile;
    indexes: { name: string; createdAt: Date };
  };
}

/**
 * PersistenceDB class - Manages IndexedDB operations using idb library
 * Handles projects, app state, and media files persistence
 */
class PersistenceDB {
  private db: IDBPDatabase<AppFramesDBSchema> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database with version 1 schema
   */
  async init(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB<AppFramesDBSchema>('AppFrames', 1, {
          upgrade(db) {
            // Create mediaFiles object store
            const mediaStore = db.createObjectStore('mediaFiles', {
              keyPath: 'id',
              autoIncrement: true,
            });
            mediaStore.createIndex('name', 'name');
            mediaStore.createIndex('createdAt', 'createdAt');

            // Create projects object store with indexes
            const projectsStore = db.createObjectStore('projects', {
              keyPath: 'id',
            });
            projectsStore.createIndex('updatedAt', 'updatedAt');
            projectsStore.createIndex('lastAccessedAt', 'lastAccessedAt');
            projectsStore.createIndex('name', 'name');

            // Create appState object store
            db.createObjectStore('appState', {
              keyPath: 'id',
            });
          },
        });
      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Create a new project with default state
   */
  async createProject(name: string): Promise<Project> {
    try {
      if (!this.db) await this.init();

      const project: Project = {
        id: crypto.randomUUID(),
        name,
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

      await this.db!.put('projects', project);
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Save a project to the database
   */
  async saveProject(project: Project): Promise<void> {
    try {
      if (!this.db) await this.init();

      await this.db!.put('projects', {
        ...project,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  /**
   * Load a project by ID
   */
  async loadProject(id: string): Promise<Project | null> {
    try {
      if (!this.db) await this.init();

      const project = await this.db!.get('projects', id);
      if (!project) return null;

      // Validate and sanitize the loaded project
      return validateProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      if (!this.db) await this.init();

      const projects = await this.db!.getAll('projects');
      
      // Validate and sanitize all loaded projects
      return projects.map(project => validateProject(project));
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  /**
   * Delete a project by ID
   */
  async deleteProject(id: string): Promise<void> {
    try {
      if (!this.db) await this.init();

      await this.db!.delete('projects', id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Rename a project
   */
  async renameProject(id: string, newName: string): Promise<void> {
    try {
      if (!this.db) await this.init();

      const project = await this.loadProject(id);
      if (project) {
        project.name = newName;
        await this.saveProject(project);
      }
    } catch (error) {
      console.error('Failed to rename project:', error);
      throw error;
    }
  }

  /**
   * Save app state (current project, UI preferences)
   */
  async saveAppState(state: Partial<AppState>): Promise<void> {
    try {
      if (!this.db) await this.init();

      await this.db!.put('appState', {
        ...state,
        id: 'current',
        updatedAt: new Date(),
      } as AppState);
    } catch (error) {
      console.error('Failed to save app state:', error);
      throw error;
    }
  }

  /**
   * Load app state
   */
  async loadAppState(): Promise<AppState | null> {
    try {
      if (!this.db) await this.init();

      const state = await this.db!.get('appState', 'current');
      return state || null;
    } catch (error) {
      console.error('Failed to load app state:', error);
      return null;
    }
  }

  /**
   * Get a media file by ID
   */
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    try {
      if (!this.db) await this.init();

      return await this.db!.get('mediaFiles', id);
    } catch (error) {
      console.error('Failed to get media file:', error);
      return undefined;
    }
  }

  /**
   * Get all media files
   */
  async getAllMediaFiles(): Promise<MediaFile[]> {
    try {
      if (!this.db) await this.init();

      return await this.db!.getAll('mediaFiles');
    } catch (error) {
      console.error('Failed to get all media files:', error);
      return [];
    }
  }

  /**
   * Add a media file
   */
  async addMediaFile(media: Omit<MediaFile, 'id'>): Promise<number> {
    try {
      if (!this.db) await this.init();

      return await this.db!.add('mediaFiles', media as MediaFile);
    } catch (error) {
      console.error('Failed to add media file:', error);
      throw error;
    }
  }

  /**
   * Delete a media file
   */
  async deleteMediaFile(id: number): Promise<void> {
    try {
      if (!this.db) await this.init();

      await this.db!.delete('mediaFiles', id);
    } catch (error) {
      console.error('Failed to delete media file:', error);
      throw error;
    }
  }
}

/**
 * Validate and sanitize a project loaded from the database
 * Returns a valid project with defaults applied for missing/invalid fields
 */
export function validateProject(project: any): Project {
  // If project is null/undefined, return default project structure
  if (!project || typeof project !== 'object') {
    return {
      id: crypto.randomUUID(),
      name: 'My Project',
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
  }

  // Validate and sanitize each field
  const validatedProject: Project = {
    // ID: must be a non-empty string
    id: typeof project.id === 'string' && project.id.length > 0 
      ? project.id 
      : crypto.randomUUID(),

    // Name: must be a non-empty string
    name: typeof project.name === 'string' && project.name.length > 0 
      ? project.name 
      : 'My Project',

    // screensByCanvasSize: must be an object with string keys and Screen[] values
    screensByCanvasSize: validateScreensByCanvasSize(project.screensByCanvasSize),

    // currentCanvasSize: must be a non-empty string
    currentCanvasSize: typeof project.currentCanvasSize === 'string' && project.currentCanvasSize.length > 0
      ? project.currentCanvasSize
      : 'iphone-6.5',

    // selectedScreenIndices: must be an array of numbers
    selectedScreenIndices: Array.isArray(project.selectedScreenIndices)
      ? project.selectedScreenIndices.filter((idx: any) => typeof idx === 'number' && idx >= 0)
      : [],

    // primarySelectedIndex: must be a non-negative number
    primarySelectedIndex: typeof project.primarySelectedIndex === 'number' && project.primarySelectedIndex >= 0
      ? project.primarySelectedIndex
      : 0,

    // selectedFrameIndex: must be a number or null
    selectedFrameIndex: typeof project.selectedFrameIndex === 'number' && project.selectedFrameIndex >= 0
      ? project.selectedFrameIndex
      : (project.selectedFrameIndex === null ? null : 0),

    // zoom: must be a number between 10 and 400
    zoom: clampZoom(project.zoom),

    // Dates: validate and convert to Date objects
    createdAt: validateDate(project.createdAt),
    updatedAt: validateDate(project.updatedAt),
    lastAccessedAt: validateDate(project.lastAccessedAt),
  };

  // Validate selectedScreenIndices are within bounds for current canvas size
  const screensForCurrentSize = validatedProject.screensByCanvasSize[validatedProject.currentCanvasSize] || [];
  validatedProject.selectedScreenIndices = validatedProject.selectedScreenIndices.filter(
    idx => idx >= 0 && idx < screensForCurrentSize.length
  );

  // If no valid selections remain and screens exist, select the first screen
  if (validatedProject.selectedScreenIndices.length === 0 && screensForCurrentSize.length > 0) {
    validatedProject.selectedScreenIndices = [0];
  }

  // Ensure primarySelectedIndex is within bounds
  if (screensForCurrentSize.length > 0) {
    validatedProject.primarySelectedIndex = Math.max(
      0,
      Math.min(validatedProject.primarySelectedIndex, screensForCurrentSize.length - 1)
    );
  } else {
    validatedProject.primarySelectedIndex = 0;
  }

  return validatedProject;
}

/**
 * Validate screensByCanvasSize object
 * Must be an object with string keys and Screen[] values
 */
function validateScreensByCanvasSize(screensByCanvasSize: any): Record<string, Screen[]> {
  if (!screensByCanvasSize || typeof screensByCanvasSize !== 'object' || Array.isArray(screensByCanvasSize)) {
    return {};
  }

  const validated: Record<string, Screen[]> = {};

  for (const [key, value] of Object.entries(screensByCanvasSize)) {
    // Key must be a non-empty string
    if (typeof key !== 'string' || key.length === 0) {
      continue;
    }

    // Value must be an array
    if (!Array.isArray(value)) {
      validated[key] = [];
      continue;
    }

    // Validate each screen in the array
    validated[key] = value
      .filter((screen: any) => screen && typeof screen === 'object')
      .map((screen: any) => validateScreen(screen));
  }

  return validated;
}

/**
 * Validate a single Screen object
 */
function validateScreen(screen: any): Screen {
  const legacySettings = screen?.settings && typeof screen.settings === 'object' ? screen.settings : {};
  const legacyCaption = {
    showCaption: legacySettings.showCaption,
    captionText: legacySettings.captionText,
    captionHorizontal: legacySettings.captionHorizontal,
    captionVertical: legacySettings.captionVertical,
    captionStyle: legacySettings.captionStyle,
  };

  // Legacy: compositionScale (50-100) used to exist at the screen settings level.
  // New: per-frame `frameScale` where 100 corresponds to the old default compositionScale (85).
  // We migrate only when a frame doesn't already define `frameScale`.
  const legacyCompositionScale =
    typeof legacySettings.compositionScale === 'number'
      ? Math.max(50, Math.min(100, legacySettings.compositionScale))
      : undefined;
  const legacyFrameScale =
    typeof legacyCompositionScale === 'number'
      ? Math.max(20, Math.min(200, Math.round(legacyCompositionScale / 0.85)))
      : undefined;

  const settings = validateCanvasSettings(screen.settings);

  // Text elements: validate current format, or migrate from legacy caption settings
  const migratedFromCaption =
    legacyCaption.showCaption === true &&
    typeof legacyCaption.captionText === 'string' &&
    legacyCaption.captionText.trim().length > 0
      ? [
          validateTextElement(
            {
              content: legacyCaption.captionText,
              x: legacyCaption.captionHorizontal,
              y: legacyCaption.captionVertical,
              rotation: 0,
              style: legacyCaption.captionStyle,
              visible: true,
              name: 'Text 1',
              zIndex: 1,
            },
            0
          ),
        ]
      : [];

  const rawTextElements = Array.isArray(screen.textElements)
    ? screen.textElements
    : migratedFromCaption;

  const validatedTextElements = validateTextElements(rawTextElements);

  // Ensure selectedTextId is valid (else clear it)
  const selectedTextId =
    typeof settings.selectedTextId === 'string' &&
    validatedTextElements.some(t => t.id === settings.selectedTextId)
      ? settings.selectedTextId
      : undefined;

  return {
    // ID: must be a non-empty string
    id: typeof screen.id === 'string' && screen.id.length > 0 
      ? screen.id 
      : `screen-${Date.now()}-${Math.random()}`,

    // Name: must be a string
    name: typeof screen.name === 'string' 
      ? screen.name 
      : 'Screen',

    // Images: must be an array of ScreenImage objects
    images: Array.isArray(screen.images)
      ? screen.images.map((img: any) => {
          const validated = validateScreenImage(img);
          if (typeof legacyFrameScale === 'number' && typeof validated.frameScale !== 'number') {
            validated.frameScale = legacyFrameScale;
          }
          return validated;
        })
      : [],

    // Settings: validate canvas settings
    settings: {
      ...settings,
      selectedTextId,
    },

    // Text elements
    textElements: validatedTextElements,
  };
}

/**
 * Validate a ScreenImage object
 */
function validateScreenImage(image: any): Screen['images'][0] {
  if (!image || typeof image !== 'object') {
    return {};
  }

  const validated: Screen['images'][0] = {};

  // deviceFrame: optional string (allow empty string to represent "no selection")
  if (typeof image.deviceFrame === 'string') {
    validated.deviceFrame = image.deviceFrame;
  }

  // cleared: optional boolean
  // Also treat legacy deviceFrame === '' as cleared.
  if (typeof image.cleared === 'boolean') {
    validated.cleared = image.cleared;
  } else if (image.deviceFrame === '') {
    validated.cleared = true;
  }

  // image: optional string (base64)
  if (typeof image.image === 'string') {
    validated.image = image.image;
  }

  // mediaId: optional number
  if (typeof image.mediaId === 'number') {
    validated.mediaId = image.mediaId;
  }

  // panX: optional number 0-100
  if (typeof image.panX === 'number') {
    validated.panX = Math.max(0, Math.min(100, image.panX));
  }

  // panY: optional number 0-100
  if (typeof image.panY === 'number') {
    validated.panY = Math.max(0, Math.min(100, image.panY));
  }

  // frameX: optional number
  if (typeof image.frameX === 'number') {
    validated.frameX = image.frameX;
  }

  // frameY: optional number
  if (typeof image.frameY === 'number') {
    validated.frameY = image.frameY;
  }

  // tiltX: optional number (-60 to 60)
  if (typeof image.tiltX === 'number') {
    validated.tiltX = Math.max(-60, Math.min(60, image.tiltX));
  }

  // tiltY: optional number (-60 to 60)
  if (typeof image.tiltY === 'number') {
    validated.tiltY = Math.max(-60, Math.min(60, image.tiltY));
  }

  // rotateZ: optional number (-180 to 180)
  if (typeof image.rotateZ === 'number') {
    validated.rotateZ = Math.max(-180, Math.min(180, image.rotateZ));
  }

  // frameScale: optional number (20 to 200)
  if (typeof image.frameScale === 'number') {
    validated.frameScale = Math.max(20, Math.min(200, image.frameScale));
  }

  return validated;
}

/**
 * Validate canvas settings
 */
function validateCanvasSettings(settings: any): Omit<Screen['settings'], never> {
  if (!settings || typeof settings !== 'object') {
    return getDefaultCanvasSettings();
  }

  const defaults = getDefaultCanvasSettings();

  return {
    canvasSize: typeof settings.canvasSize === 'string' && settings.canvasSize.length > 0
      ? settings.canvasSize
      : defaults.canvasSize,

    composition: ['single', 'dual', 'stack', 'triple', 'fan'].includes(settings.composition)
      ? settings.composition
      : defaults.composition,

    screenScale: typeof settings.screenScale === 'number'
      ? Math.max(0, Math.min(100, settings.screenScale))
      : defaults.screenScale,

    screenPanX: typeof settings.screenPanX === 'number'
      ? Math.max(0, Math.min(100, settings.screenPanX))
      : defaults.screenPanX,

    screenPanY: typeof settings.screenPanY === 'number'
      ? Math.max(0, Math.min(100, settings.screenPanY))
      : defaults.screenPanY,

    orientation: ['portrait', 'landscape'].includes(settings.orientation)
      ? settings.orientation
      : defaults.orientation,

    backgroundColor: typeof settings.backgroundColor === 'string' && settings.backgroundColor.length > 0
      ? settings.backgroundColor
      : defaults.backgroundColor,

    canvasBackgroundMediaId: typeof settings.canvasBackgroundMediaId === 'number' && !isNaN(settings.canvasBackgroundMediaId)
      ? settings.canvasBackgroundMediaId
      : defaults.canvasBackgroundMediaId,

    selectedTextId: typeof settings.selectedTextId === 'string' && settings.selectedTextId.length > 0
      ? settings.selectedTextId
      : defaults.selectedTextId,
  };
}

/**
 * Validate TextStyle object
 */
function validateTextStyle(style: any): TextElement['style'] {
  if (!style || typeof style !== 'object') {
    return getDefaultTextStyle();
  }

  const defaults = getDefaultTextStyle();

  return {
    fontFamily: typeof style.fontFamily === 'string' && style.fontFamily.length > 0
      ? style.fontFamily
      : defaults.fontFamily,

    fontSize: typeof style.fontSize === 'number' && style.fontSize > 0
      ? style.fontSize
      : defaults.fontSize,

    fontWeight: typeof style.fontWeight === 'number'
      ? style.fontWeight
      : defaults.fontWeight,

    color: typeof style.color === 'string' && style.color.length > 0
      ? style.color
      : defaults.color,

    backgroundColor: typeof style.backgroundColor === 'string' && style.backgroundColor.length > 0
      ? style.backgroundColor
      : defaults.backgroundColor,

    backgroundOpacity: typeof style.backgroundOpacity === 'number'
      ? Math.max(0, Math.min(100, style.backgroundOpacity))
      : defaults.backgroundOpacity,

    backgroundPadding: typeof style.backgroundPadding === 'number' && style.backgroundPadding >= 0
      ? style.backgroundPadding
      : defaults.backgroundPadding,

    backgroundRadius: typeof style.backgroundRadius === 'number' && style.backgroundRadius >= 0
      ? style.backgroundRadius
      : defaults.backgroundRadius,

    textAlign: ['left', 'center', 'right'].includes(style.textAlign)
      ? style.textAlign
      : defaults.textAlign,

    letterSpacing: typeof style.letterSpacing === 'number'
      ? style.letterSpacing
      : defaults.letterSpacing,

    lineHeight: typeof style.lineHeight === 'number' && style.lineHeight > 0
      ? style.lineHeight
      : defaults.lineHeight,

    textShadow: typeof style.textShadow === 'boolean'
      ? style.textShadow
      : defaults.textShadow,

    textShadowColor: typeof style.textShadowColor === 'string' && style.textShadowColor.length > 0
      ? style.textShadowColor
      : defaults.textShadowColor,

    textShadowBlur: typeof style.textShadowBlur === 'number' && style.textShadowBlur >= 0
      ? style.textShadowBlur
      : defaults.textShadowBlur,

    textShadowOffsetX: typeof style.textShadowOffsetX === 'number'
      ? style.textShadowOffsetX
      : defaults.textShadowOffsetX,

    textShadowOffsetY: typeof style.textShadowOffsetY === 'number'
      ? style.textShadowOffsetY
      : defaults.textShadowOffsetY,

    italic: typeof style.italic === 'boolean'
      ? style.italic
      : defaults.italic,

    uppercase: typeof style.uppercase === 'boolean'
      ? style.uppercase
      : defaults.uppercase,

    maxWidth: typeof style.maxWidth === 'number' && style.maxWidth > 0
      ? Math.max(0, Math.min(100, style.maxWidth))
      : defaults.maxWidth,
  };
}

/**
 * Get default canvas settings
 */
function getDefaultCanvasSettings(): Omit<Screen['settings'], never> {
  return {
    canvasSize: 'iphone-6.5',
    composition: 'single',
    screenScale: 100,
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    backgroundColor: '#E5E7EB',
    canvasBackgroundMediaId: undefined,
    selectedTextId: undefined,
  };
}

/**
 * Get default text style
 */
function getDefaultTextStyle(): TextElement['style'] {
  return {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: 700,
    color: '#1a1a1a',
    backgroundColor: 'transparent',
    backgroundOpacity: 100,
    backgroundPadding: 16,
    backgroundRadius: 8,
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 1.4,
    textShadow: true,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowBlur: 4,
    textShadowOffsetX: 0,
    textShadowOffsetY: 2,
    italic: false,
    uppercase: false,
    maxWidth: 80,
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(100, v));
const normalizeRotation = (deg: number) => ((deg % 360) + 360) % 360;

function validateTextElement(text: any, index: number): TextElement {
  const defaults = getDefaultTextStyle();
  const safeId =
    typeof text?.id === 'string' && text.id.length > 0
      ? text.id
      : `text-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const safeName =
    typeof text?.name === 'string' && text.name.trim().length > 0
      ? text.name
      : `Text ${index + 1}`;

  return {
    id: safeId,
    content: typeof text?.content === 'string' ? text.content : 'Double-click to edit',
    x: typeof text?.x === 'number' ? clamp01(text.x) : 50,
    y: typeof text?.y === 'number' ? clamp01(text.y) : 50,
    rotation: typeof text?.rotation === 'number' ? normalizeRotation(text.rotation) : 0,
    style: validateTextStyle(text?.style ?? defaults),
    visible: typeof text?.visible === 'boolean' ? text.visible : true,
    name: safeName,
    zIndex: typeof text?.zIndex === 'number' && isFinite(text.zIndex) ? text.zIndex : index + 1,
  };
}

function validateTextElements(textElements: any[]): TextElement[] {
  const validated = (textElements || [])
    .filter(t => t && typeof t === 'object')
    .map((t, idx) => validateTextElement(t, idx));

  // Normalize zIndex ordering to avoid duplicates/gaps and ensure deterministic render order
  const sorted = [...validated].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return sorted.map((t, i) => ({ ...t, zIndex: i + 1 }));
}

/**
 * Clamp zoom value to valid range (10-400%)
 */
function clampZoom(zoom: any): number {
  if (typeof zoom !== 'number' || isNaN(zoom)) {
    return 100; // Default zoom
  }
  return Math.max(10, Math.min(400, zoom));
}

/**
 * Validate and convert a date value
 */
function validateDate(date: any): Date {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date(); // Default to current date
}

// Export singleton instance
export const persistenceDB = new PersistenceDB();
