import { createContainer, asClass, asFunction, asValue, AwilixContainer, InjectionMode, Resolver } from 'awilix';


// Tipos para el builder pattern
interface ClassRegistration {
  inject(injector: () => Record<string, unknown>): ClassRegistration;
  singleton(): AwilixContainer;
  scoped(): AwilixContainer;
  transient(): AwilixContainer;
}

interface FunctionRegistration {
  singleton(): AwilixContainer;
  scoped(): AwilixContainer;
  transient(): AwilixContainer;
}

interface RegistrationBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asClass(ServiceClass: any): ClassRegistration;  // Necesario para Awilix DI - maneja inyección automática
  asFunction<T>(factory: (...args: unknown[]) => T): FunctionRegistration;
  asValue<T>(value: T): AwilixContainer;
}

export class Container {
  private static instance: AwilixContainer | null = null;
  private static initialized = false;

  /**
   * Crear y configurar el contenedor (llamar una sola vez al inicio)
   */
  static create(): AwilixContainer {
    if (this.initialized) {
      return this.instance!;
    }

    this.instance = createContainer({
      injectionMode: InjectionMode.CLASSIC
    });

    this.initialized = true;  // Marcar como inicializado

    return this.instance;
  }

  /**
   * Obtener el contenedor existente
   */
  static get(): AwilixContainer {
    if (!this.instance || !this.initialized) {
      throw new Error('Container not initialized. Call Container.create() first');
    }
    return this.instance;
  }

  /**
   * Resolver un servicio del contenedor
   */
  static resolve<T>(name: string): T {
    return this.get().resolve<T>(name);
  }

  /**
   * Registrar un servicio con builder pattern
   */
  static register(name: string): RegistrationBuilder {
    const container = this.get();
    
    return {
      /**
       * Se usa 'any' aquí porque Awilix necesita flexibilidad para manejar constructores
       * con diferentes firmas de parámetros. TypeScript no puede inferir los tipos de
       * inyección de dependencias en tiempo de compilación. Awilix resuelve esto en runtime.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      asClass: (ServiceClass: any): ClassRegistration => {
        let injector: (() => Record<string, unknown>) | undefined;
        
        const registration: ClassRegistration = {
          inject: (injectFn: () => Record<string, unknown>): ClassRegistration => {
            injector = injectFn;
            return registration;
          },
          singleton: (): AwilixContainer => {
            const resolver = injector 
              ? asClass(ServiceClass).inject(injector).singleton()
              : asClass(ServiceClass).singleton();
            container.register({ [name]: resolver });
            return container;
          },
          scoped: (): AwilixContainer => {
            const resolver = injector 
              ? asClass(ServiceClass).inject(injector).scoped()
              : asClass(ServiceClass).scoped();
            container.register({ [name]: resolver });
            return container;
          },
          transient: (): AwilixContainer => {
            const resolver = injector 
              ? asClass(ServiceClass).inject(injector).transient()
              : asClass(ServiceClass).transient();
            container.register({ [name]: resolver });
            return container;
          }
        };
        
        return registration;
      },
      
      asFunction: <T>(factory: (...args: unknown[]) => T): FunctionRegistration => ({
        singleton: (): AwilixContainer => {
          container.register({ [name]: asFunction(factory).singleton() });
          return container;
        },
        scoped: (): AwilixContainer => {
          container.register({ [name]: asFunction(factory).scoped() });
          return container;
        },
        transient: (): AwilixContainer => {
          container.register({ [name]: asFunction(factory).transient() });
          return container;
        }
      }),
      
      asValue: <T>(value: T): AwilixContainer => {
        container.register({ [name]: asValue(value) });
        return container;
      }
    };
  }

  /**
   * Registrar múltiples servicios de una vez
   */
  static registerBulk(services: Record<string, Resolver<unknown>>): void {
    this.get().register(services);
  }

  /**
   * Limpiar el contenedor (útil para tests)
   */
  static dispose(): void {
    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
      this.initialized = false;
    }
  }
}