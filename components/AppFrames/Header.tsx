'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Group, Text, ActionIcon, Box, Tooltip, Menu, Button, Modal, TextInput, Stack, Badge, ThemeIcon } from '@mantine/core';
import { IconDownload, IconChevronDown, IconPlus, IconEdit, IconTrash, IconFolder, IconAlertCircle, IconUser, IconHistory, IconCloud, IconRefresh, IconFileExport, IconFileImport, IconCopy, IconMoodSmile, IconCheck, IconRotate } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useEffect, useRef, Fragment } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { SyncStatus } from '@/lib/ProjectSyncService';
import type { Project } from '@/lib/PersistenceDB';
import { CANVAS_SIZE_OPTIONS } from './panels/layout/LayoutConstants';

interface CanvasSizeOption {
  id: string;
  label: string;
  screenCount: number;
  frameCount: number;
}

interface HeaderProps {
  onDownload?: () => void;
  outputDimensions?: string;
  canvasSizes?: CanvasSizeOption[];
  currentCanvasSize?: string;
  onCanvasSizeSwitch?: (size: string) => void;
  onCopyToCanvasSize?: (targetCanvasSize: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  selectedCount?: number;
  totalCount?: number;
  // Project management
  currentProjectId?: string | null;
  currentProjectName?: string;
  onCreateProject?: (name: string) => Promise<void>;
  onSwitchProject?: (projectId: string) => Promise<void>;
  onRenameProject?: (newName: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onGetAllProjects?: () => Promise<Project[]>;
  // Export/Import
  onExportProject?: () => Promise<void>;
  onImportProject?: (file: File) => Promise<void>;
  isSignedIn?: boolean;
  // Save & sync status
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  syncStatus?: SyncStatus;
  historyOpen?: boolean;
  onToggleHistory?: () => void;
  onDeleteAllScreens?: () => void;
}

function SyncStatusIcon({ saveStatus, syncStatus }: { saveStatus: string; syncStatus: string }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isActive = saveStatus === 'saving' || syncStatus === 'syncing';
  const isSuccess = saveStatus === 'saved' || syncStatus === 'synced';
  const isError = saveStatus === 'error' || syncStatus === 'error';

  useEffect(() => {
    clearTimeout(fadeTimerRef.current);

    if (isActive || isError) {
      setVisible(true);
      setFading(false);
    } else if (isSuccess) {
      setVisible(true);
      setFading(false);
      fadeTimerRef.current = setTimeout(() => {
        setFading(true);
        fadeTimerRef.current = setTimeout(() => setVisible(false), 600);
      }, 1500);
    } else {
      setVisible(false);
      setFading(false);
    }

    return () => clearTimeout(fadeTimerRef.current);
  }, [isActive, isSuccess, isError]);

  if (!visible) return null;

  const color = isError ? 'var(--mantine-color-red-6)' :
    isActive ? 'var(--mantine-color-blue-5)' :
      'var(--mantine-color-green-6)';

  const tooltip = isError ? 'Sync error' :
    saveStatus === 'saving' ? 'Saving...' :
      syncStatus === 'syncing' ? 'Syncing...' :
        'Saved';

  return (
    <Tooltip label={tooltip} openDelay={300}>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
          color,
        }}
      >
        {isError ? (
          <IconAlertCircle size={16} />
        ) : isActive ? (
          <IconRefresh size={16} style={{ animation: 'header-sync-spin 1.2s linear infinite' }} />
        ) : (
          <IconCloud size={16} />
        )}
      </Box>
    </Tooltip>
  );
}

