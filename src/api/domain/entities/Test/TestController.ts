import { Request, Response } from 'express';
import { TestService } from './TestService';

export class TestController {
  private testService: TestService;
  
  constructor( testService: TestService ) {
    this.testService = testService;
  }

  test(req: Request, res: Response): void {

    try {
      const result = this.testService.testx();
      res.json({
        status: 'success',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error calling testService.test():', error);
      throw error;
    }
  }
}