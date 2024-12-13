import fs from 'fs/promises';
import path from 'path';

export interface ClaudeDesktopConfig {
  allowedDirectories?: string[];
}

export class ConfigManager {
  private static readonly CONFIG_FILE = '/Users/hoda/Library/Application Support/Claude/claude_desktop_config.json';

  static async readConfig(): Promise<ClaudeDesktopConfig> {
    try {
      const content = await fs.readFile(this.CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return { allowedDirectories: [] };
    }
  }

  static async writeConfig(config: ClaudeDesktopConfig): Promise<void> {
    await fs.mkdir(path.dirname(this.CONFIG_FILE), { recursive: true });
    await fs.writeFile(this.CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  }

  static async updateAllowedDirectories(directories: string[]): Promise<void> {
    const config = await this.readConfig();
    config.allowedDirectories = directories.map(dir => path.resolve(dir));
    await this.writeConfig(config);
  }

  static async getAllowedDirectories(): Promise<string[]> {
    const config = await this.readConfig();
    return config.allowedDirectories || [];
  }
}