export function Header({
  onDownload,
  outputDimensions,
  canvasSizes = [],
  currentCanvasSize,
  onCanvasSizeSwitch,
  onCopyToCanvasSize,
  zoom = 100,
  onZoomChange,
  selectedCount = 1,
  totalCount = 1,
  currentProjectId,
  currentProjectName = 'My Project',
  onCreateProject,
  onSwitchProject,
  onRenameProject,
  onDeleteProject,
  onGetAllProjects,
  onExportProject,
  onImportProject,
  isSignedIn = false,
  saveStatus = 'idle',
  syncStatus = 'idle',
  historyOpen = false,
  onToggleHistory,
  onDeleteAllScreens,
}: HeaderProps) {
  const {
    tutorialCompleted,
    startTutorial,
    resumeTutorial,
    resetTutorial,
    tutorialActive,
    stopTutorial,
    completeTutorial,
    tutorialStep
  } = useAppStore();

  const canResume = tutorialStep >= 1 && !tutorialCompleted;

  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setHydrated(true);
  }, []);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load projects when menu opens
  const loadProjects = async () => {
    if (onGetAllProjects) {
      const allProjects = await onGetAllProjects();
      setProjects(allProjects);
    }
  };

  // Handle create project
  const handleCreateProject = async () => {
    if (newProjectName.trim() && onCreateProject) {
      await onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectModal(false);
      await loadProjects();
    }
  };

  // Handle rename project
  const handleRenameProject = async () => {
    if (renameValue.trim() && onRenameProject) {
      await onRenameProject(renameValue.trim());
      setRenameValue('');
      setShowRenameModal(false);
      await loadProjects();
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (projectToDelete && onDeleteProject) {
      await onDeleteProject(projectToDelete);
      setProjectToDelete(null);
      setShowDeleteModal(false);
      await loadProjects();
    }
  };

  // Open rename modal with current name
  const openRenameModal = () => {
    setRenameValue(currentProjectName);
    setShowRenameModal(true);
  };

  return (
    <>
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #E5E7EB',
          position: 'relative',
        }}
      >
        <Group gap="sm">
          <Image
            src="/logo.png"
            alt="AppFrames Logo"
            width={180}
            height={50}
            style={{ objectFit: 'contain' }}
            priority
          />

          {/* Project Selector */}
          <Menu shadow="md" width={280} onOpen={loadProjects}>
            <Menu.Target>
              <Button
                variant="subtle"
                size="sm"
                rightSection={<IconChevronDown size={14} />}
                leftSection={<IconFolder size={16} />}
              >
                {currentProjectName}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Projects</Menu.Label>

              {projects.map((project) => {
                const isCurrent = project.id === currentProjectId;
                return (
                  <Menu.Item
                    key={project.id}
                    onClick={() => onSwitchProject?.(project.id)}
                    style={{
                      backgroundColor: isCurrent ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                  >
                    <Group justify="space-between">
                      <Text size="sm">{project.name}</Text>
                      {isCurrent && (
                        <Text size="xs" c="dimmed">(current)</Text>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      Last accessed: {new Date(project.lastAccessedAt).toLocaleDateString()}
                    </Text>
                  </Menu.Item>
                );
              })}

              <Menu.Divider />

              <Menu.Item
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowNewProjectModal(true)}
              >
                New Project
              </Menu.Item>

              <Menu.Item
                leftSection={<IconEdit size={16} />}
                onClick={openRenameModal}
              >
                Rename Current Project
              </Menu.Item>

              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={() => {
                  if (currentProjectId) {
                    setProjectToDelete(currentProjectId);
                    setShowDeleteModal(true);
                  }
                }}
              >
                Delete Current Project
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                leftSection={<IconFileExport size={16} />}
                onClick={async () => {
                  if (!onExportProject) return;
                  notifications.show({ id: 'export', title: 'Exporting project', message: 'Syncing and building archive...', loading: true, autoClose: false });
                  try {
                    await onExportProject();
                    notifications.update({ id: 'export', title: 'Export complete', message: 'Your project file has been downloaded.', loading: false, autoClose: 3000 });
                  } catch (err) {
                    notifications.update({ id: 'export', title: 'Export failed', message: err instanceof Error ? err.message : 'Unknown error', color: 'red', loading: false, autoClose: 5000 });
                  }
                }}
              >
                Export Project
              </Menu.Item>

              <Menu.Item
                leftSection={<IconFileImport size={16} />}
                onClick={() => importInputRef.current?.click()}
              >
                <Text size="sm">Import Project</Text>
                <Text size="xs" c="dimmed">or drag & drop .appframes file</Text>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {outputDimensions && canvasSizes.length > 1 ? (
            <Menu shadow="md" width={320}>
              <Menu.Target>
                <Button
                  variant="subtle"
                  size="xs"
                  color="gray"
                  rightSection={<IconChevronDown size={12} />}
                  styles={{ root: { fontWeight: 400 } }}
                >
                  {outputDimensions}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {[...canvasSizes].sort((a, b) => b.frameCount - a.frameCount).map((cs) => (
                  <Menu.Item
                    key={cs.id}
                    onClick={() => onCanvasSizeSwitch?.(cs.id)}
                    style={{
                      backgroundColor: cs.id === currentCanvasSize ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm" truncate>{cs.label}</Text>
                      <Badge size="xs" variant="light" color={cs.frameCount > 0 ? 'blue' : 'gray'} style={{ flexShrink: 0 }}>
                        {cs.screenCount} screen{cs.screenCount !== 1 ? 's' : ''}
                      </Badge>
                    </Group>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : outputDimensions ? (
            <Text size="xs" c="dimmed">
              {outputDimensions}
            </Text>
          ) : null}

          {onCopyToCanvasSize && totalCount > 0 && (
            <Menu shadow="md" width={300} position="bottom-start">
              <Menu.Target>
                <Tooltip label="Copy all screens to another size" position="bottom" withArrow>
                  <ActionIcon variant="subtle" size="sm" color="gray">
                    <IconCopy size={14} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown style={{ maxHeight: 400, overflowY: 'auto' }}>
                <Menu.Label>Copy all screens to...</Menu.Label>
                {CANVAS_SIZE_OPTIONS.map((group) => {
                  const items = group.items.filter((item) => item.value !== currentCanvasSize);
                  if (items.length === 0) return null;
                  return (
                    <Fragment key={group.group}>
                      <Menu.Label c="dimmed" fz={10}>{group.group}</Menu.Label>
                      {items.map((item) => (
                        <Menu.Item
                          key={item.value}
                          onClick={() => onCopyToCanvasSize(item.value)}
                        >
                          <Text size="sm">{item.label}</Text>
                        </Menu.Item>
                      ))}
                    </Fragment>
                  );
                })}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        <Group gap={4} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => onZoomChange?.(Math.max(25, zoom - 25))}>
            <Text size="xs" fw={600}>-</Text>
          </ActionIcon>
          <Menu shadow="sm" width={100} position="bottom">
            <Menu.Target>
              <Button variant="subtle" size="compact-xs" color="gray" styles={{ root: { fontWeight: 400, padding: '2px 6px' } }}>
                {zoom}%
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {[25, 50, 75, 100, 125, 150, 200].map((v) => (
                <Menu.Item key={v} onClick={() => onZoomChange?.(v)} style={{ backgroundColor: v === zoom ? 'var(--mantine-color-blue-0)' : undefined }}>
                  <Text size="sm" ta="center">{v}%</Text>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => onZoomChange?.(Math.min(200, zoom + 25))}>
            <Text size="xs" fw={600}>+</Text>
          </ActionIcon>
        </Group>

        <Group gap="xs">
          {/* Tour Indicator - Only show if not completed and after hydration */}
          {hydrated && !tutorialCompleted && (
            <Group gap={8} mr="md">
              {!tutorialActive ? (
                <Tooltip label={canResume ? `Resume Quick Tour (Step ${tutorialStep})` : "Take a Quick Tour"} position="bottom" withArrow>
                  <Button
                    variant="filled"
                    size="sm"
                    radius="xl"
                    leftSection={<IconMoodSmile size={18} />}
                    onClick={canResume ? resumeTutorial : startTutorial}
                    styles={{
                      root: {
                        background: 'linear-gradient(90deg, #2563EB 0%, #9333EA 100%)',
                        border: 0,
                        padding: '0 20px',
                        height: 38,
                        '&:hover': {
                          opacity: 0.9,
                        },
                      },
                      label: {
                        fontWeight: 600,
                      }
                    }}
                  >
                    <Box component="span" visibleFrom="md">{canResume ? 'Resume Quick Tour' : 'Take a Quick Tour'}</Box>
                    <Box component="span" visibleFrom="sm" hiddenFrom="md">{canResume ? 'Resume' : 'Tour'}</Box>
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  variant="filled"
                  color="red"
                  size="sm"
                  radius="xl"
                  onClick={stopTutorial}
                  styles={{
                    root: { height: 38 }
                  }}
                >
                  Stop Tour
                </Button>
              )}

              <Tooltip label="Reset Tour Progress" position="bottom" withArrow>
                <ActionIcon
                  variant="filled"
                  size={38}
                  radius="xl"
                  onClick={resetTutorial}
                  styles={{
                    root: {
                      backgroundColor: '#374151',
                      border: 0,
                      '&:hover': {
                        backgroundColor: '#1F2937',
                      },
                    }
                  }}
                >
                  <IconRotate size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          {/* Save & Sync Status Icon */}
          <SyncStatusIcon saveStatus={saveStatus} syncStatus={syncStatus} />

          <Tooltip label={`Download${selectedCount > 1 ? ` (${selectedCount} screens)` : ''} • For full export, use Preview`}>
            <ActionIcon
              size="lg"
              variant="light"
              onClick={onDownload}
              aria-label="Download"
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={historyOpen ? 'Hide history' : 'Show history'}>
            <ActionIcon
              size="lg"
              variant={historyOpen ? 'filled' : 'light'}
              color={historyOpen ? 'violet' : undefined}
              onClick={onToggleHistory}
              aria-label="History"
            >
              <IconHistory size={18} />
            </ActionIcon>
          </Tooltip>
          {onDeleteAllScreens && totalCount > 0 && (
            <Tooltip label="Delete all screens (Clear workspace)">
              <ActionIcon
                size="lg"
                variant="light"
                color="red"
                onClick={() => setShowDeleteAllModal(true)}
                aria-label="Delete all screens"
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Account & integrations (optional)">
            <ActionIcon
              size="lg"
              variant="light"
              component={Link}
              href="/integrations"
              aria-label="Integrations"
            >
              <IconUser size={18} />
            </ActionIcon>
          </Tooltip>
          <Button
            component={Link}
            href="/preview"
            size="sm"
            variant="light"
          >
            Go to Preview
          </Button>
        </Group>
      </Box>

      {/* New Project Modal */}
      <Modal
        opened={showNewProjectModal}
        onClose={() => {
          setShowNewProjectModal(false);
          setNewProjectName('');
        }}
        title="Create New Project"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Project Name"
            placeholder="My Awesome App"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              }
            }}
            data-autofocus
          />
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setShowNewProjectModal(false);
                setNewProjectName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rename Project Modal */}
      <Modal
        opened={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameValue('');
        }}
        title="Rename Project"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="New Project Name"
            placeholder="My Awesome App"
            value={renameValue}
            onChange={(e) => setRenameValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameProject();
              }
            }}
            data-autofocus
          />
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setShowRenameModal(false);
                setRenameValue('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameProject}
              disabled={!renameValue.trim()}
            >
              Rename
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".appframes,.zip"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !onImportProject) return;
          e.target.value = ''; // Reset for re-import
          notifications.show({ id: 'import', title: 'Importing project', message: 'Uploading and processing...', loading: true, autoClose: false });
          try {
            await onImportProject(file);
            notifications.update({ id: 'import', title: 'Import complete', message: 'Project imported successfully.', loading: false, autoClose: 3000 });
          } catch (err) {
            notifications.update({ id: 'import', title: 'Import failed', message: err instanceof Error ? err.message : 'Unknown error', color: 'red', loading: false, autoClose: 5000 });
          }
        }}
      />

      {/* Delete Project Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        title="Delete Project"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{currentProjectName}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            This will permanently delete all screens in this project. Your media library will be preserved.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setShowDeleteModal(false);
                setProjectToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteProject}
            >
              Delete Project
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete All Screens Confirmation Modal */}
      <Modal
        opened={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="Clear Workspace"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>all {totalCount} screens</strong> for {outputDimensions}?
          </Text>
          <Text size="sm" c="dimmed">
            This will permanently remove all screens from this canvas size. This action can be undone with Cmd+Z.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => setShowDeleteAllModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                onDeleteAllScreens?.();
                setShowDeleteAllModal(false);
              }}
            >
              Delete All Screens
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
