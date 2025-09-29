#!/usr/bin/env node
/**
 * CLI simplificado para generación de recursos
 */
import { Command } from 'commander';
import { DefaultConsoleService } from './utils/ConsoleService';
import { DefaultFileSystemService } from './utils/FileSystemService';
import { InquirerPromptService } from './utils/PromptService';
import { SchemaCommand } from './commands/SchemaCommand';
import { ResourceCommand } from './commands/ResourceCommand';
import { OrchestratorCommand } from './commands/OrchestratorCommand';
import { BaseCommand } from './core/BaseCommand';
import { FileUtils } from './utils/FileUtils';
import { CLIError } from './core/CLIError';

// Crear instancias de servicios
const consoleService = new DefaultConsoleService({ debug: process.env.DEBUG === 'true' });
const fileSystemService = new DefaultFileSystemService();
const promptService = new InquirerPromptService();

// Obtener rutas importantes usando FileUtils
const { schemasDir } = FileUtils.getProjectPaths();

/**
 * Crea y configura el programa principal
 */
async function createProgram(): Promise<Command> {
  const program = new Command();

  // Configurar información básica
  program
    .name('api-cli')
    .description('CLI para generación de recursos API')
    .version('1.0.0')
    .option('-d, --debug', 'Mostrar mensajes de depuración', false);

  // Registrar comandos
  registerCommands(program);

  // Manejar el modo interactivo si no se especificaron comandos
  program.action(async () => {
    if (process.argv.length <= 2) {
      await runInteractiveMode();
    }
  });

  return program;
}

/**
 * Registra los comandos disponibles
 */
function registerCommands(program: Command): void {
  // Instanciar comandos
  const commands: BaseCommand[] = [
    new SchemaCommand(consoleService, promptService, fileSystemService, schemasDir),
    new ResourceCommand(consoleService, promptService, fileSystemService, schemasDir),
    new OrchestratorCommand(consoleService, promptService, fileSystemService),
  ];

  // Registrar comandos en el programa
  for (const command of commands) {
    const cmd = new Command(command.getName());
    cmd.description(command.getDescription());

    // Registrar opciones del comando
    for (const option of command.getOptions()) {
      const optConfig = option.required
        ? `-${option.alias}, --${option.name} <value>`
        : `-${option.alias}, --${option.name} [value]`;

      cmd.option(
        optConfig,
        option.description,
        option.default
      );
    }

    // Configurar la acción del comando
    cmd.action(async (options) => {
      try {
        await command.execute(options);
      } catch {
        process.exit(1);
      }
    });

    // Añadir el comando al programa principal
    program.addCommand(cmd);
  }
}

/**
 * Ejecuta el CLI en modo interactivo
 */
async function runInteractiveMode(): Promise<void> {
  try {
    consoleService.log('\n🚀 CLI para generación de recursos API\n');

    // Mostrar selector de comandos
    const commandChoices = [
      { name: 'Crear un nuevo esquema de recurso', value: 'schema' },
      { name: 'Generar un recurso desde un esquema existente', value: 'resource' },
      { name: 'Generar un nuevo orquestrador', value: 'orchestrator' },
      { name: 'Salir', value: 'exit' }
    ];

    const selectedCommand = await promptService.promptSelect<string>(
      '¿Qué acción deseas realizar?',
      commandChoices
    );

    if (selectedCommand === 'exit') {
      consoleService.log('👋 ¡Hasta pronto!');
      process.exit(0);
    }

    // Crear un nuevo programa y ejecutar el comando seleccionado directamente
    const program = await createProgram();

    // Obtener el comando específico del programa
    const command = program.commands.find(cmd => cmd.name() === selectedCommand);

    if (!command) {
      throw new CLIError('CLI', `Comando '${selectedCommand}' no encontrado`);
    }

    // Ejecutar el comando interactivamente (sin argumentos iniciales)
    await command.parseAsync([process.argv[0], process.argv[1]]);
  } catch (error) {
    if (error instanceof CLIError) {
      consoleService.error(error.message);
    } else {
      consoleService.error(`[CLI] Error en modo interactivo: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

/**
 * Función principal que inicializa y ejecuta el CLI
 */
async function main(): Promise<void> {
  try {
    // Crear y ejecutar el programa
    const program = await createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CLIError) {
      consoleService.error(error.message);
    } else {
      consoleService.error(`[CLI] Error fatal: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

// Ejecutar el CLI
main().catch(error => {
  if (error instanceof CLIError) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[CLI] Error no manejado: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
});