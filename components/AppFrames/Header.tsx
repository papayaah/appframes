'use client';

import Image from 'next/image';
import { Group, Text, ActionIcon, Box, Slider, Tooltip, Menu, Button, Modal, TextInput, Stack } from '@mantine/core';
import { IconDownload, IconFileZip, IconChevronDown, IconPlus, IconEdit, IconTrash, IconFolder } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import type { Project } from '@/lib/PersistenceDB';

interface HeaderProps {
  onDownload?: () => void; // Download currently visible screens individually
  onExport?: () => void; // Export all screens (zip if multiple)
  outputDimensions?: string; // Display dimensions (e.g., "1242 × 2688px")
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  selectedCount?: number; // Number of currently visible/selected screens
  totalCount?: number; // Total number of screens in panel
  // Project management
  currentProjectName?: string;
  onCreateProject?: (name: string) => Promise<void>;
  onSwitchProject?: (projectId: string) => Promise<void>;
  onRenameProject?: (newName: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onGetAllProjects?: () => Promise<Project[]>;
}

export function Header({
  onDownload,
  onExport,
  outputDimensions,
  zoom = 100,
  onZoomChange,
  selectedCount = 1,
  totalCount = 1,
  currentProjectName = 'My Project',
  onCreateProject,
  onSwitchProject,
  onRenameProject,
  onDeleteProject,
  onGetAllProjects,
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
              
              {projects.map((project) => (
                <Menu.Item
                  key={project.id}
                  onClick={() => onSwitchProject?.(project.id)}
                  style={{
                    backgroundColor: project.name === currentProjectName ? 'var(--mantine-color-blue-0)' : undefined,
                  }}
                >
                  <Group justify="space-between">
                    <Text size="sm">{project.name}</Text>
                    {project.name === currentProjectName && (
                      <Text size="xs" c="dimmed">(current)</Text>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    Last accessed: {new Date(project.lastAccessedAt).toLocaleDateString()}
                  </Text>
                </Menu.Item>
              ))}

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
                  const currentProject = projects.find(p => p.name === currentProjectName);
                  if (currentProject) {
                    setProjectToDelete(currentProject.id);
                    setShowDeleteModal(true);
                  }
                }}
              >
                Delete Current Project
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {outputDimensions && (
            <Text size="xs" c="dimmed">
              {outputDimensions}
            </Text>
          )}
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
          <Tooltip label={`Download${selectedCount > 1 ? ` (${selectedCount} screens)` : ''}`}>
            <ActionIcon
              size="lg"
              variant="light"
              onClick={onDownload}
              aria-label="Download"
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`Export${totalCount > 1 ? ` All (${totalCount} screens)` : ''}`}>
            <ActionIcon
              size="lg"
              onClick={onExport}
              aria-label="Export"
            >
              <IconFileZip size={18} />
            </ActionIcon>
          </Tooltip>
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
