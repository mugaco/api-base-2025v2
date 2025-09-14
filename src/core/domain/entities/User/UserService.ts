import { BaseService } from '@core/base/BaseService';
import { useBadRequestError, useNotFoundError } from '../../../hooks/useError';
import { IUserModel } from './UserModel';
import { UserRepository } from './UserRepository';
import { ICreateUser, IUpdateUser, IUpdatePassword, IUserResponse, userToResponse } from './UserSchema';

/**
 * Servicio para la entidad User heredando de BaseService
 */
export class UserService extends BaseService<IUserModel, IUserResponse, ICreateUser, IUpdateUser> {
  constructor(userRepository: UserRepository) {
    super(userRepository);
  }

  /**
   * Sobrescribe getAll para aplicar transformación
   */
  async getAll(query?: any): Promise<IUserResponse[]> {
    const users = await super.getAll(query);
    return users.map(user => userToResponse(user as unknown as IUserModel));
  }
  
  /**
   * Sobrescribe getById para aplicar transformación
   */
  async getById(_id: string): Promise<IUserResponse> {
    const user = await super.getById(_id);
    return userToResponse(user as unknown as IUserModel);
  }
  
  /**
   * Sobrescribe findOne para aplicar transformación
   */
  async findOne(query: any): Promise<IUserResponse | null> {
    const user = await super.findOne(query);
    return user ? userToResponse(user as unknown as IUserModel) : null;
  }
  
  /**
   * Sobrescribe create para aplicar transformación y lógica específica
   */
  async create(data: ICreateUser): Promise<IUserResponse> {
    // Adaptamos el avatar para manejar el tipo null
    const createData: any = { 
      ...data, 
      avatar: data.avatar === null ? undefined : data.avatar 
    };
    const newUser = await super.create(createData);
    return userToResponse(newUser as unknown as IUserModel);
  }
  
  /**
   * Sobrescribe update para aplicar transformación y lógica específica
   */
  async update(_id: string, data: IUpdateUser): Promise<IUserResponse> {
    // Adaptamos el avatar para manejar el tipo null
    const updateData: any = data.avatar === null 
      ? { ...data, avatar: undefined } 
      : data;
    
    const updatedUser = await super.update(_id, updateData);
    return userToResponse(updatedUser as unknown as IUserModel);
  }
  
  /**
   * Sobrescribe softDelete para aplicar transformación
   */
  async softDelete(_id: string): Promise<IUserResponse> {
    const user = await super.softDelete(_id);
    return userToResponse(user as unknown as IUserModel);
  }
  
  /**
   * Sobrescribe getPaginated para aplicar transformación
   */
  async getPaginated(
    query: any,
    paginationParams: any,
    options?: any
  ): Promise<any> {
    const paginatedResult = await super.getPaginated(query, paginationParams, options);
    return {
      ...paginatedResult,
      data: paginatedResult.data.map((user: any) => userToResponse(user as IUserModel))
    };
  }

  /**
   * Sobrescribe getPaginatedWithFilters para aplicar transformación
   */
  async getPaginatedWithFilters(
    filter: any = {},
    paginationParams: any,
    options?: any,
    advancedFilters?: string
  ): Promise<any> {
    const paginatedResult = await super.getPaginatedWithFilters(
      filter,
      paginationParams,
      options,
      advancedFilters
    );
    
    return {
      ...paginatedResult,
      data: paginatedResult.data.map((user: any) => userToResponse(user as IUserModel))
    };
  }

  // Métodos específicos del servicio de usuarios
  async findByEmail(email: string): Promise<IUserResponse | null> {
    const user = await (this.repository as UserRepository).findByEmail(email);
    return user ? userToResponse(user) : null;
  }

  async register(userData: ICreateUser): Promise<IUserResponse> {
    // Verificar si el email ya existe
    const existingEmail = await (this.repository as UserRepository).findByEmail(userData.email);
    if (existingEmail) {
      throw useBadRequestError('El email ya está en uso');
    }
    
    // Verificar si el nombre ya existe
    const existingName = await (this.repository as UserRepository).findByName(userData.name);
    if (existingName) {
      throw useBadRequestError('El nombre ya está en uso');
    }
    
    // Crear usuario
    return this.create(userData);
  }

  async restore(_id: string): Promise<IUserResponse> {
    const user = await super.restore(_id);
    return userToResponse(user as unknown as IUserModel);
  }

  async updateProfile(_id: string, data: IUpdateUser): Promise<IUserResponse> {
    return this.update(_id, data);
  }

  async updatePassword(_id: string, data: IUpdatePassword): Promise<IUserResponse> {
    // Buscar el usuario por ID
    const user = await this.repository.findById(_id);
    if (!user) {
      throw useNotFoundError('Usuario');
    }

    // Actualizar solo el password (el pre-save hook se encargará de encriptarlo)
    user.password = data.password;
    
    // Usar save() para ejecutar el pre-save hook
    const updatedUser = await user.save();
    
    return userToResponse(updatedUser);
  }

  /**
   * Buscar usuario con contraseña incluida (para autenticación)
   * Retorna el modelo raw (no transformado) para acceso a métodos como comparePassword
   */
  async findOneWithPassword(filter: any): Promise<IUserModel | null> {
    const repository = this.repository as UserRepository;
    return await repository.findOneWithPassword(filter);
  }

  /**
   * Buscar usuario por ID sin transformar (para uso en orquestadores)
   * Retorna el modelo raw para acceso completo a propiedades y métodos
   */
  async findByIdRaw(_id: string): Promise<IUserModel | null> {
    return await this.repository.findById(_id);
  }

  /**
   * Buscar usuario sin transformar (para uso en orquestadores)
   * Retorna el modelo raw para acceso completo a propiedades y métodos
   */
  async findOneRaw(filter: any): Promise<IUserModel | null> {
    return await this.repository.findOne(filter);
  }
} 