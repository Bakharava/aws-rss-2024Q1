import * as Yup from "yup";
export declare const ProductSchema: import("yup/lib/object").OptionalObjectSchema<{
    id: Yup.StringSchema<string | undefined, import("yup/lib/types").AnyObject, string | undefined>;
    title: import("yup/lib/string").RequiredStringSchema<string, import("yup/lib/types").AnyObject>;
    description: Yup.StringSchema<string, import("yup/lib/types").AnyObject, string>;
    price: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<{
    id: Yup.StringSchema<string | undefined, import("yup/lib/types").AnyObject, string | undefined>;
    title: import("yup/lib/string").RequiredStringSchema<string, import("yup/lib/types").AnyObject>;
    description: Yup.StringSchema<string, import("yup/lib/types").AnyObject, string>;
    price: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}>>;
export declare const AvailableProductSchema: Yup.ObjectSchema<import("yup/lib/object").Assign<{
    id: Yup.StringSchema<string | undefined, import("yup/lib/types").AnyObject, string | undefined>;
    title: import("yup/lib/string").RequiredStringSchema<string, import("yup/lib/types").AnyObject>;
    description: Yup.StringSchema<string, import("yup/lib/types").AnyObject, string>;
    price: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}, {
    count: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}>, import("yup/lib/object").AnyObject, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<{
    id: Yup.StringSchema<string | undefined, import("yup/lib/types").AnyObject, string | undefined>;
    title: import("yup/lib/string").RequiredStringSchema<string, import("yup/lib/types").AnyObject>;
    description: Yup.StringSchema<string, import("yup/lib/types").AnyObject, string>;
    price: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}, {
    count: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<{
    id: Yup.StringSchema<string | undefined, import("yup/lib/types").AnyObject, string | undefined>;
    title: import("yup/lib/string").RequiredStringSchema<string, import("yup/lib/types").AnyObject>;
    description: Yup.StringSchema<string, import("yup/lib/types").AnyObject, string>;
    price: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}, {
    count: import("yup/lib/number").DefinedNumberSchema<number, import("yup/lib/types").AnyObject>;
}>>>;
export type Product = Yup.InferType<typeof ProductSchema>;
export type AvailableProduct = Yup.InferType<typeof AvailableProductSchema>;
