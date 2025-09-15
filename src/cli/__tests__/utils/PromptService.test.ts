// Crear mock con jest.mock antes de cualquier importación
jest.mock('inquirer', () => {
  return {
    prompt: jest.fn()
  };
});

// Importar después del mock
import inquirer from 'inquirer';
import { InquirerPromptService } from '../../utils/PromptService';

// Obtener referencia al mock después de importar - corregir el error de tipos
const mockPromptFn = inquirer.prompt as unknown as jest.Mock;

describe('InquirerPromptService', () => {
  let promptService: InquirerPromptService;
  
  beforeEach(() => {
    promptService = new InquirerPromptService();
    mockPromptFn.mockClear();
  });

  test('prompt solicita entrada general', async () => {
    // Configurar mock para devolver un valor
    mockPromptFn.mockResolvedValue({ value: 'test result' });
    
    const options = {
      type: 'input' as const,
      message: 'Ingrese valor'
    };
    
    const result = await promptService.prompt(options);
    
    expect(result).toBe('test result');
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: options.type,
        message: options.message,
        name: 'value'
      })
    ]);
  });

  test('promptMany solicita múltiples entradas', async () => {
    // Configurar mock para devolver varios valores
    const mockResponses = {
      field1: 'value1',
      field2: 'value2'
    };
    
    mockPromptFn.mockResolvedValue(mockResponses);
    
    const questions = [
      {
        name: 'field1',
        type: 'input' as const,
        message: 'Campo 1'
      },
      {
        name: 'field2',
        type: 'input' as const,
        message: 'Campo 2'
      }
    ];
    
    const result = await promptService.promptMany(questions);
    
    expect(result).toEqual(mockResponses);
    expect(mockPromptFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'field1' }),
        expect.objectContaining({ name: 'field2' })
      ])
    );
  });

  test('promptInput solicita entrada de texto', async () => {
    mockPromptFn.mockResolvedValue({ value: 'test input' });
    
    const result = await promptService.promptInput('Ingrese texto');
    
    expect(result).toBe('test input');
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'input',
        message: 'Ingrese texto'
      })
    ]);
  });

  test('promptInput acepta un valor por defecto', async () => {
    mockPromptFn.mockResolvedValue({ value: 'default value' });
    
    await promptService.promptInput('Ingrese texto', 'default value');
    
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        default: 'default value'
      })
    ]);
  });

  test('promptConfirm solicita confirmación', async () => {
    mockPromptFn.mockResolvedValue({ value: true });
    
    const result = await promptService.promptConfirm('¿Está seguro?');
    
    expect(result).toBe(true);
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'confirm',
        message: '¿Está seguro?'
      })
    ]);
  });

  test('promptConfirm acepta un valor por defecto', async () => {
    mockPromptFn.mockResolvedValue({ value: true });
    
    await promptService.promptConfirm('¿Está seguro?', true);
    
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        default: true
      })
    ]);
  });

  test('promptSelect muestra opciones y devuelve la selección', async () => {
    mockPromptFn.mockResolvedValue({ value: 'option2' });
    
    const choices = [
      { name: 'Opción 1', value: 'option1' },
      { name: 'Opción 2', value: 'option2' }
    ];
    
    const result = await promptService.promptSelect('Seleccione una opción', choices);
    
    expect(result).toBe('option2');
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'list',
        message: 'Seleccione una opción',
        choices
      })
    ]);
  });

  test('promptSelect acepta un valor por defecto', async () => {
    mockPromptFn.mockResolvedValue({ value: 'option1' });
    
    const choices = [
      { name: 'Opción 1', value: 'option1' },
      { name: 'Opción 2', value: 'option2' }
    ];
    
    await promptService.promptSelect('Seleccione una opción', choices, 'option1');
    
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        default: 'option1'
      })
    ]);
  });

  test('promptCheckbox permite seleccionar múltiples opciones', async () => {
    mockPromptFn.mockResolvedValue({ value: ['option1', 'option3'] });
    
    const choices = [
      { name: 'Opción 1', value: 'option1' },
      { name: 'Opción 2', value: 'option2' },
      { name: 'Opción 3', value: 'option3' }
    ];
    
    const result = await promptService.promptCheckbox('Seleccione opciones', choices);
    
    expect(result).toEqual(['option1', 'option3']);
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'checkbox',
        message: 'Seleccione opciones',
        choices
      })
    ]);
  });

  test('promptPassword solicita contraseña ocultando entrada', async () => {
    mockPromptFn.mockResolvedValue({ value: 'password123' });
    
    const result = await promptService.promptPassword('Ingrese contraseña');
    
    expect(result).toBe('password123');
    expect(mockPromptFn).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'password',
        message: 'Ingrese contraseña'
      })
    ]);
  });
}); 