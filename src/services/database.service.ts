export abstract class BaseDBService {
  private readonly connectString!: string;
  public dbInstance!: unknown;

  public abstract init(): Promise<void>;
}
