export class RequestContext {
  private actions: unknown[] = [];

  get(): unknown[] {
    return this.actions;
  }

  push(action: unknown): void {
    this.actions.push(action);
  }

  clean(): void {
    this.actions = [];
  }
}