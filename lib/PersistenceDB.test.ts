import { validateProject } from './PersistenceDB';

describe('validateProject', () => {
  it('should return default project for null input', () => {
    const result = validateProject(null);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('My Project');
    expect(result.screensByCanvasSize).toEqual({});
    expect(result.currentCanvasSize).toBe('iphone-6.5');
    expect(result.selectedScreenIndices).toEqual([]);
    expect(result.primarySelectedIndex).toBe(0);
    expect(result.selectedFrameIndex).toBe(null);
    expect(result.zoom).toBe(100);
  });

  it('should return default project for undefined input', () => {
    const result = validateProject(undefined);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('My Project');
  });

  it('should validate required fields exist', () => {
    const invalidProject = {
      // Missing id, name, etc.
      screensByCanvasSize: {},
    };
    
    const result = validateProject(invalidProject);
    
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.name).toBe('My Project');
    expect(result.currentCanvasSize).toBe('iphone-6.5');
    expect(result.zoom).toBe(100);
  });

  it('should validate screensByCanvasSize is an object with string keys and Screen[] values', () => {
    const project = {
      id: 'test-id',
      name: 'Test Project',
      screensByCanvasSize: {
        'iphone-6.5': [
          {
            id: 'screen-1',
            name: 'Screen 1',
            images: [],
            settings: {
              canvasSize: 'iphone-6.5',
              deviceFrame: 'iphone-14-pro',
              composition: 'single',
              compositionScale: 85,
              captionVertical: 10,
              captionHorizontal: 50,
              screenScale: 100,
              screenPanX: 50,
              screenPanY: 50,
              orientation: 'portrait',
              backgroundColor: '#E5E7EB',
              captionText: 'Test',
              showCaption: true,
              captionStyle: {
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
              },
            },
          },
        ],
      },
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [0],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    const result = validateProject(project);
    
    expect(result.screensByCanvasSize).toBeDefined();
    expect(typeof result.screensByCanvasSize).toBe('object');
    expect(Array.isArray(result.screensByCanvasSize['iphone-6.5'])).toBe(true);
    expect(result.screensByCanvasSize['iphone-6.5'].length).toBe(1);
  });

  it('should clamp zoom value to valid range (10-400%)', () => {
    const projectWithLowZoom = {
      id: 'test-id',
      name: 'Test',
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [],
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 5, // Below minimum
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    const result1 = validateProject(projectWithLowZoom);
    expect(result1.zoom).toBe(10);
    
    const projectWithHighZoom = {
      ...projectWithLowZoom,
      zoom: 500, // Above maximum
    };
    
    const result2 = validateProject(projectWithHighZoom);
    expect(result2.zoom).toBe(400);
    
    const projectWithValidZoom = {
      ...projectWithLowZoom,
      zoom: 150,
    };
    
    const result3 = validateProject(projectWithValidZoom);
    expect(result3.zoom).toBe(150);
  });

  it('should validate selectedScreenIndices are within bounds for current canvas size', () => {
    const project = {
      id: 'test-id',
      name: 'Test',
      screensByCanvasSize: {
        'iphone-6.5': [
          {
            id: 'screen-1',
            name: 'Screen 1',
            images: [],
            settings: {
              canvasSize: 'iphone-6.5',
              deviceFrame: 'iphone-14-pro',
              composition: 'single',
              compositionScale: 85,
              captionVertical: 10,
              captionHorizontal: 50,
              screenScale: 100,
              screenPanX: 50,
              screenPanY: 50,
              orientation: 'portrait',
              backgroundColor: '#E5E7EB',
              captionText: 'Test',
              showCaption: true,
              captionStyle: {
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
              },
            },
          },
        ],
      },
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [0, 5, 10], // 5 and 10 are out of bounds
      primarySelectedIndex: 0,
      selectedFrameIndex: null,
      zoom: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    const result = validateProject(project);
    
    // Should only keep index 0, which is within bounds
    expect(result.selectedScreenIndices).toEqual([0]);
  });

  it('should return default state if validation fails', () => {
    const invalidProject = {
      id: 123, // Invalid type
      name: '', // Empty name
      screensByCanvasSize: 'not-an-object', // Invalid type
      currentCanvasSize: '', // Empty
      selectedScreenIndices: 'not-an-array', // Invalid type
      zoom: 'not-a-number', // Invalid type
    };
    
    const result = validateProject(invalidProject);
    
    expect(typeof result.id).toBe('string');
    expect(result.name).toBe('My Project');
    expect(typeof result.screensByCanvasSize).toBe('object');
    expect(result.currentCanvasSize).toBe('iphone-6.5');
    expect(Array.isArray(result.selectedScreenIndices)).toBe(true);
    expect(result.zoom).toBe(100);
  });

  it('should validate data types are correct', () => {
    const project = {
      id: 'test-id',
      name: 'Test Project',
      screensByCanvasSize: {},
      currentCanvasSize: 'iphone-6.5',
      selectedScreenIndices: [0, 'invalid', 1], // Mixed types
      primarySelectedIndex: 'invalid', // Invalid type
      selectedFrameIndex: 'invalid', // Invalid type
      zoom: '150', // String instead of number
      createdAt: 'invalid-date',
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    const result = validateProject(project);
    
    expect(Array.isArray(result.selectedScreenIndices)).toBe(true);
    expect(result.selectedScreenIndices.every(idx => typeof idx === 'number')).toBe(true);
    expect(typeof result.primarySelectedIndex).toBe('number');
    expect(typeof result.zoom).toBe('number');
    expect(result.createdAt instanceof Date).toBe(true);
  });
});
