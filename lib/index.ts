import {Model, ModelOptionsOptional} from "./Model";
import {Schema, SchemaDefinition} from "./Schema";
import Condition from "./Condition";
import transaction from "./Transaction";
import aws from "./aws";
import Internal from "./Internal";
import utils from "./utils";
import {Document} from "./Document";

import {DynamoDB} from "aws-sdk";

interface ModelDocumentConstructor<T extends Document> {
	new (object: {[key: string]: any}): T;
}
const model = <T extends Document>(name: string, schema: Schema | SchemaDefinition, options: ModelOptionsOptional = {}): T & Model<T> & ModelDocumentConstructor<T> => {
	const model: Model<T> = new Model(name, schema, options);
	const returnObject: any = model.Document;
	Object.keys(model).forEach((key) => {
		if (key !== "name") {
			returnObject[key] = model[key];
		}
	});
	Object.keys(Object.getPrototypeOf(model)).forEach((key) => {
		if (model[key].carrier) {
			const carrier = model[key].carrier(model);
			returnObject[key] = (...args) => new carrier(...args);
			returnObject[key].carrier = carrier;
		} else if (typeof model[key] === "object") {
			const main = (key: string) => {
				utils.object.set(returnObject, key, {});
				Object.keys(utils.object.get(model as any, key)).forEach((subKey) => {
					const newKey = `${key}.${subKey}`;
					if (typeof utils.object.get(model as any, newKey) === "object") {
						main(newKey);
					} else {
						utils.object.set(returnObject, newKey, (utils.object.get(model, newKey) as any).bind(model));
					}
				});
			};
			main(key);
		} else {
			returnObject[key] = model[key].bind(model);
		}
	});
	return returnObject as any;
};
model.defaults = {
	...require("./Model/defaults").custom
};

export = {
	model,
	Schema,
	Condition,
	transaction,
	aws,
	"undefined": Internal.Public.undefined
};