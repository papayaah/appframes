
import { useCallback } from 'react';
import { Project } from '@/lib/PersistenceDB';
import {
    collectClientMediaIds,
    stripProjectForClientExport,
    rewriteMediaRefsToIds,
    sanitizeFilename
} from '@/lib/projectArchive';
import { notifications } from '@mantine/notifications';

export function useProjectExport() {

    const exportProject = useCallback(async (project: Project) => {
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            // 1. Collect media
            const mediaIds = collectClientMediaIds(project as unknown as Record<string, unknown>);

            // 2. Prepare manifest
            const manifest = {
                formatVersion: 1,
                appVersion: '1.0.0',
                exportedAt: new Date().toISOString(),
                projectName: project.name,
                mediaFiles: [] as Array<{ mediaRef: string; originalPath: string }>,
            };

            // 3. Add media files
            const mediaFolder = zip.folder('media');
            const mediaIdToRef = new Map<number, string>();

            if (mediaIds.size > 0 && mediaFolder) {
                const { initDB } = await import('@reactkits.dev/react-media-library');
                const db = await initDB();

                for (const id of Array.from(mediaIds)) {
                    const asset = await db.get('assets', id);
                    if (asset && (asset as any).file) {
                        const file = (asset as any).file as File;
                        // Create a safe filename usually derived from original filename or id
                        // asset.file is a File/Blob stored in IDB
                        const originalName = file.name || `media-${id}`;
                        const ext = originalName.split('.').pop() || 'bin';
                        const safeName = `${id}-${sanitizeFilename(originalName)}`;

                        mediaFolder.file(safeName, file);
                        mediaIdToRef.set(id, safeName);
                        manifest.mediaFiles.push({ mediaRef: safeName, originalPath: (asset as any).path || '' });
                    }
                }
            }

            // 4. Transform project data
            const cleanProject = stripProjectForClientExport(project as unknown as Record<string, unknown>, mediaIdToRef);

            // 5. Add JSON files
            zip.file('manifest.json', JSON.stringify(manifest, null, 2));
            zip.file('project.json', JSON.stringify(cleanProject, null, 2));

            // 6. Generate and download
            const content = await zip.generateAsync({ type: 'blob' });
            const filename = `${sanitizeFilename(project.name)}.appframes`;

            // Download
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            notifications.show({
                title: 'Project Exported',
                message: 'Your project has been successfully exported.',
                color: 'green',
            });

        } catch (error) {
            console.error('Export failed:', error);
            notifications.show({
                title: 'Export Failed',
                message: 'There was an error exporting your project.',
                color: 'red',
            });
        }
    }, []);

    const importProject = useCallback(async (file: File): Promise<Project | null> => {
        try {
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(file);

            // 1. Read manifest
            const manifestFile = zip.file('manifest.json');
            if (!manifestFile) throw new Error('Invalid archive: missing manifest.json');
            const manifestStr = await manifestFile.async('string');
            const manifest = JSON.parse(manifestStr);

            // 2. Read project data
            const projectFile = zip.file('project.json');
            if (!projectFile) throw new Error('Invalid archive: missing project.json');
            const projectStr = await projectFile.async('string');
            const projectData = JSON.parse(projectStr);

            // 3. Import media
            const mediaRefToId = new Map<string, number>();
            const mediaFolder = zip.folder('media');

            if (mediaFolder) {
                const { initDB } = await import('@reactkits.dev/react-media-library');
                const db = await initDB();

                const mediaPromises = manifest.mediaFiles.map(async (entry: any) => {
                    const fileData = await mediaFolder.file(entry.mediaRef)?.async('blob');
                    if (fileData) {
                        const restoredFile = new File([fileData], entry.mediaRef, { type: fileData.type });

                        // We use put to get an ID.
                        // We need to match MediaAsset interface
                        const newAsset: any = {
                            file: restoredFile,
                            createdAt: new Date(),
                            path: entry.originalPath,
                            tags: ['imported'],
                            handleName: entry.mediaRef,
                            fileName: entry.mediaRef,
                            fileType: fileData.type,
                            mimeType: fileData.type,
                            size: fileData.size,
                            width: 0, // Unknown without reading
                            height: 0, // Unknown without reading
                        };

                        const id = await db.put('assets', newAsset);
                        mediaRefToId.set(entry.mediaRef, Number(id));
                    }
                });

                await Promise.all(mediaPromises);
            }

            // 4. Rewrite project data
            const importedProject = rewriteMediaRefsToIds(projectData, mediaRefToId);

            // 5. Return project structure
            // We need to ensure it matches Project interface (with ID, etc)
            // The imported project might not have ID or we want to generate new one?
            // Usually we import as a NEW project.

            const newProject: Project = {
                ...importedProject as any,
                id: crypto.randomUUID(), // New ID
                name: `${manifest.projectName} (Imported)`,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastAccessedAt: new Date(),
                pristine: false,
            };

            notifications.show({
                title: 'Project Imported',
                message: 'Project imported successfully.',
                color: 'green',
            });

            return newProject;

        } catch (error) {
            console.error('Import failed:', error);
            notifications.show({
                title: 'Import Failed',
                message: 'There was an error importing your project.',
                color: 'red',
            });
            return null;
        }
    }, []);

    return { exportProject, importProject };
}
