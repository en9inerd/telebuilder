export function Buttons(target: never, key: string): unknown {
  const buttons = target[key];
  if (!buttons) {
    throw new Error(`@Buttons decorator can only be applied to properties that are arrays`);
  }
  if (!Array.isArray(buttons)) {
    throw new Error(`@Buttons decorator can only be applied to properties that are arrays`);
  }
  return {
    configurable: true,
    get() {
      return buttons;
    }
  };
}
