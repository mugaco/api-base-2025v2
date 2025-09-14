import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

// Definir interfaces genéricas para los payloads de tokens
export interface TokenPayload {
  [key: string]: unknown;
}

export interface RefreshTokenPayload {
  refreshtoken_id: string;
  [key: string]: unknown;
}

export class TokenService {
  private readonly jwtSecret: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
  }
  
  async generateToken<T extends TokenPayload>(payload: T, expiresIn: StringValue | number = '150m'): Promise<string> {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }
  
  async generateRefreshToken(refreshTokenId: string, expiresIn: StringValue | number = '7d'): Promise<string> {
    const payload: RefreshTokenPayload = { refreshtoken_id: refreshTokenId };
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }
  
  async verifyToken<T>(token: string): Promise<T> {
    try {
      return jwt.verify(token, this.jwtSecret) as T;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('El token ha expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      } else {
        throw error;
      }
    }
  }
  
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.verifyToken<RefreshTokenPayload>(token);
  }
  
  async getRefreshTokenId(token: string): Promise<string> {
    try {
      const decoded = await this.verifyRefreshToken(token);
      return decoded.refreshtoken_id;
    } catch {
      throw new Error('Error al obtener el ID del refresh token');
    }
  }
} 