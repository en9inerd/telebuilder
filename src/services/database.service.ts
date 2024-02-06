export abstract class BaseDBService {
  private readonly connectString!: string;
  public dbInstance!: unknown;

  constructor() { }

  public abstract init(): Promise<void>;
}
