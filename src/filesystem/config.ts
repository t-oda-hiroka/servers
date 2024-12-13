import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface ClaudeDesktopConfig {
  allowedDirectories?: string[];
  // 他の設定項目も追加可能
}

export class ConfigManager {
  private static readonly CONFIG_FILE = '~/Library/Application Support/Claude/claude_desktop_config.json';

  static async readConfig(): Promise<ClaudeDesktopConfig> {
    try {
      const configPath = this.expandConfigPath();
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // ファイルが存在しない場合やパースエラーの場合はデフォルト設定を返す
      return { allowedDirectories: [] };
    }
  }

  static async writeConfig(config: ClaudeDesktopConfig): Promise<void> {
    const configPath = this.expandConfigPath();
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  private static expandConfigPath(): string {
    const configPath = this.CONFIG_FILE;
    if (configPath.startsWith('~/')) {
      return path.join(os.homedir(), configPath.slice(2));
    }
    return configPath;
  }

  static async updateAllowedDirectories(directories: string[]): Promise<void> {
    const config = await this.readConfig();
    config.allowedDirectories = directories;
    await this.writeConfig(config);
  }

  static async getAllowedDirectories(): Promise<string[]> {
    const config = await this.readConfig();
    return config.allowedDirectories || [];
  }
}
