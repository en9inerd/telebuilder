import { StateError } from '../exceptions.js';
import { ClassType, clientInstance } from '../keys.js';
import { Constructor, HydratedModel } from '../types.js';
import { TelegramClient } from 'telegram';

class Container {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instances: Map<ClassType, Map<Constructor<any>, any>> = new Map([
    [ClassType.Service, new Map()],
    [ClassType.Command, new Map()],
    [ClassType.Model, new Map()]
  ]);
  [clientInstance]!: TelegramClient;

  public set client(instance: TelegramClient) {
    if (!this[clientInstance]) {
      this[clientInstance] = instance;
    }
  }

  public get client(): TelegramClient {
    return this[clientInstance];
  }

  public register<T>(classIdentifier: Constructor<T>, instance: T, type: ClassType): void {
    const classMap = this.getClassMap(type);
    classMap.set(classIdentifier, instance);
  }

  public resolve<T>(classIdentifier: Constructor<T>, type: ClassType): T {
    const classMap = this.getClassMap(type);

    const instance = classMap.get(classIdentifier);
    if (!instance) {
      throw new StateError(`Class instance is not registered: ${classIdentifier.name}`);
    }
    return instance;
  }

  public resolveModel<T>(classIdentifier: Constructor<T>): HydratedModel<T> {
    return <HydratedModel<T>>this.resolve(classIdentifier, ClassType.Model);
  }

  resolveAll<T>(type: ClassType): T[] {
    const classMap = this.getClassMap(type);
    return [...classMap.values()];
  }

  private getClassMap(type: ClassType) {
    const classMap = this.instances.get(type);
    if (!classMap) {
      throw new StateError(`Invalid class type: ${type}`);
    }
    return classMap;
  }
}

export const container = new Container();
