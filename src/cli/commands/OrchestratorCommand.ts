/**
 * Comando para generar orquestadores
 *
 * Este comando genera los archivos necesarios para un orquestador:
 * - Orchestrator (servicio orquestador)
 * - Controller
 * - Routes
 *
 * Los orquestadores coordinan operaciones entre múltiples servicios
 * y NO deben acceder directamente a repositorios.
 */
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BaseCommand } from '../core/BaseCommand';
import { CommandOption, CommandOptions } from '../interfaces/CommandInterface';
import { ConsoleService, FileSystemService, PromptService } from '../interfaces/IOInterface';
import { StringUtils } from '../utils/StringUtils';

/**
 * Contexto para las plantillas del orquestador
 */
interface OrchestratorTemplateContext {
  resourceName: string;
  resourceNameUpper: string;
  resourceNameLower: string;
  resourceNames: string;
  resourceNamesUpper: string;
  resourceNamesLower: string;
  resourceNameKebab: string;
  resourceNamesKebab: string;
  imports?: string[];
}

/**
 * Implementación del comando para generar orquestadores
 */
export class OrchestratorCommand extends BaseCommand {
  // Plantillas de archivos a generar
  private readonly templateFiles: Record<string, string> = {
    orchestrator: 'OrchestratorService.hbs',
    controller: 'OrchestratorController.hbs',
    routes: 'OrchestratorRoutes.hbs'
  };

  // Directorios de destino para cada tipo de archivo
  private readonly targetDirs: Record<string, string> = {
    orchestrator: 'src/api/domain/orchestrators/{name}',
    controller: 'src/api/domain/orchestrators/{name}',
    routes: 'src/api/domain/orchestrators/{name}'
  };

  /**
   * Constructor del comando
   */
  constructor(
    consoleService: ConsoleService,
    promptService: PromptService,
    private readonly fileSystemService: FileSystemService
  ) {
    super(
      'orchestrator',
      'Genera un nuevo orquestador para coordinar operaciones entre servicios',
      consoleService,
      promptService
    );
  }

  /**
   * Define las opciones del comando
   */
  public getOptions(): CommandOption[] {
    return [
      {
        name: 'name',
        alias: 'n',
        description: 'Nombre del orquestador (ej: Order, Payment, Inventory)',
        type: 'string'
      },
      {
        name: 'overwrite',
        alias: 'o',
        description: 'Sobrescribir archivos existentes',
        type: 'boolean',
        default: false
      },
      {
        name: 'services',
        alias: 's',
        description: 'Lista de servicios a inyectar (separados por comas)',
        type: 'string'
      }
    ];
  }

