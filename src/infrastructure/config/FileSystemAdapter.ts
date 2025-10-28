import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InfrastructureError } from '@shared/types';

export interface FileSystemPort {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  readJSON<T>(filePath: string): Promise<T>;
  writeJSON<T>(filePath: string, data: T): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  createDirectory(dirPath: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(dirPath: string): Promise<string[]>;
  getFileStats(filePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    isDirectory: boolean;
  }>;
}

@injectable()
export class FileSystemAdapter implements FileSystemPort {
  
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new InfrastructureError(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await this.createDirectory(dir);
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new InfrastructureError(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
  }

  async readJSON<T>(filePath: string): Promise<T> {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content) as T;
    } catch (error) {
      throw new InfrastructureError(`Failed to read JSON file ${filePath}: ${(error as Error).message}`);
    }
  }

  async writeJSON<T>(filePath: string, data: T): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await this.writeFile(filePath, content);
    } catch (error) {
      throw new InfrastructureError(`Failed to write JSON file ${filePath}: ${(error as Error).message}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new InfrastructureError(`Failed to create directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new InfrastructureError(`Failed to delete file ${filePath}: ${(error as Error).message}`);
      }
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      throw new InfrastructureError(`Failed to list files in directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  async getFileStats(filePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    isDirectory: boolean;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      throw new InfrastructureError(`Failed to get file stats for ${filePath}: ${(error as Error).message}`);
    }
  }

  // Additional utility methods
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      await this.createDirectory(destDir);
      
      await fs.copyFile(sourcePath, destinationPath);
    } catch (error) {
      throw new InfrastructureError(`Failed to copy file from ${sourcePath} to ${destinationPath}: ${(error as Error).message}`);
    }
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      await this.createDirectory(destDir);
      
      await fs.rename(sourcePath, destinationPath);
    } catch (error) {
      throw new InfrastructureError(`Failed to move file from ${sourcePath} to ${destinationPath}: ${(error as Error).message}`);
    }
  }

  async createBackup(filePath: string, backupSuffix: string = '.backup'): Promise<string> {
    try {
      const backupPath = filePath + backupSuffix;
      await this.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new InfrastructureError(`Failed to create backup of ${filePath}: ${(error as Error).message}`);
    }
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const exists = await this.exists(dirPath);
    if (!exists) {
      await this.createDirectory(dirPath);
    }
  }

  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      throw new InfrastructureError(`Failed to calculate directory size for ${dirPath}: ${(error as Error).message}`);
    }
  }

  async cleanupOldFiles(dirPath: string, maxAgeInDays: number): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
      
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      throw new InfrastructureError(`Failed to cleanup old files in ${dirPath}: ${(error as Error).message}`);
    }
  }
}