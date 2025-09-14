import { TestRepository } from './TestRepository';

export class TestService {
  private testRepository: TestRepository;

  constructor(testRepository: TestRepository) {
    this.testRepository = testRepository;
  }

  testx(): string {
    const repoResult = this.testRepository.test();
    return `TestService return: ${repoResult}`;
  }
}