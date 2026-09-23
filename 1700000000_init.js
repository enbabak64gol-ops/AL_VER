migrate((app) => {
  const users = new Collection({
    type: "auth",
    name: "users",
    listRule: "id = @request.auth.id || @request.auth.role = 'main' || @request.auth.role = 'admin'",
    viewRule: "id = @request.auth.id || @request.auth.role = 'main' || @request.auth.role = 'admin'",
    createRule: "",
    updateRule: "id = @request.auth.id || @request.auth.role = 'main'",
    deleteRule: "@request.auth.role = 'main'",
    fields: [
      new TextField({name: "role", required: true, max: 20}),
      new TextField({name: "phone", max: 30}),
      new TextField({name: "displayName", max: 100}),
    ],
  });
  app.save(users);

  const listings = new Collection({
    type: "base",
    name: "listings",
    listRule: "status = 'approved' || @request.auth.role = 'main' || @request.auth.role = 'admin' || owner = @request.auth.id",
    viewRule: "status = 'approved' || @request.auth.role = 'main' || @request.auth.role = 'admin' || owner = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'main' || @request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'main'",
    fields: [
      new TextField({name: "title", required: true, max: 180}),
      new SelectField({name: "type", required: true, maxSelect: 1, values: ["ملک", "خودرو", "موتورسیکلت"]}),
      new TextField({name: "category", max: 80}),
      new TextField({name: "model", max: 100}),
      new SelectField({name: "deal", required: true, maxSelect: 1, values: ["فروش", "تهاتر", "معاوضه"]}),
      new NumberField({name: "price"}),
      new TextField({name: "city", required: true, max: 120}),
      new TextField({name: "description", max: 5000}),
      new SelectField({name: "status", required: true, maxSelect: 1, values: ["pending", "approved", "rejected", "archived"]}),
      new TextField({name: "rejectReason", max: 500}),
      new TextField({name: "publicPhone", max: 30}),
      new RelationField({name: "owner", collectionId: users.id, maxSelect: 1, required: true}),
      new FileField({name: "photos", maxSelect: 4, maxSize: 10485760, mimeTypes: ["image/jpeg", "image/png", "image/webp"]}),
      new FileField({name: "video", maxSelect: 1, maxSize: 104857600, mimeTypes: ["video/mp4", "video/webm", "video/quicktime"]}),
    ],
  });
  app.save(listings);

  const settings = new Collection({
    type: "base",
    name: "site_settings",
    listRule: "@request.auth.role = 'main' || @request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'main' || @request.auth.role = 'admin'",
    createRule: "@request.auth.role = 'main'",
    updateRule: "@request.auth.role = 'main'",
    deleteRule: "@request.auth.role = 'main'",
    fields: [
      new TextField({name: "key", required: true, max: 80}),
      new TextField({name: "value", max: 5000}),
    ],
  });
  app.save(settings);
}, (app) => {
  ["site_settings", "listings", "users"].forEach((name) => {
    const c = app.findCollectionByNameOrId(name);
    if (c) app.delete(c);
  });
});
