// SOLO para entornos SIN acceso a npm: el cliente de IA no se usa en estas
// pruebas (ninguna prueba llama al modelo). Si algo intentara usarlo, falla.
export class GoogleGenAI {
  models: any;
  constructor(_opts: unknown) {
    this.models = new Proxy(
      {},
      {
        get() {
          throw new Error("La IA no está disponible en las pruebas (y no debería llamarse).");
        },
      }
    );
  }
}
export type Content = any;
export type Part = any;
export type FunctionDeclaration = any;
export const Type: Record<string, string> = {
  OBJECT: "OBJECT",
  STRING: "STRING",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  INTEGER: "INTEGER",
};
