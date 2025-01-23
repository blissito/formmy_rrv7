type Serializable = Record<string, any> | string | number | boolean;

export default function useLocalStorage<
  T extends Serializable | Serializable[]
>() {
  const save = (name: string, value: T): void => {
    localStorage.setItem(name, JSON.stringify(value));
  };

  const get = (name: string): T | null => {
    const value = localStorage.getItem(name);
    return value ? JSON.parse(value) : value;
  };

  return {
    save,
    get,
  };
}
