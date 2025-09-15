import { DefaultConsoleService } from '../../utils/ConsoleService';

describe('DefaultConsoleService', () => {
  let consoleService: DefaultConsoleService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleService = new DefaultConsoleService();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('muestra mensajes informativos', () => {
    consoleService.info('Mensaje informativo');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('muestra mensajes de éxito', () => {
    consoleService.success('Mensaje de éxito');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('muestra mensajes de advertencia', () => {
    consoleService.warn('Mensaje de advertencia');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('muestra mensajes de error', () => {
    consoleService.error('Mensaje de error');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('no muestra mensajes en modo silencioso', () => {
    consoleService.setSilent(true);
    
    consoleService.info('Este mensaje no debería mostrarse');
    consoleService.success('Este mensaje no debería mostrarse');
    consoleService.warn('Este mensaje no debería mostrarse');
    consoleService.error('Este mensaje no debería mostrarse');
    consoleService.log('Este mensaje no debería mostrarse');
    
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('muestra mensajes de depuración solo en modo debug', () => {
    consoleService.debug('Este mensaje no debería mostrarse');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleService.setDebugMode(true);
    consoleService.debug('Este mensaje debería mostrarse');
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('incluye colores en los mensajes', () => {
    // No podemos verificar el contenido exacto con colores fácilmente,
    // pero podemos asegurarnos de que no falle
    consoleService.info('Mensaje con color', { color: 'blue' });
    consoleService.success('Mensaje con color', { color: 'green' });
    consoleService.warn('Mensaje con color', { color: 'yellow' });
    consoleService.error('Mensaje con color', { color: 'red' });
    
    expect(consoleSpy).toHaveBeenCalledTimes(4);
  });

  test('incluye estilos en los mensajes', () => {
    consoleService.info('Mensaje con estilo', { style: 'bold' });
    consoleService.info('Mensaje con estilo', { style: 'italic' });
    consoleService.info('Mensaje con estilo', { style: 'underline' });
    
    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });
}); 