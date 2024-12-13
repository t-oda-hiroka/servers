#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ConfigManager } from "./config.js";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-server-filesystem <allowed-directory> [additional-directories...]");
  process.exit(1);
}

// Store allowed directories in normalized form
const allowedDirectories = args.map(dir =>
  path.resolve(dir)
);

// Validate that all directories exist and are accessible
await Promise.all(args.map(async (dir) => {
  try {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) {
      console.error(`Error: ${dir} is not a directory`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    process.exit(1);
  }
}));

// Update config with allowed directories
await ConfigManager.updateAllowedDirectories(allowedDirectories);

// Security utilities
async function validatePath(requestedPath: string): Promise<string> {
  const absolute = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(process.cwd(), requestedPath);

  const normalizedRequested = path.resolve(absolute);

  // Get updated allowed directories from config
  const configDirs = await ConfigManager.getAllowedDirectories();
  const allAllowedDirs = [...new Set([...allowedDirectories, ...configDirs])];

  // Check if path is within allowed directories
  const isAllowed = allAllowedDirs.some(dir => normalizedRequested.startsWith(dir));
  if (!isAllowed) {
    throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allAllowedDirs.join(', ')}`);
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = path.resolve(realPath);
    const isRealPathAllowed = allAllowedDirs.some(dir => normalizedReal.startsWith(dir));
    if (!isRealPathAllowed) {
      throw new Error("Access denied - symlink target outside allowed directories");
    }
    return realPath;
  } catch (error) {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = path.resolve(realParentPath);
      const isParentAllowed = allAllowedDirs.some(dir => normalizedParent.startsWith(dir));
      if (!isParentAllowed) {
        throw new Error("Access denied - parent directory outside allowed directories");
      }
      return absolute;
    } catch {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }
  }
}

// ... [以下、既存のコードはそのまま] ...