  /**
   * Implementa la lógica del comando
   */
  protected async run(options: CommandOptions): Promise<void> {
    try {
      // Obtener las opciones de manera interactiva si no están presentes
      options = await this.getInteractiveOptions(options);

      // Validar el nombre
      if (!options.name) {
        throw new Error('El nombre del orquestador es requerido');
      }

      const orchestratorName = String(options.name);

      // Normalizar el nombre y obtener la versión en PascalCase
      const normalizedName = StringUtils.toCamelCase(orchestratorName);
      const resourceNameUpper = StringUtils.toPascalCase(normalizedName);

      // Crear el directorio base del orquestador
      const orchestratorDir = path.join(
        process.cwd(),
        'src/api/domain/orchestrators',
        resourceNameUpper
      );

      // Verificar si ya existe
      if (await this.fileSystemService.fileExists(orchestratorDir)) {
        if (!options.overwrite) {
          const shouldContinue = await this.promptService.promptConfirm(
            `El orquestador '${resourceNameUpper}' ya existe. ¿Desea sobrescribir los archivos?`,
            false
          );
          if (!shouldContinue) {
            this.consoleService.warn('Operación cancelada por el usuario');
            return;
          }
        }
      }

      // Crear el directorio
      await this.fileSystemService.ensureDirectoryExists(orchestratorDir);

      // Generar los archivos del orquestador
      await this.generateOrchestratorFiles(orchestratorName, options);

      // Actualizar las dependencias del dominio
      await this.updateDomainDependencies(orchestratorName);

      // Actualizar las rutas API
      await this.updateApiRoutes(orchestratorName);

      this.consoleService.success(`Orquestador '${resourceNameUpper}' generado con éxito`);
      this.consoleService.info(`\n📁 Archivos generados en: ${orchestratorDir}`);
      this.consoleService.info(`\n⚠️  Recuerda:`);
      this.consoleService.info(`  1. Inyectar los servicios necesarios en el constructor del orquestador`);
      this.consoleService.info(`  2. Implementar la lógica de orquestación en ${resourceNameUpper}Orchestrator`);
      this.consoleService.info(`  3. Definir los esquemas de validación Zod si son necesarios`);
      this.consoleService.info(`  4. Actualizar las rutas según tus necesidades`);
      this.consoleService.info(`  5. Los orquestadores NO deben acceder directamente a repositorios`);
    } catch (error) {
      throw new Error(`Error al generar el orquestador: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene opciones interactivamente si no están presentes
   */
  private async getInteractiveOptions(options: CommandOptions): Promise<CommandOptions> {
    // Si no hay nombre, solicitarlo
    if (!options.name) {
      options.name = await this.promptService.promptInput(
        'Ingresa el nombre del orquestador (ej: Order, Payment, Inventory)',
        { required: true }
      );
    }

    // Preguntar si se deben sobrescribir archivos existentes
    if (options.overwrite === undefined) {
      // Se preguntará más adelante si es necesario
    }

    // Preguntar por servicios a inyectar si no se proporcionaron
    if (!options.services) {
      const wantsServices = await this.promptService.promptConfirm(
        '¿Deseas especificar servicios a inyectar ahora?',
        false
      );

      if (wantsServices) {
        options.services = await this.promptService.promptInput(
          'Lista de servicios (separados por comas, ej: User, Order, Payment)',
          { required: false }
        );
      }
    }

    return options;
  }

  /**
   * Genera los archivos del orquestador
   */
  private async generateOrchestratorFiles(name: string, options: CommandOptions): Promise<void> {
    this.consoleService.info(`Generando archivos para el orquestador '${name}'...`);

    // Preparar el contexto para las plantillas
    const templateContext = this.prepareTemplateContext(name, options);

    // Obtener la ruta de las plantillas
    const templatesDir = path.join(process.cwd(), 'src/cli/templates');

    // Generar cada tipo de archivo
    for (const [fileType, templateFile] of Object.entries(this.templateFiles)) {
      await this.generateFile(
        templatesDir,
        templateFile,
        this.getTargetFilePath(name, fileType),
        templateContext,
        options.overwrite as boolean
      );
    }
  }

  /**
   * Prepara el contexto para las plantillas
   */
  private prepareTemplateContext(name: string, options: CommandOptions): OrchestratorTemplateContext {
    // Normalizar el nombre base del orquestador a camelCase
    const resourceName = StringUtils.toCamelCase(name);

    // Preparar todas las variantes del nombre
    const resourceNameUpper = StringUtils.toPascalCase(resourceName);
    const resourceNameLower = StringUtils.toCamelCase(resourceName);
    const resourceNames = StringUtils.pluralize(resourceName);
    const resourceNamesUpper = StringUtils.toPascalCase(resourceNames);
    const resourceNamesLower = StringUtils.toCamelCase(resourceNames);
    const resourceNameKebab = StringUtils.toKebabCase(resourceName);
    const resourceNamesKebab = StringUtils.toKebabCase(resourceNames);

    // Procesar servicios si se proporcionaron
    let imports: string[] = [];
    if (options.services) {
      imports = String(options.services)
        .split(',')
        .map(s => StringUtils.toPascalCase(s.trim()))
        .filter(s => s.length > 0);
    }

    return {
      resourceName,
      resourceNameUpper,
      resourceNameLower,
      resourceNames,
      resourceNamesUpper,
      resourceNamesLower,
      resourceNameKebab,
      resourceNamesKebab,
      imports
    };
  }

  /**
   * Genera un archivo a partir de una plantilla
   */
  private async generateFile(
    templatesDir: string,
    templateFile: string,
    targetFile: string,
    context: OrchestratorTemplateContext,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      // Verificar si el archivo ya existe
      const fileExists = await this.fileSystemService.fileExists(targetFile);

      if (fileExists && !overwrite) {
        this.consoleService.warn(`El archivo '${targetFile}' ya existe. Usa --overwrite para sobrescribirlo.`);
        return;
      }

      // Leer la plantilla
      const templatePath = path.join(templatesDir, templateFile);
      const templateContent = await this.fileSystemService.readFile(templatePath);

      // Compilar la plantilla
      const template = Handlebars.compile(templateContent, { noEscape: true });

      // Generar el contenido
      const content = template(context);

      // Asegurar que el directorio existe
      const dir = path.dirname(targetFile);
      await this.fileSystemService.ensureDirectoryExists(dir);

      // Escribir el archivo
      await this.fileSystemService.writeFile(targetFile, content);

      this.consoleService.info(`Archivo generado: ${targetFile}`);
    } catch (error) {
      this.consoleService.error(`Error al generar el archivo '${targetFile}': ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene la ruta de destino para un tipo de archivo
   */
  private getTargetFilePath(orchestratorName: string, fileType: string): string {
    // Normalizar el nombre del orquestador
    const normalizedName = StringUtils.toCamelCase(orchestratorName);
    const pascalName = StringUtils.toPascalCase(normalizedName);

    // Obtener el directorio base según el tipo de archivo
    const baseDir = this.targetDirs[fileType].replace('{name}', pascalName);

    // Determinar el nombre del archivo según el tipo
    let fileName: string;

    switch (fileType) {
      case 'orchestrator':
        fileName = `${pascalName}Orchestrator.ts`;
        break;
      case 'controller':
        fileName = `${pascalName}Controller.ts`;
        break;
      case 'routes':
        fileName = `${pascalName}Routes.ts`;
        break;
      default:
        fileName = `${pascalName}${StringUtils.toPascalCase(fileType)}.ts`;
    }

    return path.join(baseDir, fileName);
  }

  /**
   * Actualiza el archivo de rutas principal para incluir las rutas del orquestador
   */
  private async updateApiRoutes(orchestratorName: string): Promise<void> {
    try {
      const routesFile = path.join(process.cwd(), 'src/routes.ts');

      // Verificar si el archivo existe
      if (!(await this.fileSystemService.fileExists(routesFile))) {
        this.consoleService.warn(`No se encontró el archivo de rutas principal '${routesFile}'`);
        return;
      }

      // Normalizar el nombre del orquestador
      const normalizedName = StringUtils.toCamelCase(orchestratorName);
      const pascalName = StringUtils.toPascalCase(normalizedName);
      const routePath = StringUtils.toKebabCase(StringUtils.pluralize(normalizedName));

      // Leer el contenido actual
      const content = await this.fileSystemService.readFile(routesFile);

      // Verificar si la ruta ya está importada
      const importPattern = new RegExp(`import.+${pascalName}Routes`);
      if (content.match(importPattern)) {
        this.consoleService.warn(`Las rutas de ${pascalName} ya están registradas en ${routesFile}`);
        return;
      }

      // Crear nuevo contenido
      let newContent = content;

      // Añadir la importación
      const lastImportIndex = content.lastIndexOf('import {');
      if (lastImportIndex !== -1) {
        const nextLineAfterImport = content.indexOf('\n', lastImportIndex);
        if (nextLineAfterImport !== -1) {
          newContent =
            content.slice(0, nextLineAfterImport + 1) +
            `import { ${pascalName}Routes } from '@api/domain/orchestrators/${pascalName}/${pascalName}Routes';\n` +
            content.slice(nextLineAfterImport + 1);
        }
      }

      // Añadir la ruta al router
      const routerUsePattern = /router\.use\([^;]+;\n/g;
      const lastRouterUse = [...content.matchAll(routerUsePattern)].pop();

      if (lastRouterUse && lastRouterUse.index !== undefined) {
        const insertPoint = lastRouterUse.index + lastRouterUse[0].length;
        newContent =
          newContent.slice(0, insertPoint) +
          `router.use('/${routePath}', ${pascalName}Routes);\n` +
          newContent.slice(insertPoint);
      }

      // Escribir el nuevo contenido
      await this.fileSystemService.writeFile(routesFile, newContent);

      this.consoleService.info(`Rutas API actualizadas: '/${routePath}' añadida a ${routesFile}`);
    } catch (error) {
      this.consoleService.error(`Error al actualizar rutas API: ${(error as Error).message}`);
    }
  }

  /**
   * Actualiza el archivo domain.dependencies.ts agregando las dependencias del orquestador
   */
  private async updateDomainDependencies(orchestratorName: string): Promise<void> {
    try {
      const dependenciesFile = path.join(process.cwd(), 'src/api/dependencies/domain.dependencies.ts');

      // Verificar si el archivo existe
      if (!(await this.fileSystemService.fileExists(dependenciesFile))) {
        this.consoleService.warn(`Archivo ${dependenciesFile} no encontrado. Las dependencias deben registrarse manualmente.`);
        return;
      }

      const resourceNameUpper = StringUtils.toPascalCase(orchestratorName);
      const resourceNameLower = StringUtils.toCamelCase(orchestratorName);

      // Leer el archivo actual
      let content = await this.fileSystemService.readFile(dependenciesFile);

      // Verificar si ya existe el orquestador
      if (content.includes(`${resourceNameUpper}Orchestrator`) || content.includes(`${resourceNameUpper}Controller`)) {
        this.consoleService.warn(`Las dependencias para ${resourceNameUpper} ya están registradas.`);
        return;
      }

      // Preparar las nuevas líneas de import
      const newImports = `
// Importar orchestrator - ${resourceNameUpper}
import { ${resourceNameUpper}Orchestrator } from '@api/domain/orchestrators/${resourceNameUpper}/${resourceNameUpper}Orchestrator';
import { ${resourceNameUpper}Controller } from '@api/domain/orchestrators/${resourceNameUpper}/${resourceNameUpper}Controller';`;

      // Preparar las nuevas líneas de registro
      const newRegistrations = `
  // ========================================
  // Orchestrator: ${resourceNameUpper}
  // ========================================
  Container.register('${resourceNameLower}Orchestrator').asClass(${resourceNameUpper}Orchestrator).scoped();
  Container.register('${resourceNameLower}Controller').asClass(${resourceNameUpper}Controller).scoped();`;

      // Insertar imports después del último import existente
      const lastImportIndex = content.lastIndexOf('import {');
      if (lastImportIndex !== -1) {
        const nextLineAfterImport = content.indexOf('\n', lastImportIndex);
        if (nextLineAfterImport !== -1) {
          const lineAfterThat = content.indexOf('\n', nextLineAfterImport + 1);
          if (lineAfterThat !== -1) {
            content = content.slice(0, lineAfterThat) + newImports + content.slice(lineAfterThat);
          }
        }
      }

      // Insertar registros antes del comentario final
      const beforeComment = content.lastIndexOf('  // Agregar más entidades siguiendo el mismo patrón...');
      if (beforeComment !== -1) {
        content = content.slice(0, beforeComment) + newRegistrations + '\n\n' + content.slice(beforeComment);
      } else {
        // Si no encuentra el comentario, insertar antes del último }
        const lastBrace = content.lastIndexOf('}');
        if (lastBrace !== -1) {
          content = content.slice(0, lastBrace) + newRegistrations + '\n' + content.slice(lastBrace);
        }
      }

      // Escribir el archivo actualizado
      await this.fileSystemService.writeFile(dependenciesFile, content);

      this.consoleService.info(`Dependencias de ${resourceNameUpper} añadidas a domain.dependencies.ts`);
    } catch (error) {
      this.consoleService.error(`Error al actualizar dependencias: ${(error as Error).message}`);
    }
  }
}