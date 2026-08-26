export type Serializable =
    | string
    | number
    | boolean
    | null
    | SerializableObject
    | SerializableArray;

interface SerializableObject {
    [key: string]: Serializable;
}

interface SerializableArray extends Array<Serializable> {}
