import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// Configuration file schema
export const ClaudeConfigSchema = z.object({
  // Add any specific configuration fields you need
  allowedDirectories: z.array(z.string()).optional(),
  // Add more fields as needed
});

export type ClaudeConfig = z.infer<typeof ClaudeConfigSchema>;

// Helper function to get the config file path
export function getConfigFilePath(): string {
  const configDir = path.join(os.homedir(), 'Library/Application Support/Claude');
  return path.join(configDir, 'claude_desktop_config.json');
}

// Load configuration
export async function loadConfig(): Promise<ClaudeConfig> {
  try {
    const configPath = getConfigFilePath();
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return ClaudeConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
    throw error;
  }
}

// Save configuration
export async function saveConfig(config: ClaudeConfig): Promise<void> {
  try {
    const configPath = getConfigFilePath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
    throw error;
  }
}

// Initialize configuration directory if needed
export async function initializeConfigDir(): Promise<void> {
  try {
    const configDir = path.dirname(getConfigFilePath());
    await fs.mkdir(configDir, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to initialize config directory: ${error.message}`);
    }
    throw error;
  }
}