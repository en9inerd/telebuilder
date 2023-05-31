export class DiscoveryException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DiscoveryException';
  }
}
