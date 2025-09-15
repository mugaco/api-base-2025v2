import fs from 'fs';
import path from 'path';
import { DefaultFileSystemService } from '../../utils/FileSystemService';

// Mock de fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn()
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  constants: {
    F_OK: 0
  }
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/') || '.')
}));

describe('DefaultFileSystemService', () => {
  let fileService: DefaultFileSystemService;
  
  beforeEach(() => {
    fileService = new DefaultFileSystemService();
    
    // Reiniciar todos los mocks
    jest.clearAllMocks();
  });
  
  describe('readFile', () => {
    test('lee contenido de un archivo existente', async () => {
      const mockContent = 'contenido de prueba';
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      
      const result = await fileService.readFile('test.txt');
      
      expect(result).toBe(mockContent);
      expect(fs.promises.readFile).toHaveBeenCalledWith('test.txt', { encoding: 'utf8' });
    });
    
    test('maneja errores al leer un archivo', async () => {
      const mockError = new Error('Error al leer archivo');
      (fs.promises.readFile as jest.Mock).mockRejectedValue(mockError);
      
      await expect(fileService.readFile('no-existe.txt')).rejects.toThrow('Error al leer archivo');
    });
  });
  
  describe('writeFile', () => {
    test('escribe contenido a un archivo', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      await fileService.writeFile('test.txt', 'nuevo contenido');
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith('test.txt', 'nuevo contenido');
    });
    
    test('crea directorio si no existe', async () => {
      // Simular que el directorio no existe
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (path.dirname as jest.Mock).mockReturnValue('ruta/subdir');
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      
      await fileService.writeFile('ruta/subdir/archivo.txt', 'contenido');
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith('ruta/subdir', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalledWith('ruta/subdir/archivo.txt', 'contenido');
    });
    
    test('maneja errores al escribir un archivo', async () => {
      const mockError = new Error('Error al escribir archivo');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(mockError);
      
      await expect(fileService.writeFile('test.txt', 'contenido')).rejects.toThrow('Error al escribir archivo');
    });
  });
  
  describe('fileExists', () => {
    test('devuelve true para archivos existentes', async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      
      const result = await fileService.fileExists('existe.txt');
      
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith('existe.txt', fs.constants.F_OK);
    });
    
    test('devuelve false para archivos inexistentes', async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error('No existe'));
      
      const result = await fileService.fileExists('no-existe.txt');
      
      expect(result).toBe(false);
    });
  });
  
  describe('listFiles', () => {
    test('lista archivos en un directorio', async () => {
      // Crear entradas de directorio simuladas con métodos isFile e isDirectory
      const mockEntries = [
        { name: 'archivo1.txt', isFile: () => true, isDirectory: () => false },
        { name: 'archivo2.txt', isFile: () => true, isDirectory: () => false }
      ];
      (fs.promises.readdir as jest.Mock).mockResolvedValue(mockEntries);
      
      const result = await fileService.listFiles('directorio');
      
      expect(result).toHaveLength(2);
      expect(result).toContain('directorio/archivo1.txt');
      expect(result).toContain('directorio/archivo2.txt');
    });
    
    test('maneja errores al listar archivos', async () => {
      const mockError = new Error('Error al listar directorio');
      (fs.promises.readdir as jest.Mock).mockRejectedValue(mockError);
      
      await expect(fileService.listFiles('dir-no-existe')).rejects.toThrow('Error al listar directorio');
    });
  });
  
  describe('isDirectory', () => {
    test('devuelve true para directorios', async () => {
      const mockStats = { isDirectory: () => true };
      (fs.promises.stat as jest.Mock).mockResolvedValue(mockStats);
      
      const result = await fileService.isDirectory('es-directorio');
      
      expect(result).toBe(true);
      expect(fs.promises.stat).toHaveBeenCalledWith('es-directorio');
    });
    
    test('devuelve false para archivos', async () => {
      const mockStats = { isDirectory: () => false };
      (fs.promises.stat as jest.Mock).mockResolvedValue(mockStats);
      
      const result = await fileService.isDirectory('es-archivo.txt');
      
      expect(result).toBe(false);
    });
    
    test('maneja errores retornando false', async () => {
      const mockError = new Error('No existe');
      (fs.promises.stat as jest.Mock).mockRejectedValue(mockError);
      
      const result = await fileService.isDirectory('no-existe');
      
      expect(result).toBe(false);
    });
  });
  
  describe('ensureDirectoryExists', () => {
    test('crea directorio si no existe', async () => {
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      
      await fileService.ensureDirectoryExists('nuevo-directorio');
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith('nuevo-directorio', { recursive: true });
    });
    
    test('no hace nada si el directorio ya existe', async () => {
      const mockError = { code: 'EEXIST' };
      (fs.promises.mkdir as jest.Mock).mockRejectedValue(mockError);
      
      await fileService.ensureDirectoryExists('directorio-existente');
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith('directorio-existente', { recursive: true });
    });
    
    test('maneja otros errores', async () => {
      const mockError = new Error('Error de permisos');
      (fs.promises.mkdir as jest.Mock).mockRejectedValue(mockError);
      
      await expect(fileService.ensureDirectoryExists('dir-error')).rejects.toThrow('Error de permisos');
    });
  });
  
  describe('joinPaths', () => {
    test('une múltiples segmentos de ruta', () => {
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
      
      const result = fileService.joinPaths('dir1', 'dir2', 'archivo.txt');
      
      expect(result).toBe('dir1/dir2/archivo.txt');
      expect(path.join).toHaveBeenCalledWith('dir1', 'dir2', 'archivo.txt');
    });
  });
}); 