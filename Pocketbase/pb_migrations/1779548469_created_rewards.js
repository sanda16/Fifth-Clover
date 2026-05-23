/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2420034429",
        "help": "",
        "hidden": false,
        "id": "relation3366330803",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "trader",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select2379204530",
        "maxSelect": 0,
        "name": "reward_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Vodacom_R10",
          "MTN_R20",
          "CellC_R10, etc."
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "number451247955",
        "max": null,
        "min": null,
        "name": "points_spent",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2020696541",
    "indexes": [],
    "listRule": null,
    "name": "rewards",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2020696541");

  return app.delete(collection);
})
