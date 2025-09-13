import { Request, Response } from 'express';
import { TestService } from './TestService';

export class TestController {
  private testService: TestService;
  
  constructor({ testService }: { testService: TestService }) {
    this.testService = testService;
  }

  test(req: Request, res: Response): void {
    console.log('=== DEBUG TestController ===');
    console.log('this:', this);
    console.log('this.testService:', this.testService);
    console.log('typeof this.testService:', typeof this.testService);
    console.log('this.testService keys:', this.testService ? Object.keys(this.testService) : 'undefined');
    
    try {
      const result = this.testService.testx();
      res.json({
        status: 'success',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.log('Error calling testService.test():', error);
      throw error;
    }
  }
}