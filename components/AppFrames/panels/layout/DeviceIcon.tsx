
import { Box } from '@mantine/core';

export function DeviceIcon({ deviceId, size = 40 }: { deviceId: string; size?: number }) {
    const s = size;
    const strokeWidth = 2;
    const color = 'currentColor';

    // iPhone - tall rectangle with notch indicator
    if (deviceId === 'iphone') {
        return (
            <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.12,
                    }}
                />
                <Box
                    style={{
                        position: 'absolute',
                        bottom: s * 0.06,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: s * 0.15,
                        height: s * 0.03,
                        backgroundColor: color,
                        borderRadius: 2,
                    }}
                />
            </Box>
        );
    }

    // iPad - wider rectangle with home button
    if (deviceId === 'ipad') {
        return (
            <Box style={{ width: s * 0.7, height: s * 0.9, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.08,
                    }}
                />
                <Box
                    style={{
                        position: 'absolute',
                        bottom: s * 0.05,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: s * 0.1,
                        height: s * 0.1,
                        border: `1.5px solid ${color}`,
                        borderRadius: '50%',
                    }}
                />
            </Box>
        );
    }

    // Watch - small rectangle with bands
    if (deviceId === 'watch') {
        return (
            <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
                {/* Top band */}
                <Box
                    style={{
                        width: s * 0.3,
                        height: s * 0.15,
                        backgroundColor: color,
                        opacity: 0.4,
                        borderRadius: '3px 3px 0 0',
                        margin: '0 auto',
                    }}
                />
                {/* Watch face */}
                <Box
                    style={{
                        width: s * 0.45,
                        height: s * 0.5,
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.1,
                        margin: '0 auto',
                    }}
                />
                {/* Bottom band */}
                <Box
                    style={{
                        width: s * 0.3,
                        height: s * 0.15,
                        backgroundColor: color,
                        opacity: 0.4,
                        borderRadius: '0 0 3px 3px',
                        margin: '0 auto',
                    }}
                />
            </Box>
        );
    }

    // Phone (Android) - rectangle with camera dot at top
    if (deviceId === 'phone') {
        return (
            <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.08,
                    }}
                />
                <Box
                    style={{
                        position: 'absolute',
                        top: s * 0.06,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: s * 0.06,
                        height: s * 0.06,
                        backgroundColor: color,
                        borderRadius: '50%',
                    }}
                />
            </Box>
        );
    }

    // Tablet (7" / 10") - landscape-oriented rectangle
    if (deviceId === 'tablet-7' || deviceId === 'tablet-10') {
        return (
            <Box style={{ width: s * 0.85, height: s * 0.6, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.06,
                    }}
                />
            </Box>
        );
    }

    // Chromebook - laptop shape
    if (deviceId === 'chromebook') {
        return (
            <Box style={{ width: s * 0.9, height: s * 0.7, position: 'relative' }}>
                {/* Screen */}
                <Box
                    style={{
                        width: '100%',
                        height: '70%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: `${s * 0.04}px ${s * 0.04}px 0 0`,
                    }}
                />
                {/* Keyboard base */}
                <Box
                    style={{
                        width: '110%',
                        height: '20%',
                        marginLeft: '-5%',
                        backgroundColor: color,
                        opacity: 0.3,
                        borderRadius: `0 0 ${s * 0.04}px ${s * 0.04}px`,
                    }}
                />
            </Box>
        );
    }

    // XR - VR headset shape
    if (deviceId === 'xr') {
        return (
            <Box style={{ width: s * 0.9, height: s * 0.5, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.15,
                    }}
                />
                {/* Left lens */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '25%',
                        transform: 'translate(-50%, -50%)',
                        width: s * 0.2,
                        height: s * 0.2,
                        border: `1.5px solid ${color}`,
                        borderRadius: '50%',
                    }}
                />
                {/* Right lens */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '75%',
                        transform: 'translate(-50%, -50%)',
                        width: s * 0.2,
                        height: s * 0.2,
                        border: `1.5px solid ${color}`,
                        borderRadius: '50%',
                    }}
                />
            </Box>
        );
    }

    // Feature graphic - landscape rectangle with play icon
    if (deviceId === 'feature') {
        return (
            <Box style={{ width: s * 0.9, height: s * 0.45, position: 'relative' }}>
                <Box
                    style={{
                        width: '100%',
                        height: '100%',
                        border: `${strokeWidth}px solid ${color}`,
                        borderRadius: s * 0.04,
                    }}
                />
                {/* Play triangle */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-40%, -50%)',
                        width: 0,
                        height: 0,
                        borderTop: `${s * 0.1}px solid transparent`,
                        borderBottom: `${s * 0.1}px solid transparent`,
                        borderLeft: `${s * 0.15}px solid ${color}`,
                    }}
                />
            </Box>
        );
    }

    // Default fallback
    return (
        <Box
            style={{
                width: s * 0.5,
                height: s * 0.9,
                border: `${strokeWidth}px solid ${color}`,
                borderRadius: s * 0.08,
            }}
        />
    );
}
