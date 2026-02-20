import React from 'react';
import { useLayout } from '../context/LayoutContext';

interface LayoutSkeletonProps {
    /** Whether to show the sidebar skeleton (default: true) */
    showSidebar?: boolean;
    /** Whether to show the header skeleton (default: true) */
    showHeader?: boolean;
    /** Whether to show the footer skeleton (default: false) */
    showFooter?: boolean;
    /** Custom class name */
    className?: string;
}

/**
 * LayoutSkeleton component
 * 
 * Provides a "Ghost" version of the entire AppShell structure to prevent layout shifts.
 */
export const LayoutSkeleton: React.FC<LayoutSkeletonProps> = ({
    showSidebar = true,
    showHeader = true,
    showFooter = false,
    className,
}) => {
    const { preset, config } = useLayout();

    if (!preset) return null;

    const { Box, Skeleton, AppShell, Header, Footer } = preset;

    // Build the shell-like structure using skeleton primitives
    const shell = AppShell ? (
        <AppShell
            header={showHeader ? <Header><Skeleton width={200} height={20} /></Header> : undefined}
            navbar={showSidebar ? (
                <Box style={{ width: config.collapsedNavWidth ?? 80, height: '100%', padding: 12, borderRight: '1px solid #eee' }}>
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} width={40} height={40} radius={8} />
                        ))}
                    </Box>
                </Box>
            ) : undefined}
            footer={showFooter ? <Footer><Skeleton width={150} height={16} /></Footer> : undefined}
            padding="md"
        >
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 20 }}>
                <Skeleton width="40%" height={32} />
                <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} width="100%" height={200} radius={12} />
                    ))}
                </Box>
            </Box>
        </AppShell>
    ) : (
        // Fallback if AppShell is not in preset
        <Box className={className} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {showHeader && (
                <Box style={{ height: 45, padding: '0 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                    <Skeleton width={200} height={20} />
                </Box>
            )}
            <Box style={{ display: 'flex', flex: 1 }}>
                {showSidebar && (
                    <Box style={{ width: 80, padding: 12, borderRight: '1px solid #eee' }}>
                        <Box style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} width={40} height={40} radius={8} />
                            ))}
                        </Box>
                    </Box>
                )}
                <Box style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Skeleton width="30%" height={32} />
                    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Skeleton key={i} width="100%" height={160} radius={8} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return shell;
};
