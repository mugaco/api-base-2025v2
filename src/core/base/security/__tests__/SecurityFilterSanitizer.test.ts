import { SecurityFilterSanitizer } from '../SecurityFilterSanitizer';

describe('SecurityFilterSanitizer', () => {
  describe('Operadores peligrosos', () => {
    it('debe bloquear operador $where', () => {
      const maliciousFilter = {
        $where: 'this.password == "admin123"'
      };

      const result = SecurityFilterSanitizer.sanitize(maliciousFilter);

      expect(result.sanitized).toEqual({});
      expect(result.violations).toContain('Blocked forbidden operator: $where');
    });

    it('debe bloquear operador $expr', () => {
      const maliciousFilter = {
        $expr: { $eq: ['$password', 'admin123'] }
      };

      const result = SecurityFilterSanitizer.sanitize(maliciousFilter);

      expect(result.sanitized).toEqual({});
      expect(result.violations).toContain('Blocked forbidden operator: $expr');
    });

    it('debe bloquear operador $function', () => {
      const maliciousFilter = {
        $function: {
          body: 'function() { return this.password == "admin123"; }',
          args: [],
          lang: 'js'
        }
      };

      const result = SecurityFilterSanitizer.sanitize(maliciousFilter);

      expect(result.sanitized).toEqual({});
      expect(result.violations).toContain('Blocked forbidden operator: $function');
    });

    it('debe bloquear $where anidado en $or', () => {
      const maliciousFilter = {
        $or: [
          { status: 'active' },
          { $where: 'this.password == "admin123"' }
        ]
      };

      const result = SecurityFilterSanitizer.sanitize(maliciousFilter);

      expect(result.sanitized).toEqual({
        $or: [{ status: 'active' }]
      });
      expect(result.violations).toContain('Blocked forbidden operator: $where');
    });
  });

  describe('Campos protegidos', () => {
    it('debe eliminar campo isDeleted', () => {
      const filter = {
        name: 'test',
        isDeleted: true
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual({ name: 'test' });
      expect(result.violations).toContain('Blocked protected field: isDeleted');
    });

    it('debe eliminar campos protegidos en queries anidadas', () => {
      const filter = {
        $and: [
          { name: 'test' },
          { isDeleted: false },
          { deletedAt: { $exists: false } }
        ]
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual({
        $and: [{ name: 'test' }]
      });
    });

    it('debe respetar campos protegidos personalizados', () => {
      const filter = {
        name: 'test',
        internalCost: 100
      };

      const result = SecurityFilterSanitizer.sanitize(filter, 0, {
        customProtectedFields: ['internalCost']
      });

      expect(result.sanitized).toEqual({ name: 'test' });
      expect(result.violations).toContain('Blocked protected field: internalCost');
    });
  });

  describe('Whitelist de campos', () => {
    it('debe permitir solo campos en whitelist', () => {
      const filter = {
        name: 'test',
        price: 100,
        internalCost: 50,
        secret: 'hidden'
      };

      const result = SecurityFilterSanitizer.sanitize(filter, 0, {
        allowedFields: new Set(['name', 'price'])
      });

      expect(result.sanitized).toEqual({
        name: 'test',
        price: 100
      });
      expect(result.violations).toContain('Field not in whitelist: internalCost');
      expect(result.violations).toContain('Field not in whitelist: secret');
    });

    it('debe permitir operadores MongoDB aunque haya whitelist', () => {
      const filter = {
        $and: [
          { name: 'test' },
          { price: { $gt: 50 } }
        ]
      };

      const result = SecurityFilterSanitizer.sanitize(filter, 0, {
        allowedFields: new Set(['name', 'price'])
      });

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Prevención de DoS', () => {
    it('debe rechazar profundidad excesiva', () => {
      const createDeepFilter = (depth: number): unknown => {
        if (depth === 0) return { name: 'test' };
        return { $and: [createDeepFilter(depth - 1)] };
      };

      const deepFilter = createDeepFilter(10);

      const result = SecurityFilterSanitizer.sanitize(deepFilter);

      expect(result.sanitized).toEqual({});
      expect(result.violations[0]).toContain('Sanitization failed');
    });

    it('debe rechazar arrays muy grandes', () => {
      const largeArray = new Array(200).fill({ status: 'active' });
      const filter = { $or: largeArray };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual({});
      expect(result.violations[0]).toContain('Sanitization failed');
    });

    it('debe rechazar regex peligrosos (ReDoS)', () => {
      const dangerousPatterns = [
        '(.*)*',
        '(.+)+',
        '(a+)+b',
        '(a|a)*',
        '(a|ab)*(b|cd)*'
      ];

      dangerousPatterns.forEach(pattern => {
        const filter = { name: { $regex: pattern } };
        const result = SecurityFilterSanitizer.sanitize(filter);

        expect(result.sanitized).toEqual({});
        expect(result.violations).toContain('Invalid or dangerous regex pattern in field name');
      });
    });

    it('debe rechazar strings muy largos', () => {
      const longString = 'a'.repeat(2000);
      const filter = { name: longString };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual({});
      expect(result.violations[0]).toContain('Sanitization failed');
    });
  });

  describe('Operadores válidos', () => {
    it('debe permitir operadores de comparación básicos', () => {
      const filter = {
        price: { $gt: 10, $lte: 100 },
        stock: { $gte: 0 },
        discount: { $ne: null }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });

    it('debe permitir $in y $nin con arrays válidos', () => {
      const filter = {
        status: { $in: ['active', 'pending'] },
        category: { $nin: ['deprecated', 'deleted'] }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });

    it('debe permitir $regex válidos', () => {
      const filter = {
        name: { $regex: '^product' },
        description: { $regex: 'test', $options: 'i' }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual({
        name: { $regex: '^product' },
        description: { $regex: 'test' }
      });
      expect(result.violations).toHaveLength(0);
    });

    it('debe permitir $exists', () => {
      const filter = {
        optional_field: { $exists: true },
        deleted_field: { $exists: false }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });

    it('debe permitir $elemMatch', () => {
      const filter = {
        tags: {
          $elemMatch: {
            name: 'important',
            priority: { $gt: 5 }
          }
        }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Queries complejas', () => {
    it('debe sanitizar query compleja correctamente', () => {
      const complexFilter = {
        $and: [
          { status: 'active' },
          {
            $or: [
              { price: { $gte: 10, $lte: 100 } },
              { category: { $in: ['electronics', 'books'] } }
            ]
          },
          { isDeleted: false },
          { $where: 'this.stock > 0' }
        ],
        name: { $regex: '^Product' },
        internalField: 'should be removed'
      };

      const result = SecurityFilterSanitizer.sanitize(complexFilter, 0, {
        allowedFields: new Set(['status', 'price', 'category', 'name', 'stock'])
      });

      expect(result.sanitized).toEqual({
        $and: [
          { status: 'active' },
          {
            $or: [
              { price: { $gte: 10, $lte: 100 } },
              { category: { $in: ['electronics', 'books'] } }
            ]
          }
        ],
        name: { $regex: '^Product' }
      });

      expect(result.violations).toContain('Blocked protected field: isDeleted');
      expect(result.violations).toContain('Blocked forbidden operator: $where');
      expect(result.violations).toContain('Field not in whitelist: internalField');
    });

    it('debe manejar $not correctamente', () => {
      const filter = {
        $not: {
          status: 'deleted'
        }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Valores especiales', () => {
    it('debe manejar valores null y undefined', () => {
      const filter = {
        field1: null,
        field2: undefined,
        field3: { $eq: null }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });

    it('debe manejar fechas correctamente', () => {
      const date = new Date('2024-01-01');
      const filter = {
        createdAt: { $gte: date },
        updatedAt: date
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });

    it('debe manejar ObjectIds correctamente', () => {
      const objectId = { _bsontype: 'ObjectID', toString: (): string => '507f1f77bcf86cd799439011' };
      const filter = {
        _id: objectId,
        userId: { $eq: objectId }
      };

      const result = SecurityFilterSanitizer.sanitize(filter);

      expect(result.sanitized).toEqual(filter);
      expect(result.violations).toHaveLength(0);
    });
  });
});