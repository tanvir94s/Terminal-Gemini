import { CommandDefinition } from '../types';

export const COMMANDS: CommandDefinition[] = [
  {
    command: 'help',
    alias: '?',
    args: '[cmd]',
    description: 'Show available terminal commands and keyboard shortcuts',
    category: 'core',
  },
  {
    command: 'clear',
    alias: 'cls',
    description: 'Clear the current terminal viewport',
    category: 'core',
  },
  {
    command: 'new',
    alias: 'reset',
    description: 'Start a new conversation session with Gemini',
    category: 'session',
  },
  {
    command: 'sessions',
    alias: 'history',
    description: 'Open the session drawer to manage past conversations',
    category: 'session',
  },
  {
    command: 'model',
    args: '[gemini-3.8-flash | gemini-3.1-flash-lite]',
    description: 'Display or switch the active Gemini model',
    category: 'config',
  },
  {
    command: 'system',
    args: '[instruction...]',
    description: 'View or set the system instruction for Gemini',
    category: 'config',
  },
  {
    command: 'temp',
    args: '[0.0 - 2.0]',
    description: 'Set temperature for model creativity/randomness',
    category: 'config',
  },
  {
    command: 'theme',
    args: '[gemini-dark | matrix | amber-crt | cyberpunk | monokai | sol]',
    description: 'Cycle or set the terminal color palette',
    category: 'config',
  },
  {
    command: 'scanlines',
    description: 'Toggle retro CRT scanlines and screen curvature effect',
    category: 'config',
  },
  {
    command: 'sound',
    description: 'Toggle mechanical keyboard typing and command audio',
    category: 'config',
  },
  {
    command: 'export',
    args: '[md | txt | json]',
    description: 'Export current conversation transcript to file',
    category: 'misc',
  },
  {
    command: 'info',
    description: 'Display terminal system specs, session stats, and latency',
    category: 'misc',
  },
  {
    command: 'attach',
    description: 'Attach an image or document for Gemini to analyze',
    category: 'core',
  },
];
