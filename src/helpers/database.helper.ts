import config from 'config';
import { connect } from 'mongoose';
import { Logger } from 'telegram';

export class DBHelper {
  private readonly connectString: string;

  constructor(private readonly log: Logger) {
    const host = config.get('dbConfig.host'),
      port = config.get('dbConfig.port'),
      name = config.get('dbConfig.name'),
      user = config.get('dbConfig.user'),
      password = config.get('dbConfig.password'),
      maxPoolSize = config.get('dbConfig.maxPoolSize');

    this.connectString = `mongodb://${user}:${password}@${host}:${port}/${name}?maxPoolSize=${maxPoolSize}&authSource=${name}`;
  }

  public async connect() {
    await connect(this.connectString).catch((err) => {
      this.log.error(err);
      process.exit(1);
    });
  }
}
