import { Schema, type SchemaDefinition, type SchemaOptions, model } from "mongoose";

interface DefineModel<T> {
    name: string;
    schema: SchemaDefinition<T>;
    options?: SchemaOptions;
    hooks?: (schema: Schema<T>) => void;
}

export const defineModel<T>({ name, schema, options, hooks }: DefineModel<T>) {
    const newSchema = options ? new Schema<T>(schema, options as any) : new Schema<T>(schema);

    if (hooks) hooks(newSchema);

    return model<T>(name, newSchema);
}
