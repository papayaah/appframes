'use client';

import { Box, Text, Stack, Title, Accordion, ThemeIcon, Group, List, Mark, Code, Button, Divider, Paper } from '@mantine/core';
import {
    IconRocket,
    IconDragDrop,
    IconMaximize,
    IconTypography,
    IconDeviceFloppy,
    IconClick,
    IconSchool,
    IconRefresh
} from '@tabler/icons-react';
import { useAppStore } from '@/stores/useAppStore';

export function HelpTab() {
    const { startTutorial, resumeTutorial, resetTutorial, tutorialStep, tutorialCompleted } = useAppStore();
    const canResume = tutorialStep >= 1 && !tutorialCompleted;
    console.log('HelpTab canResume check:', { tutorialStep, tutorialCompleted, canResume });

    return (
        <Box style={{ height: '100%', overflow: 'auto' }} className="scroll-on-hover" p="md">
            <Title order={4} mb="lg">Documentation & Tips</Title>

            {/* Quick Tour Section */}
            <Paper withBorder p="md" radius="md" mb="xl" style={{ backgroundColor: '#f8f9ff', borderColor: '#e0e7ff' }}>
                <Stack gap="xs">
                    <Group gap="xs">
                        <ThemeIcon color="violet" variant="light"><IconSchool size={16} /></ThemeIcon>
                        <Text fw={700}>Interactive Tour</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                        New to AppFrames? Let us show you the core features with a step-by-step guided tour.
                    </Text>
                    <Group mt="xs">
                        {canResume ? (
                            <Button size="xs" color="violet" onClick={resumeTutorial} leftSection={<IconRocket size={14} />}>
                                Resume Tour (Step {tutorialStep})
                            </Button>
                        ) : (
                            <Button size="xs" color="violet" onClick={startTutorial} leftSection={<IconRocket size={14} />}>
                                Start Quick Tour
                            </Button>
                        )}
                        <Button size="xs" variant="subtle" color="gray" onClick={resetTutorial} leftSection={<IconRefresh size={14} />}>
                            Reset
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            <Accordion variant="separated" defaultValue="basics">
                <Accordion.Item value="basics">
                    <Accordion.Control icon={<ThemeIcon color="blue" variant="light"><IconRocket size={16} /></ThemeIcon>}>
                        Getting Started
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                AppFrames helps you create beautiful device mockups for the App Store and marketing.
                            </Text>
                            <List size="sm" spacing="xs">
                                <List.Item>
                                    <b>Import:</b> Drag a <Code>.appframes</Code> file anywhere to resume a project.
                                </List.Item>
                                <List.Item>
                                    <b>Screens:</b> Add multiple screens using the "Layout" tab to manage different device sizes.
                                </List.Item>
                            </List>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="background">
                    <Accordion.Control icon={<ThemeIcon color="orange" variant="light"><IconDragDrop size={16} /></ThemeIcon>}>
                        Background Magic
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                Repositioning your background image is now easier than ever:
                            </Text>
                            <Box bg="gray.0" p="xs" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-gray-2)' }}>
                                <Group gap="xs">
                                    <Mark color="orange">Space + Drag</Mark>
                                    <Text size="xs" c="dimmed">Hold your spacebar and click-drag the canvas to move the background photo.</Text>
                                </Group>
                            </Box>
                            <Text size="sm">
                                You can also adjust <b>Rotation</b> and <b>Scale</b> in the Settings panel when the canvas is selected.
                            </Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="export">
                    <Accordion.Control icon={<ThemeIcon color="green" variant="light"><IconMaximize size={16} /></ThemeIcon>}>
                        Exporting High-Res
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                Exports are optimized for large displays like the <Code>iPad 13 Pro</Code>.
                            </Text>
                            <List size="sm" spacing="xs">
                                <List.Item><b>Ultra-High Resolution:</b> Captures at full pixel density for crisp results.</List.Item>
                                <List.Item><b>Transparency:</b> Use PNG format to keep backgrounds transparent.</List.Item>
                                <List.Item><b>App Store Safe:</b> Use JPG if the App Store rejects files with alpha channels.</List.Item>
                            </List>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="fonts">
                    <Accordion.Control icon={<ThemeIcon color="violet" variant="light"><IconTypography size={16} /></ThemeIcon>}>
                        Custom Typography
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Text size="sm">
                                We've integrated high-quality local fonts for faster loading:
                            </Text>
                            <List size="sm" spacing="xs" withPadding>
                                <List.Item><Text fw={600} style={{ fontFamily: 'Glacial Indifference' }}>Glacial Indifference</Text></List.Item>
                                <List.Item><Text fw={600} style={{ fontFamily: 'Jimmy Script' }}>Jimmy Script</Text></List.Item>
                                <List.Item><Text fw={600} style={{ fontFamily: 'EB Garamond' }}>EB Garamond</Text></List.Item>
                            </List>
                            <Text size="xs" c="dimmed italic">
                                Note: These fonts are served in WOFF2 format for maximum performance.
                            </Text>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="shortcuts">
                    <Accordion.Control icon={<ThemeIcon color="gray" variant="light"><IconClick size={16} /></ThemeIcon>}>
                        Keyboard Shortcuts
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="sm">Delete/Backspace</Text>
                                <Code>Remove element</Code>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Cmd + C / V</Text>
                                <Code>Copy/Paste Text</Code>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Cmd + Z / Shift + Z</Text>
                                <Code>Undo / Redo</Code>
                            </Group>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <Box mt="xl" p="md" bg="blue.0" style={{ borderRadius: 12 }}>
                <Title order={5} mb="xs" c="blue.9">Pro Tip</Title>
                <Text size="sm" c="blue.8">
                    Dragging an image directly onto a device frame will automatically fill it.
                    Dragging a <b>.appframes</b> file will import your entire project!
                </Text>
            </Box>
        </Box>
    );
}
