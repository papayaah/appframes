'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Group, Text, ActionIcon, Box, Slider, Tooltip, Menu, Button, Modal, TextInput, Stack, Badge } from '@mantine/core';
import { IconDownload, IconChevronDown, IconPlus, IconEdit, IconTrash, IconFolder, IconAlertCircle, IconUser, IconHistory, IconCloud, IconRefresh } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import type { SyncStatus } from '@/lib/ProjectSyncService';
import type { Project } from '@/lib/PersistenceDB';

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
  // Save & sync status
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  syncStatus?: SyncStatus;
  historyOpen?: boolean;
  onToggleHistory?: () => void;
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
  saveStatus = 'idle',
  syncStatus = 'idle',
  historyOpen = false,
  onToggleHistory,
}: HeaderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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
        </Group>

      <Group gap="md" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Text size="xs" c="dimmed" style={{ minWidth: 40 }}>
          Zoom
        </Text>
        <Slider
          value={zoom}
          onChange={(value) => onZoomChange?.(value)}
          min={25}
          max={200}
          label={(value) => `${value}%`}
          style={{ width: 200 }}
          size="sm"
        />
        <Text size="xs" c="dimmed" style={{ minWidth: 45 }}>
          {zoom}%
        </Text>
      </Group>

        <Group gap="xs">
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
    </>
  );
}
